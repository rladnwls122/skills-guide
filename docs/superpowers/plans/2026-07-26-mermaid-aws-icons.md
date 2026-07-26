# mermaid AWS 아이콘 적용 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 문서 37개 mermaid 도식(`flowchart`/`graph`)에 AWS 아이콘을 입히고, 다크모드에서 도식이 라이트 테마로 남는 버그와 라벨 문법 오류를 함께 고친다.

**Architecture:** 아이콘은 Iconify CDN 서브셋 엔드포인트에서 받는다. 노드는 mermaid 아이콘 셰이프(`@{ icon: }`)가 아이콘 팩 JSON을 쓰고, subgraph는 `@{ icon: }` 문법이 없으므로 CDN CSS가 정의한 클래스를 `<span>`으로 붙인다. 아이콘 이름 목록은 `src/mermaid-icons.mjs` 한 곳에 두고 설정과 검증 스크립트가 함께 import한다.

**Tech Stack:** Astro 7 + Starlight 0.41 · astro-mermaid 2.1.0 · mermaid 11.16.0 · Expressive Code (Starlight 내장) · Iconify API

## Global Constraints

- 아이콘 우선순위: `logos:aws-*` → `logos:*` → `mdi:*`. 매칭이 없으면 유사한 아이콘으로 대체하고 빈 자리로 두지 않는다.
- `sequenceDiagram` 6개는 손대지 않는다. mermaid가 아이콘을 지원하지 않는다.
- `graph` → `flowchart` 문법 통일을 하지 않는다. `graph`도 아이콘 문법을 그대로 처리한다.
- 노드 라벨의 **문구**는 바꾸지 않는다. 문법(`\n` → `<br/>`)만 고친다.
- 아이콘 자산을 레포에 커밋하지 않는다. 전부 CDN에서 받는다.
- 아이콘 셰이프 규격은 `form: "square", pos: "b", h: 46, w: 46` 로 통일한다.
- subgraph 아이콘 크기는 `width='18'` 에 해당하는 `font-size: 18px` 로 통일한다.
- mermaid `securityLevel`은 기본값(`strict`)을 유지한다. 낮추지 않는다.
- 커밋 메시지는 한국어로 쓰고 `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` 와 `Claude-Session: https://claude.ai/code/session_01RYioRKL9Tqx95Di41fY9oE` 두 줄로 끝낸다.

## 파일 구조

| 파일 | 역할 |
|---|---|
| `src/mermaid-icons.mjs` (신규) | 아이콘 이름 목록과 Iconify URL 생성 함수. 설정·검증 스크립트의 단일 출처 |
| `astro.config.mjs` (수정) | `iconPacks` 등록 + `head` 에 CSS `<link>` 두 줄 |
| `src/scripts/mermaid-fullscreen.js` (수정) | 테마 정합성 확인 추가 |
| `src/styles/code-language-label.css` (신규) | 코드블록 좌측 상단 언어 라벨 |
| `scripts/check-mermaid-icons.mjs` (신규) | 도식이 쓰는 아이콘이 목록에 있는지 검증 |
| `src/content/docs/**/*.mdx` (수정) | 도식 18개 파일 |

---

### Task 1: 아이콘 목록 모듈 + 설정 연결

**Files:**
- Create: `src/mermaid-icons.mjs`
- Modify: `astro.config.mjs`

**Interfaces:**
- Produces: `MERMAID_ICONS` (`{ logos: string[], mdi: string[] }`), `iconifyUrl(pack, ext, params?)` → `string`. Task 4의 검증 스크립트가 둘 다 import한다.

- [ ] **Step 1: 아이콘 목록 모듈 작성**

`src/mermaid-icons.mjs`:

