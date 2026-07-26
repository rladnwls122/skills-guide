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
- `aws` 는 자체 팩이다. `scripts/build-aws-icons.mjs` 가 AWS 공식 아이콘 패키지에서 뽑아 `src/icons/aws.json`(노드용)과 `src/styles/mermaid-aws-icons.css`(subgraph `<span>` 용) 두 파일을 만든다. 둘 다 생성물이지만 커밋한다.
- **`iconPacks` 의 `icons` 에는 IconifyJSON 전체(`{prefix, icons}`)를 넘긴다.** 안쪽 `icons` 맵만 넘기면 크기만 잡히고 body 가 비어 모든 아이콘이 빈 사각형으로 렌더된다. 빌드·검증 스크립트가 전부 통과하므로 브라우저로 봐야 드러난다.
- subgraph 용 CSS 는 아이콘을 데이터 URI 로 담는다. 아이콘 개수와 무관하게 요청은 팩당 1건이다.

## astro-mermaid 의 함정

- **`data-theme` 를 렌더 시작 시점에 한 번만 읽는다.** 그 1회를 놓치면 다크모드인데 라이트 테마로 그려지고, 재렌더는 `data-theme` 가 *바뀔 때*만 일어나므로 사용자가 테마를 건드리기 전까지 검은 글자로 남는다. `src/scripts/mermaid-fullscreen.js` 의 `syncTheme` 가 이걸 보정한다.
- **`data-diagram` 이 없는 상태에서 재렌더가 걸리면 이미 렌더된 SVG 의 textContent 를 소스로 덮어쓴다.** 그 도식은 새로고침 전까지 `No diagram type detected` 로 영구히 깨진다. 재렌더를 유도하는 코드를 쓸 때는 반드시 `data-diagram` 존재를 먼저 확인한다.
- 위 두 가지 때문에 `mermaid-fullscreen.js` 의 `syncTheme` 에는 가드가 둘 있다(`data-diagram` 확인, 페이지당 1회 제한). 지우거나 단순화하지 않는다.

## 마크다운

`markdown.gfm: false` + `remark-gfm` 을 `singleTilde: false` 로 직접 넣었다. GFM 기본값은 홑물결(`~`)도 취소선 구분자로 먹어 `D4~7`·`8~10h` 같은 범위 표기 사이가 통째로 취소선이 됐다. 되돌리지 않는다.

## CSS

`customCss` 배열의 순서가 곧 로드 순서다. 뒤에 오는 파일이 앞을 덮는다. Starlight 컴포넌트 스타일보다 나중에 로드되므로 특이도를 억지로 올릴 필요는 없지만, mermaid 가 svg 루트에 박는 `#mermaid-xxx{...}` 는 ID 선택자라 클래스 규칙으로는 못 이긴다.
