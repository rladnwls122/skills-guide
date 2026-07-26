# mermaid 도식 AWS 아이콘 적용 + 가독성 리팩토링 설계

날짜: 2026-07-26 · 상태: 검토 대기

## 목표

문서 전체 mermaid 도식에 AWS 아이콘을 입혀 서비스 구성이 한눈에 읽히게 하고,
그 과정에서 드러난 깨진 문법·다크모드 버그를 함께 정리한다.

## 현황

| 항목 | 값 |
|---|---|
| mermaid 블록 | 43개 / 18개 파일 |
| 도식 종류 | `flowchart` 24, `graph` 13, `sequenceDiagram` 6 |
| 아이콘 적용 대상 | 37개 (`flowchart` + `graph`) |
| 아이콘 미적용 | `sequenceDiagram` 6개 — mermaid가 아이콘을 지원하지 않음 |
| mermaid 버전 | 11.16.0 |
| 통합 | `astro-mermaid` 2.1.0 (`iconPacks` 옵션 지원) |

## 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| 적용 방식 | 기존 구조 유지 + AWS 서비스 노드만 아이콘 교체 | 시안 비교 후 선택. `architecture-beta`는 엣지 라벨을 못 붙여 현 문서의 설명 밀도를 못 담음 |
| subgraph | 전부 아이콘 적용 | 시안 3 선택 |
| 아이콘 우선순위 | `logos:aws-*` → `logos:*` → `mdi:*` | AWS 공식 로고 우선, 매칭 없을 때만 일반 아이콘 |
| 아이콘 전달 | Iconify CDN (`api.iconify.design`) | 커밋할 자산도 생성 스크립트도 없음. 사용자 수가 적어 요청 예산이 넉넉함 |
| 매칭 없는 아이콘 | 유사한 다른 아이콘으로 대체 | 빈 자리로 두지 않음 |
| `graph` → `flowchart` | 통일하지 않음 | `graph`도 아이콘 문법을 그대로 처리함을 실측 확인 |
| 라벨 문구 수정 | 범위 밖 | 내용 변경이라 별도 작업 |
| 다크모드 버그 | 이번 작업에 포함 | 안 고치면 아이콘 작업 결과를 다크모드에서 판단할 수 없음 |

## 사전 검증 (브라우저 실측 완료)

| 확인 항목 | 결과 |
|---|---|
| `logos` 팩의 AWS 아이콘 | 66종 존재. kms/s3/vpc/eks/ec2/lambda/dynamodb/iam/cloudfront/cloudwatch/elb/sqs/sns/eventbridge/kinesis/api-gateway/ecs/fargate/rds/route53/secrets-manager/xray/step-functions/cloudformation/waf/cognito/elasticache/glue 포함 |
| 비AWS 아이콘 | kubernetes, docker-icon, terraform-icon, prometheus, grafana, helm, nginx 존재 |
| 35개 요청 시 누락 | 0건 (`not_found: none`) |
| 서브셋 엔드포인트 | `api.iconify.design/logos.json?icons=...` → 유효한 IconifyJSON, `registerIconPacks`에 그대로 적용됨 |
| 전송 크기 (35개 기준) | CSS 80KB / JSON 74KB (둘 다 SVG 텍스트라 압축 잘 됨) |
| subgraph `<span>` | mermaid 기본 `securityLevel: 'strict'`(DOMPurify) 통과, 데이터 URI 배경 적용, 18×18 렌더 |
| subgraph `<iconify-icon>` 웹 컴포넌트 | **DOMPurify가 제거함**. 커스텀 엘리먼트가 정상 등록된 상태에서도 태그가 통째로 사라지고 라벨 글자만 남음 |
| subgraph `<img>` | 통과하고 렌더도 되나 아이콘당 요청 1건 |
| `mdi.css?color=` | 지정한 색으로 치환됨 |
| `graph`의 아이콘 문법 | `flowchart`와 동일하게 처리됨 |

## 설계

### 1. 아이콘 목록

아이콘 이름 목록을 `src/mermaid-icons.mjs` 한 파일에 둔다. `astro.config.mjs`와 검증 스크립트가
같이 import하므로 목록이 갈라지지 않는다. 설정 파일에 직접 두면 검증 스크립트가 `astro.config.mjs`를
통째로 로드해야 하는데, 그러면 모든 integration이 딸려 들어온다.

```js
// src/mermaid-icons.mjs
export const MERMAID_ICONS = {
  logos: ['aws-kms', 'aws-s3', 'aws-vpc', /* ... */],
  mdi:   ['lan-connect', 'layers-outline', /* ... */],
};
export const iconifyUrl = (pack, ext, params = '') =>
  `https://api.iconify.design/${pack}.${ext}?icons=${MERMAID_ICONS[pack].join(',')}${params}`;