```js
/**
 * mermaid 도식이 쓰는 아이콘 목록.
 *
 * 노드는 아이콘 팩 JSON(`@{ icon: "logos:aws-s3" }`)을, subgraph 는 CSS 클래스
 * (`<span class='icon--logos icon--logos--aws-s3'>`)를 쓴다. 둘 다 이 목록에서
 * 만든 URL로 받으므로 이름이 갈라지지 않는다.
 *
 * 목록에 없는 아이콘을 도식에서 쓰면 그 노드가 깨진다 —
 * scripts/check-mermaid-icons.mjs 가 그 회귀를 막는다.
 */
export const MERMAID_ICONS = {
  logos: [
    'aws-kms', 'aws-s3', 'aws-vpc', 'aws-eks', 'aws-ec2', 'aws-lambda',
    'aws-dynamodb', 'aws-iam', 'aws-cloudfront', 'aws-cloudwatch', 'aws-elb',
    'aws-sqs', 'aws-sns', 'aws-eventbridge', 'aws-kinesis', 'aws-api-gateway',
    'aws-ecs', 'aws-fargate', 'aws-rds', 'aws-route53', 'aws-secrets-manager',
    'aws-xray', 'aws-step-functions', 'aws-cloudformation', 'aws-waf',
    'aws-cognito', 'aws-elasticache', 'aws-glue',
    'kubernetes', 'docker-icon', 'terraform-icon', 'prometheus', 'grafana',
    'helm', 'nginx',
  ],
  mdi: [
    'lan-connect', 'layers-outline',
  ],
};

/** Iconify 서브셋 엔드포인트 URL. 아이콘 개수와 무관하게 팩당 요청 1건. */
export const iconifyUrl = (pack, ext, params = '') =>
  `https://api.iconify.design/${pack}.${ext}?icons=${MERMAID_ICONS[pack].join(',')}${params}`;
```

- [ ] **Step 2: 목록이 실제로 존재하는 아이콘인지 확인**

Run:

```bash
node -e "
import('./src/mermaid-icons.mjs').then(async ({ MERMAID_ICONS, iconifyUrl }) => {
  for (const pack of Object.keys(MERMAID_ICONS)) {
    const j = await fetch(iconifyUrl(pack, 'json')).then(r => r.json());
    const missing = j.not_found || [];
    console.log(pack, 'resolved', Object.keys(j.icons || {}).length, '| missing:', missing.join(',') || 'none');
    if (missing.length) process.exit(1);
  }
});
"
```

Expected: 두 팩 모두 `missing: none`. 하나라도 뜨면 그 이름을 존재하는 유사 아이콘으로 바꾸고 다시 돌린다.

- [ ] **Step 3: astro.config.mjs 에 연결**

`astro.config.mjs` 최상단 import 블록에 추가:

```js
import { iconifyUrl } from './src/mermaid-icons.mjs';
```

`mermaid({ ... })` 호출을 다음으로 교체:

```js
mermaid({
  mermaidConfig: {
    themeVariables: {
      fontSize: '18px',
    },
  },
  iconPacks: [
    { name: 'logos', url: iconifyUrl('logos', 'json') },
    { name: 'mdi', url: iconifyUrl('mdi', 'json') },
  ],
}),
```

`starlight({ ... })` 의 `components:` 줄 바로 앞에 `head` 를 추가:

```js
    /* subgraph 라벨의 <span class='icon--logos--*'> 를 정의하는 CSS.
       아이콘이 데이터 URI 로 들어 있어 아이콘 개수와 무관하게 요청은 팩당 1건이다.
       mdi 는 단색이라 색을 박아야 한다 — 다크·라이트 양쪽에서 읽히는 중간톤으로 고정. */
    head: [
      { tag: 'link', attrs: { rel: 'stylesheet', href: iconifyUrl('logos', 'css') } },
      { tag: 'link', attrs: { rel: 'stylesheet', href: iconifyUrl('mdi', 'css', '&color=%238ab') } },
    ],
```

- [ ] **Step 4: 아이콘이 실제로 렌더되는지 확인**

`src/content/docs/start/kms-basics.mdx` 의 첫 `flowchart` 블록에서 `CMK` 노드 한 줄만 임시로 교체:

```
        CMK@{ icon: "logos:aws-kms", form: "square", label: "CMK (wskorea26-s3-key)<br/>키 정책이 접근 통제", pos: "b", h: 46, w: 46 }
```

그 아래 `subgraph KMS` 줄을 임시로 교체:

```
    subgraph KMS["<span class='icon--logos icon--logos--aws-kms'></span> AWS KMS"]
```

Run: `npm run dev` 후 브라우저에서 `http://localhost:4321/start/kms-basics/` 열기

Expected: CMK 노드 자리에 KMS 로고가 그려지고 그 아래 라벨이 두 줄로 나온다. subgraph 제목 왼쪽에도 같은 로고가 붙는다. 콘솔에 mermaid 에러가 없다.

확인되면 이 임시 수정은 **되돌리지 않는다** — Task 5에서 이 파일을 마저 작업한다.

- [ ] **Step 5: 커밋**

