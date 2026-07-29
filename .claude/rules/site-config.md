---
paths:
  - "astro.config.mjs"
  - "src/mermaid-icons.mjs"
  - "src/styles/**"
  - "src/scripts/**"
  - "scripts/**"
---

사이트 설정과 클라이언트 스크립트. 여기서 낸 회귀는 빌드가 아니라 브라우저에서만 드러난다 — 고쳤으면 대표 페이지를 다크·라이트 양쪽에서 확인한다.

## 아이콘 팩

- `logos` · `mdi` · `simple-icons` 는 Iconify 서브셋 엔드포인트(`api.iconify.design/<pack>.json?icons=...`)에서 받는다. 목록은 `src/mermaid-icons.mjs`.
- **CDN 팩에 없는 아이콘은 외부 공식 소스에서 받아 자체 팩으로 만들고, `astro.config.mjs` 가 그 `.json` 을 import 한다.** 지금 둘 있다.
  - `aws` — AWS 공식 아키텍처 아이콘 패키지(로컬) → `scripts/build-aws-icons.mjs` → `src/icons/aws.json` + `src/styles/mermaid-aws-icons.css`
  - `k8s` — `kubernetes/community` 저장소(원격 fetch) → `scripts/build-k8s-icons.mjs` → `src/icons/k8s.json` + `src/styles/mermaid-k8s-icons.css`. `unlabeled` 변형만 받는다 — `labeled` 은 아이콘에 글자가 그려져 있어 노드 라벨과 겹친다.
- 자체 팩 산출물은 전부 생성물이지만 **커밋한다.** 빌드 때 다시 받지 않는다. 새 팩을 추가하면 `iconPacks` 와 `customCss` 양쪽에 등록하고, `scripts/check-mermaid-icons.mjs` 의 `DECLARED` 에도 넣는다.
- **`iconPacks` 의 `icons` 에는 IconifyJSON 전체(`{prefix, icons}`)를 넘긴다.** 안쪽 `icons` 맵만 넘기면 크기만 잡히고 body 가 비어 모든 아이콘이 빈 사각형으로 렌더된다. 빌드·검증 스크립트가 전부 통과하므로 브라우저로 봐야 드러난다.
- subgraph 용 CSS 는 아이콘을 데이터 URI 로 담는다. 아이콘 개수와 무관하게 요청은 팩당 1건이다.

## 도식 색은 CSS 가 낸다 — 테마로 재렌더하지 않는다

`astro.config.mjs` 에서 **`autoTheme: false`** 다. mermaid 는 항상 `default` 테마로 **한 번만** 그리고, 다크/라이트 차이는 `src/styles/mermaid-theme.css` 가 Starlight 의 `--sl-color-*` 로 낸다. 테마 전환은 브라우저의 값 재계산 한 번으로 끝난다 — JS 도, 재렌더도 없다.

**이 구조를 되돌리지 않는다.** `autoTheme` 를 켜면 아래가 전부 되살아난다.

- `data-theme` 가 바뀔 때마다 모든 도식의 `data-processed` 를 떼고 mermaid 를 통째로 다시 돌린다 — 도식 6개짜리 페이지는 테마를 누를 때마다 전부 빈 칸이 됐다 수백 ms 뒤 돌아온다.
- **`data-theme` 에 같은 값을 다시 써도** 재렌더가 걸린다(값 비교를 하지 않는다). Starlight 의 ThemeSelect 가 헤더·모바일 메뉴 두 곳에서 각각 같은 값을 쓰므로, 페이지를 열 때마다 렌더가 3벌 돈다.
- 렌더 시작 시점의 `data-theme` 를 한 번만 읽으므로, 그 1회를 놓치면 다크모드인데 라이트 색으로 굳는다.
- **`data-diagram` 이 없는 상태에서 재렌더가 걸리면 이미 렌더된 SVG 의 textContent 를 소스로 덮어쓴다.** 그 도식은 새로고침 전까지 `No diagram type detected` 로 영구히 깨진다.

색 규칙을 손볼 때:

- mermaid 는 색을 svg 안 `<style>` 에 `#mermaid-xxx .node rect{...}` 로 박는다. **ID 선택자라 특이도로는 못 이긴다** — `!important` 로 이긴다(그쪽은 `.root .anchor path` 하나 빼고 `!important` 를 쓰지 않는다).
- 선택자는 `svg[id^='mermaid-']` 로 잡는다. 전체화면 뷰어가 svg 를 `cloneNode` 해서 body 직속 오버레이에 붙이므로, `pre.mermaid` 기준으로 잡으면 거기서 색이 빠진다.
- 라벨은 foreignObject 안 HTML 이라 `fill` 과 `color` 를 **둘 다** 덮어야 한다. mermaid 의 `#mermaid-x span{color:...}` 는 라벨 안 span 에 직접 걸리므로 상속으로는 못 이긴다 — `span`·`p` 를 직접 훑는다.
- 아이콘 노드(`form: "square"`)의 사각형은 roughjs path 두 장이고 모서리 반경이 0.1px 로 박혀 있다. `mermaid-fullscreen.js` 의 `roundIconBox` 가 같은 자리 `<rect class="mfs-icon-box">` 한 장으로 갈아끼워 `rx` 와 색을 CSS 로 넘긴다.

## 도식 안에서 전이(transition) 금지

`*` 에 `transition-duration` 을 거는 규칙이 하나라도 살아 있으면 mermaid 의 `viewBox` 계산이 깨진다. mermaid 는 노드에 `transform` 을 얹은 직후 `getBBox()` 로 크기를 재는데, 그 `transform` 이 전이 중이면 배치 전 좌표가 잡혀 `viewBox` 가 8배 넘게 부푼다(2노드 도식 2067x2044, subgraph 가 끼면 16451x16428). 도식은 프레임 한구석의 점이 되고 좁은 화면에서는 빈 칸으로 보인다.

`starlight-theme-exquisitus` 의 reduced-motion 블록이 정확히 그 규칙이라, **동작 줄이기를 켠 기기(모바일에 흔하다)에서만** 재현된다. `src/styles/mermaid.css` 가 `@layer base` 안에서 되돌린다 — `!important` 끼리는 레이어 우선순위가 뒤집혀 먼저 선언된 레이어가 이기므로, 레이어 밖에 쓰면 진다.

## 마크다운

`markdown.gfm: false` + `remark-gfm` 을 `singleTilde: false` 로 직접 넣었다. GFM 기본값은 홑물결(`~`)도 취소선 구분자로 먹어 `D4~7`·`8~10h` 같은 범위 표기 사이가 통째로 취소선이 됐다. 되돌리지 않는다.

## CSS

`customCss` 배열의 순서가 곧 로드 순서다. 뒤에 오는 파일이 앞을 덮는다. Starlight 컴포넌트 스타일보다 나중에 로드되므로 특이도를 억지로 올릴 필요는 없지만, mermaid 가 svg 루트에 박는 `#mermaid-xxx{...}` 는 ID 선택자라 클래스 규칙으로는 못 이긴다.