```

`api.iconify.design`의 `?icons=` 서브셋 엔드포인트를 쓴다. 커밋할 아이콘 자산도, 자산을 뽑는
생성 스크립트도 없다.

### 2. 노드 아이콘

`flowchart`/`graph`의 AWS 서비스 노드를 아이콘 셰이프로 교체한다.

```
CMK@{ icon: "logos:aws-kms", form: "square", label: "CMK<br/>키 정책이 접근 통제", pos: "b", h: 46, w: 46 }
```

`astro.config.mjs`:

```js
mermaid({
  mermaidConfig: { themeVariables: { fontSize: '18px' } },
  iconPacks: [
    { name: 'logos', url: iconifyUrl('logos', 'json') },
    { name: 'mdi',   url: iconifyUrl('mdi',   'json') },
  ],
})
```

`astro-mermaid`는 `url`을 받아 그대로 `fetch(pack.url).then(r => r.json())` 한다
(`astro-mermaid-integration.js:451`). 쿼리스트링이 붙어도 무관.

### 3. subgraph 아이콘

subgraph에는 `@{ icon: }` 문법이 없으므로 HTML 라벨을 쓴다.

```
subgraph KMS["<span class='icon--logos icon--logos--aws-kms'></span> AWS KMS"]
```

클래스를 정의하는 CSS는 `starlight({ ... })`의 `head` 옵션으로 `<link>` 두 줄을 넣어 CDN에서 받는다.

```js
starlight({
  // ...
  head: [
    { tag: 'link', attrs: { rel: 'stylesheet', href: iconifyUrl('logos', 'css') } },
    { tag: 'link', attrs: { rel: 'stylesheet', href: iconifyUrl('mdi', 'css', '&color=%238ab') } },
  ],
})
```

CSS 안의 아이콘이 데이터 URI라 아이콘 개수와 무관하게 요청은 팩당 1건이다. 웹 컴포넌트
(`<iconify-icon>`)는 DOMPurify가 제거하므로 쓰지 않고, `<img>`는 아이콘당 요청이 나가므로 쓰지 않는다.

`mdi`는 단색이라 `?color=`로 중간톤(`#8ab`)을 박는다 — 다크·라이트 양쪽에서 읽히는 값 하나로 고정.

알려진 비대칭: 같은 `mdi` 아이콘이라도 노드(JSON 팩)는 `currentColor`라 테마 글자색을 따라가고,
subgraph(CSS)는 `#8ab`로 고정된다. `logos`는 원본이 컬러라 양쪽 동일. 실제로 눈에 거슬리면
노드 쪽도 고정색으로 맞춘다.

### 4. 다크모드 수정

**증상**: 다크모드인데 도식이 라이트 테마로 그려져 글자가 검은색 계열(`.messageText{fill:#333}`,
`text.actor>tspan{fill:black}`)로 나온다.

**원인**: `astro-mermaid`가 `initMermaid()` 안에서 `data-theme`를 **초기 1회만** 읽는다
(`astro-mermaid-integration.js:509`). 그 1회를 놓치면 이후 테마를 바꾸기 전까지 라이트로 남는다.
재렌더는 `data-theme` 변경을 감시하는 MutationObserver로만 일어나므로, 사용자가 테마를 건드리지
않으면 영원히 복구되지 않는다. 재현은 간헐적이나 구조상 항상 가능한 실패다.

**수정**: `src/scripts/mermaid-fullscreen.js`에 정합성 확인을 추가한다. 렌더된 svg 루트의 `fill`
밝기로 실제 적용된 테마를 판별해 `data-theme`와 비교하고, 어긋날 때만 `data-theme`를 동기적으로
뒤집었다 되돌려 astro-mermaid 자체 observer가 재렌더하게 만든다.

무조건 재렌더시키는 방식은 쓰지 않는다 — 정상인 페이지에서도 mermaid 작업이 2배가 된다.

### 5. 가독성 리팩토링

같은 파일을 건드리는 김에 함께 정리한다.

- `\n` → `<br/>` — mermaid 11에서 `\n`은 줄바꿈이 아니라 글자로 렌더된다 (`kms-basics.mdx` 등)
- 따옴표 없는 라벨에 들어간 특수문자 정리
- 노드가 많아 가로로 넘치는 도식은 방향(`LR` ↔ `TB`) 조정, 필요하면 subgraph로 묶기

`@mermaid-js/layout-elk`는 설치만 되어 있고 어디에도 연결되지 않은 상태다. 실제로 엣지가 꼬이는
도식이 나올 때만 켜고, 아니면 그대로 둔다.

### 6. 검증

`scripts/check-mermaid-icons.mjs` — mdx 전체에서 `logos:` / `mdi:` / `icon--logos--*` /
`icon--mdi--*` 참조를 긁어 `src/mermaid-icons.mjs`의 `MERMAID_ICONS` 목록과 대조한다. 빠진 게
있으면 exit 1. 반대로 목록에만 있고 아무 도식도 안 쓰는 이름은 경고로 알린다.

아이콘 이름 하나만 틀려도 해당 노드가 깨지는데 43개 도식을 눈으로 확인할 수는 없다. 이 스크립트가
그 회귀를 막는 유일한 장치다.

브라우저 확인: 대표 페이지(kms-basics, iam-basics, 08-private-eks-iam)를 다크·라이트 양쪽에서
열어 아이콘 렌더와 글자 대비를 확인한다.

## 작업 순서

1. `src/mermaid-icons.mjs` 작성 → `astro.config.mjs`에 `iconPacks` + `head` `<link>` 연결
2. 다크모드 수정 (`mermaid-fullscreen.js`)
3. 도식 적용 — 18개 파일, 파일 단위로 진행. 새 아이콘을 쓸 때마다 `MERMAID_ICONS`에 추가
4. `scripts/check-mermaid-icons.mjs` 작성 + 통과 확인
5. 브라우저 확인 (다크·라이트)
6. 데모 파일 `public/mermaid-icon-demo.html` 삭제

## 범위 밖

- `sequenceDiagram` 6개 (mermaid 미지원)
- 노드 라벨 문구 재작성
- `graph` → `flowchart` 문법 통일
- ELK 레이아웃 도입 (필요한 도식이 나오면 그때)