```bash
git add src/mermaid-icons.mjs astro.config.mjs src/content/docs/start/kms-basics.mdx
git commit -F - <<'MSG'
feat: mermaid 아이콘 팩 등록 + subgraph 아이콘 CSS 연결

아이콘 이름 목록을 src/mermaid-icons.mjs 로 분리해 설정과 검증 스크립트가
같이 쓰게 한다. 노드는 Iconify 서브셋 JSON, subgraph 는 같은 엔드포인트의
CSS 클래스를 쓴다. 아이콘이 데이터 URI 라 팩당 요청 1건.

kms-basics 의 도식 하나로 렌더를 확인했다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RYioRKL9Tqx95Di41fY9oE
MSG
```

---

### Task 2: 다크모드 테마 정합성 수정

**Files:**
- Modify: `src/scripts/mermaid-fullscreen.js`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (부수효과만)

**배경 — 반드시 읽을 것:**

`astro-mermaid` 는 `initMermaid()` 안에서 `data-theme` 를 **초기 1회만** 읽는다
(`node_modules/astro-mermaid/astro-mermaid-integration.js:509`). 그 1회를 놓치면 도식이 라이트
테마로 그려지고, 재렌더는 `data-theme` **변경**을 감시하는 MutationObserver로만 일어나므로
사용자가 테마를 건드리기 전까지 검은 글자로 남는다.

같은 파일 `:534` 에 함정이 하나 더 있다:

```js
if (!diagram.hasAttribute('data-diagram')) {
  diagram.setAttribute('data-diagram', diagram.textContent || '');
}
```

`data-diagram` 이 없는 상태에서 재렌더가 걸리면 **이미 렌더된 SVG 의 textContent** 를 소스로
저장해버린다. 그러면 그 도식은 새로고침 전까지 `No diagram type detected` 로 영구히 깨진다.
실측으로 재현 확인했다. 그러므로 재렌더를 유도하기 전에 반드시 `data-diagram` 존재를 확인한다.

- [ ] **Step 1: 정합성 확인 함수 추가**

`src/scripts/mermaid-fullscreen.js` 의 `function scan()` 정의 **바로 위**에 추가:

```js
/*
 * astro-mermaid 는 렌더 시작 시점에 data-theme 를 한 번만 읽는다. 그 1회를 놓치면
 * 다크모드인데 라이트 테마로 그려져 글자가 검은색으로 남고, 재렌더는 data-theme 가
 * '바뀔 때'만 일어나므로 사용자가 테마를 건드리기 전까지 복구되지 않는다.
 *
 * 렌더 결과의 실제 테마를 svg 루트 fill 밝기로 읽어(다크 테마는 밝은 글자색) 문서
 * 테마와 어긋날 때만 data-theme 를 동기적으로 뒤집었다 되돌린다. 두 번의 변경이
 * 한 번의 MutationObserver 콜백으로 합쳐져 최종값으로 재렌더된다.
 *
 * 무조건 재렌더시키지 않는 이유: 정상인 페이지에서도 mermaid 작업이 2배가 된다.
 */
let themeRepairDone = false;

function isLightFill(color) {
	const [r, g, b] = (color.match(/\d+/g) || []).map(Number);
	if (r === undefined) return null;
	return 0.299 * r + 0.587 * g + 0.114 * b > 128;
}

function syncTheme() {
	// 페이지당 한 번만 시도한다. 재렌더된 svg 에는 표시가 없어 다시 검사 대상이 되므로,
	// 판별이 틀리면(또는 mermaid 가 예상과 다른 색을 쓰면) 재렌더가 무한히 반복된다.
	if (themeRepairDone) return;

	const html = document.documentElement;
	if (!html.dataset.theme) return;
	const wantDark = html.dataset.theme === "dark";

	const rendered = document.querySelectorAll("pre.mermaid[data-processed]");
	if (!rendered.length) return;

	// data-diagram 이 없는 도식이 하나라도 있으면 손대지 않는다 — 재렌더가 걸리면
	// astro-mermaid 가 렌더된 SVG 를 소스로 덮어써 그 도식이 영구히 깨진다.
	for (const pre of rendered) {
		if (!pre.getAttribute("data-diagram")) return;
	}

	const svg = rendered[0].querySelector("svg");
	if (!svg) return;

	const light = isLightFill(getComputedStyle(svg).fill);
	if (light === null) return;
	themeRepairDone = true;
	if (light === wantDark) return; // 밝은 글자 = 다크 테마. 일치하면 할 일 없음

	const current = html.dataset.theme;
	html.dataset.theme = current === "dark" ? "light" : "dark";
	html.dataset.theme = current;
}
```

Starlight 의 뷰 트랜지션으로 페이지가 갈리면 도식도 새로 렌더되므로 플래그를 되돌려야 한다.
파일 맨 아래 `document.addEventListener("astro:page-load", scan);` 줄을 다음으로 교체:

```js
// Starlight 의 뷰 트랜지션으로 페이지가 갈릴 때도 다시 건다.
document.addEventListener("astro:page-load", () => {
	themeRepairDone = false;
	scan();
});
```

- [ ] **Step 2: scan() 에서 호출**

`scan()` 을 다음으로 교체:

```js
function scan() {
	document.querySelectorAll("pre.mermaid").forEach(decorate);
	document.querySelectorAll("pre.mermaid svg").forEach(sizeSvg);
	syncTheme();
}
```

- [ ] **Step 3: 정상 페이지에서 재렌더가 일어나지 않는지 확인**

Run: `npm run dev` 후 브라우저 콘솔에서

```js
const before = document.querySelector('pre.mermaid svg').id;
await new Promise(r => setTimeout(r, 2000));
document.querySelector('pre.mermaid svg').id === before
```

Expected: `true` — 테마가 이미 맞으므로 재렌더가 없다. svg id 가 바뀌면 불필요한 재렌더가 일어난 것이다.

- [ ] **Step 4: 어긋난 상태가 실제로 복구되는지 확인**

실제 경쟁 조건은 의도적으로 만들기 어려우므로, 판별기에 라이트 테마로 보이게 만들어 복구 경로를 태운다.
다크모드에서 페이지를 연 뒤 브라우저 콘솔에서:

```js
// 판별기가 보는 값(svg 루트 fill)만 라이트 테마처럼 속인다
const fake = document.createElement('style');
fake.textContent = 'pre.mermaid svg { fill: rgb(51,51,51); }';
document.head.appendChild(fake);

const idBefore = document.querySelector('pre.mermaid svg').id;
// scan() 을 유발한다
document.body.appendChild(document.createElement('span')).remove();
await new Promise(r => setTimeout(r, 1800));
fake.remove();

const svg = document.querySelector('pre.mermaid svg');
({ reRendered: svg.id !== idBefore, theme: document.documentElement.dataset.theme,
   sourceIntact: !document.querySelector('pre.mermaid').textContent.includes('No diagram type detected') })
```

Expected: `{ reRendered: true, theme: 'dark', sourceIntact: true }` — 어긋남을 감지해 재렌더를 유도했고,
문서 테마는 원래대로 돌아왔으며, 소스는 오염되지 않았다.

이어서 무한 반복이 없는지 확인한다 (같은 콘솔에서):

```js
const id1 = document.querySelector('pre.mermaid svg').id;
await new Promise(r => setTimeout(r, 3000));
document.querySelector('pre.mermaid svg').id === id1
```

Expected: `true` — 페이지당 1회 제한이 걸려 더 이상 재렌더되지 않는다.

- [ ] **Step 5: data-diagram 가드가 동작하는지 확인**

브라우저 콘솔에서:

페이지를 새로 고친 뒤 (앞 단계에서 1회 제한이 소진됐으므로) 콘솔에서:

```js
const pre = document.querySelector('pre.mermaid');
pre.removeAttribute('data-diagram');
const fake = document.createElement('style');
fake.textContent = 'pre.mermaid svg { fill: rgb(51,51,51); }';
document.head.appendChild(fake);
// scan() 을 유발한다
document.body.appendChild(document.createElement('span')).remove();
await new Promise(r => setTimeout(r, 1800));
fake.remove();
pre.textContent.includes('No diagram type detected')
```

Expected: `false` — 가드가 재렌더를 막아 소스가 오염되지 않는다.
가드가 없으면 astro-mermaid 가 렌더된 SVG 를 소스로 저장해 `true` 가 된다 (실측으로 재현 확인함).

- [ ] **Step 6: 커밋**

```bash
git add src/scripts/mermaid-fullscreen.js
git commit -F - <<'MSG'
fix: 다크모드에서 도식이 라이트 테마로 남는 문제

astro-mermaid 는 렌더 시작 시점에 data-theme 를 한 번만 읽는다. 그 1회를
놓치면 재렌더가 data-theme 변경으로만 일어나므로 사용자가 테마를 건드리기
전까지 검은 글자로 남는다.

렌더 결과의 실제 테마를 svg 루트 fill 밝기로 읽어 문서 테마와 어긋날 때만
재렌더를 유도한다. data-diagram 이 없는 도식이 있으면 손대지 않는다 —
그 상태에서 재렌더가 걸리면 astro-mermaid 가 렌더된 SVG 를 소스로 덮어써
도식이 영구히 깨진다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RYioRKL9Tqx95Di41fY9oE
MSG
```

---

### Task 3: 코드블록 좌측 상단 언어 라벨

**Files:**
- Create: `src/styles/code-language-label.css`
- Modify: `astro.config.mjs` (`customCss` 배열)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

**배경:** Starlight 의 Expressive Code 는 코드블록을 `<figure class="frame">` 으로 감싸고
`<pre data-language="bash">` 에 언어를 담는다. 프레임은 세 형태로 나온다 (실측):

| 클래스 | 헤더 | 예시 |
|---|---|---|
| `frame` | `figcaption` 이 `display: none` — 헤더 없음 | hcl, yaml, python |
| `frame has-title` | 헤더 있음, 파일명 표시 | `variables.tf` |
| `frame is-terminal` | 헤더 있음, 제목 비어 있음 | bash, powershell |

`pre` 는 `position: static` 이므로 `pre::before` 의 기준 박스는 `figure` 가 된다 — 코드가
가로로 스크롤돼도 라벨이 따라 움직이지 않는다. `expressive-code-language-badge` 플러그인은
배지를 `right: 0.5rem` 에 고정하고 위치 옵션이 없어 쓰지 않는다.

- [ ] **Step 1: CSS 작성**

`src/styles/code-language-label.css`:

```css
/* 코드블록 좌측 상단에 언어 표시 (```bash → "bash")

   Expressive Code 는 언어를 <pre data-language="..."> 에 담는데, 헤더인
   <figcaption> 은 pre 의 형제라 attr() 로 그 값을 읽을 수 없다. pre 가
   position:static 이라 pre::before 의 기준 박스는 figure 가 되므로,
   figure 를 기준으로 절대배치하면 코드가 가로 스크롤돼도 라벨은 제자리에 있다. */

.expressive-code figure.frame {
	position: relative;
}

/* 헤더가 없는 프레임(hcl·yaml·python 등)에는 라벨이 앉을 줄을 만든다.
   이걸 안 하면 라벨이 코드 첫 줄 위에 겹친다. */
.expressive-code figure.frame:not(.has-title):not(.is-terminal) > figcaption.header {
	display: block;
	min-height: 1.7rem;
}

.expressive-code figure.frame > pre::before {
	content: attr(data-language);
	position: absolute;
	inset-block-start: 0.45rem;
	inset-inline-start: 0.9rem;
	font-size: 0.7rem;
	line-height: 1;
	letter-spacing: 0.04em;
	color: var(--sl-color-gray-3);
	pointer-events: none;
}

/* 파일명이 이미 왼쪽을 쓰는 프레임은 언어를 오른쪽으로 보낸다.
   3rem 은 복사 버튼 자리를 피하기 위한 값. */
.expressive-code figure.frame.has-title > pre::before {
	inset-inline-start: auto;
	inset-inline-end: 3rem;
}
```

- [ ] **Step 2: customCss 에 등록**

`astro.config.mjs` 의 `customCss` 배열에서 `'./src/styles/mermaid.css',` 줄 **바로 뒤**에 추가:

```js
      './src/styles/code-language-label.css',
```

- [ ] **Step 3: 세 가지 프레임 형태 모두 확인**

Run: `npm run dev` 후 `http://localhost:4321/part-1/01-terraform-vpc/theory/` 열기
(이 페이지에 `frame`(hcl), `frame has-title`(variables.tf), `frame is-terminal`(powershell) 이 모두 있다)

브라우저 콘솔에서:

```js
[...document.querySelectorAll('.expressive-code figure.frame')].map(f => ({
  cls: f.className,
  label: getComputedStyle(f.querySelector('pre'), '::before').content,
}))
```

Expected: 모든 항목의 `label` 이 `"hcl"` / `"powershell"` 처럼 언어 이름이다. `"none"` 이 있으면 안 된다.

눈으로도 확인한다: 라벨이 코드 글자와 겹치지 않고, 파일명이 있는 블록은 라벨이 오른쪽에 있고, 다크·라이트 양쪽에서 읽힌다.

- [ ] **Step 4: 커밋**

```bash
git add src/styles/code-language-label.css astro.config.mjs
git commit -F - <<'MSG'
feat: 코드블록 좌측 상단에 언어 표시

Expressive Code 는 언어를 pre[data-language] 에 담는데 헤더는 그 형제라
attr() 로 못 읽는다. pre 가 position:static 이라 pre::before 의 기준 박스가
figure 가 되는 것을 이용해, 코드가 가로 스크롤돼도 라벨이 제자리에 남게 했다.

헤더가 없는 프레임에는 라벨이 앉을 줄을 만들고, 파일명이 이미 있는 프레임은
언어를 오른쪽으로 보낸다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RYioRKL9Tqx95Di41fY9oE
MSG
```

---

### Task 4: 아이콘 목록 검증 스크립트

**Files:**
- Create: `scripts/check-mermaid-icons.mjs`
- Modify: `package.json` (`scripts` 에 `check:icons` 추가)

**Interfaces:**
- Consumes: Task 1의 `MERMAID_ICONS` (`src/mermaid-icons.mjs`)
- Produces: `npm run check:icons` — 도식이 쓰는 아이콘이 목록에 없으면 exit 1

**왜 필요한가:** 아이콘 이름을 하나만 틀려도 그 노드가 깨지는데, 37개 도식을 눈으로 확인할 수는 없다. Task 5에서 파일을 하나씩 작업하는 동안 이 스크립트가 유일한 회귀 방지 장치다. Task 5보다 **먼저** 만든다.

- [ ] **Step 1: 스크립트 작성**

`scripts/check-mermaid-icons.mjs`:

```js
/**
 * 도식이 쓰는 아이콘이 src/mermaid-icons.mjs 목록에 있는지 검사한다.
 *
 * 목록에 없는 아이콘을 쓰면 그 노드가 조용히 깨진다 — 빌드는 통과하고
 * 브라우저에서만 티가 나므로 자동 검사가 필요하다.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MERMAID_ICONS } from '../src/mermaid-icons.mjs';

const CONTENT_DIR = 'src/content/docs';

/** 노드 아이콘: icon: "logos:aws-s3" · subgraph 아이콘: icon--logos--aws-s3 */
const NODE_ICON = /icon:\s*["']([a-z0-9-]+):([a-z0-9-]+)["']/g;
const SPAN_ICON = /icon--([a-z0-9]+)--([a-z0-9-]+)/g;

async function* mdxFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* mdxFiles(path);
    else if (entry.name.endsWith('.mdx')) yield path;
  }
}

const used = new Map(); // "pack:name" -> Set<file>

for await (const file of mdxFiles(CONTENT_DIR)) {
  const text = await readFile(file, 'utf8');
  for (const re of [NODE_ICON, SPAN_ICON]) {
    for (const [, pack, name] of text.matchAll(re)) {
      const key = `${pack}:${name}`;
      if (!used.has(key)) used.set(key, new Set());
      used.get(key).add(file);
    }
  }
}

const missing = [];
for (const [key, files] of used) {
  const [pack, name] = key.split(':');
  if (!MERMAID_ICONS[pack]?.includes(name)) {
    missing.push(`  ${key}  ←  ${[...files].join(', ')}`);
  }
}

const declared = Object.entries(MERMAID_ICONS).flatMap(([p, names]) => names.map((n) => `${p}:${n}`));
const unused = declared.filter((key) => !used.has(key));

if (unused.length) {
  console.warn(`목록에만 있고 아무 도식도 안 쓰는 아이콘 ${unused.length}개:\n  ${unused.join(', ')}`);
}

if (missing.length) {
  console.error(`목록에 없는 아이콘 ${missing.length}개 — src/mermaid-icons.mjs 에 추가할 것:\n${missing.join('\n')}`);
  process.exit(1);
}

console.log(`아이콘 ${used.size}종 전부 목록에 있음.`);
```

- [ ] **Step 2: package.json 에 스크립트 추가**

`"font": "python scripts/subset-font.py"` 줄 **뒤**에 추가 (앞 줄 끝에 쉼표를 붙일 것):

```json
    "check:icons": "node scripts/check-mermaid-icons.mjs"
```

- [ ] **Step 3: 통과하는지 확인**

Run: `npm run check:icons`

Expected: Task 1에서 kms-basics 에 아이콘 2개(`logos:aws-kms` 노드 + subgraph)를 넣었으므로
`아이콘 1종 전부 목록에 있음.` 과 나머지 미사용 아이콘 경고가 나온다. exit code 0.

- [ ] **Step 4: 실패도 하는지 확인**

`src/content/docs/start/kms-basics.mdx` 의 아이콘 이름을 일부러 틀린 값으로 바꾼다:

```
        CMK@{ icon: "logos:aws-kmsX", form: "square", label: "CMK (wskorea26-s3-key)<br/>키 정책이 접근 통제", pos: "b", h: 46, w: 46 }
```

Run: `npm run check:icons`

Expected: exit code 1, `목록에 없는 아이콘 1개 — ... logos:aws-kmsX ← src/content/docs/start/kms-basics.mdx`

확인 후 원래 이름(`logos:aws-kms`)으로 되돌린다.

- [ ] **Step 5: 커밋**

```bash
git add scripts/check-mermaid-icons.mjs package.json
git commit -F - <<'MSG'
feat: 도식 아이콘 이름 검증 스크립트

목록에 없는 아이콘을 쓰면 그 노드가 조용히 깨진다 — 빌드는 통과하고
브라우저에서만 티가 난다. 37개 도식을 눈으로 확인할 수 없으므로
npm run check:icons 로 자동 검사한다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RYioRKL9Tqx95Di41fY9oE
MSG
```

---

### Task 5: 도식에 아이콘 적용 + 문법 정리

**Files:**
- Modify: `src/content/docs/start/kms-basics.mdx` (2), `src/content/docs/start/iam-basics.mdx` (1),
  `src/content/docs/start/vpc-basics.mdx` (1), `src/content/docs/start/k8s-basics.mdx` (2),
  `src/content/docs/start/docker-basics.mdx` (1), `src/content/docs/start/awscli-basics.mdx` (1),
  `src/content/docs/start/shell-basics.mdx` (1),
  `src/content/docs/part-1/01-terraform-vpc/theory.mdx` (1),
  `src/content/docs/part-1/02-kms-s3-cloudfront/theory.mdx` (4),
  `src/content/docs/part-1/03-container-lambda-dynamodb/theory.mdx` (3),
  `src/content/docs/part-2/04-eksctl-cluster/theory.mdx` (4),
  `src/content/docs/part-2/05-k8s-workloads-alb/theory.mdx` (3),
  `src/content/docs/part-2/06-full-deploy-set02/theory.mdx` (3),
  `src/content/docs/part-3/07-observability/theory.mdx` (4),
  `src/content/docs/part-3/08-private-eks-iam/theory.mdx` (6),
  `src/content/docs/part-4/09-serverless-event/theory.mdx` (2),
  `src/content/docs/part-4/10-scaling-logging-streaming/theory.mdx` (3),
  `src/content/docs/part-5/13-mock-exam/theory.mdx` (1)

**Interfaces:**
- Consumes: Task 1의 `MERMAID_ICONS`, Task 4의 `npm run check:icons`
- Produces: 없음

**작업 규칙 (모든 파일에 동일 적용):**

1. `flowchart` / `graph` 블록만 손댄다. `sequenceDiagram` 은 건너뛴다.
2. AWS 서비스를 가리키는 노드를 아이콘 셰이프로 바꾼다. 라벨 문구는 그대로 옮긴다:

   ```
   S3@{ icon: "logos:aws-s3", form: "square", label: "S3 버킷<br/>정적 호스팅", pos: "b", h: 46, w: 46 }
   ```

   개념·데이터·행위를 가리키는 노드(`데이터 키 DEK`, `실제 데이터` 등)는 아이콘 없이 둔다.
3. 모든 `subgraph` 라벨 앞에 아이콘 `<span>` 을 붙인다:

   ```
   subgraph KMS["<span class='icon--logos icon--logos--aws-kms'></span> AWS KMS"]
   ```

   `subgraph NAME` 처럼 라벨이 없던 것은 대괄호 라벨을 새로 만든다.
4. 라벨 안의 `\n` 을 `<br/>` 로 바꾼다. mermaid 11 에서 `\n` 은 줄바꿈이 아니라 글자로 렌더된다.
5. 새 아이콘을 쓸 때마다 `src/mermaid-icons.mjs` 의 `MERMAID_ICONS` 에 이름을 추가한다.
6. 아이콘 우선순위: `logos:aws-*` → `logos:*` → `mdi:*`. AWS 로고에 없는 개념(서브넷·계층 등)만 `mdi`.

- [ ] **Step 1: 한 파일 작업**

`src/content/docs/start/kms-basics.mdx` 부터 시작한다 (Task 1에서 일부 적용 완료). 위 규칙 6개를 그 파일의 모든 `flowchart`/`graph` 블록에 적용한다.

`kms-basics.mdx` 의 첫 도식 완성형 예시:

```
flowchart LR
    subgraph KMS["<span class='icon--logos icon--logos--aws-kms'></span> AWS KMS"]
        CMK@{ icon: "logos:aws-kms", form: "square", label: "CMK (wskorea26-s3-key)<br/>키 정책이 접근 통제", pos: "b", h: 46, w: 46 }
    end
    subgraph 서비스["<span class='icon--mdi icon--mdi--layers-outline'></span> S3 / DynamoDB / EKS"]
        DEK["데이터 키 DEK"]
        DATA["실제 데이터"]
    end
    CMK -->|GenerateDataKey| DEK
    DEK -->|암호화| DATA
    CMK -->|암호화된 DEK 를 Decrypt| DEK
```

- [ ] **Step 2: 검증 스크립트 통과 확인**

Run: `npm run check:icons`

Expected: exit code 0. `목록에 없는 아이콘` 이 뜨면 그 이름을 `src/mermaid-icons.mjs` 에 추가하고 다시 돌린다.

- [ ] **Step 3: 브라우저에서 그 페이지 확인**

Run: `npm run dev` 후 해당 페이지를 다크·라이트 양쪽에서 연다.

Expected: 아이콘이 전부 그려지고, `\n` 이 글자로 보이지 않으며, 도식이 본문 폭을 크게 넘지 않는다.
가로로 심하게 넘치면 `flowchart LR` 을 `flowchart TB` 로 바꾸거나 관련 노드를 `subgraph` 로 묶는다.

- [ ] **Step 4: 그 파일만 커밋**

```bash
git add src/mermaid-icons.mjs src/content/docs/start/kms-basics.mdx
git commit -F - <<'MSG'
feat: kms-basics 도식에 AWS 아이콘 적용

노드는 mermaid 아이콘 셰이프, subgraph 는 span 클래스를 쓴다.
라벨의 \n 은 <br/> 로 바꿨다 — mermaid 11 에서 \n 은 줄바꿈이 아니라
글자로 렌더된다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RYioRKL9Tqx95Di41fY9oE
MSG
```

- [ ] **Step 5: 나머지 17개 파일에 Step 1~4 반복**

파일 목록은 이 Task 의 **Files** 절에 있다. 한 파일당 Step 1→2→3→4 를 온전히 돌리고 다음 파일로 넘어간다.
여러 파일을 모아서 커밋하지 않는다 — 도식이 깨졌을 때 어느 파일인지 바로 좁힐 수 있어야 한다.

---

### Task 6: 마무리 확인 + 데모 파일 삭제

**Files:**
- Delete: `public/mermaid-icon-demo.html`

**Interfaces:**
- Consumes: Task 1~5 전부

- [ ] **Step 1: 전체 검증**

```bash
npm run check:icons && npm run build
```

Expected: 둘 다 exit code 0. `starlightLinksValidator` 도 함께 도므로 링크 깨짐도 여기서 걸린다.

- [ ] **Step 2: 대표 페이지 눈으로 확인**

Run: `npm run dev` 후 다크·라이트 양쪽에서 확인:

- `http://localhost:4321/start/kms-basics/` — flowchart + sequenceDiagram 혼재
- `http://localhost:4321/start/iam-basics/` — sequenceDiagram 만 (아이콘 없이 글자가 읽히는지)
- `http://localhost:4321/part-3/08-private-eks-iam/theory/` — 도식 6개로 가장 밀도가 높음
- `http://localhost:4321/part-1/01-terraform-vpc/theory/` — 코드블록 언어 라벨 3형태

Expected: 모든 도식에 아이콘이 그려지고, 다크모드에서 검은 글자가 없고, 코드블록 좌측 상단에 언어가 보인다.

- [ ] **Step 3: 데모 파일 삭제**

```bash
git rm public/mermaid-icon-demo.html
```

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -F - <<'MSG'
chore: 아이콘 시안 데모 페이지 삭제

방식 선택이 끝나 역할을 다했다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RYioRKL9Tqx95Di41fY9oE
MSG
```
