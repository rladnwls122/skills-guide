# skills-guide Starlight 이관 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** skills-guide 레포 루트를 Astro Starlight 사이트로 전환 — 58개 md를 mdx로 이관, Apple 디자인 토큰 적용, Netlify 배포.

**Architecture:** 레포 루트에 Astro 프로젝트 스캐폴드 → Apple CSS 토큰 → 콘텐츠 3배치 이관(형식만 변환, 리라이트 금지) → Apple 랜딩 → 링크 검증 → Netlify 배포.

**Tech Stack:** astro@7 · @astrojs/starlight@0.41.4 · astro-mermaid@2 · starlight-quiz@1 · Inter(가변) + IBM Plex Mono.

## Global Constraints

- 작업 디렉터리: `C:\Users\kryuk\skills-guide` (독립 git 레포, remote = rladnwls122/skills-2026-learn_module, 브랜치 main).
- 콘텐츠 본문 **무수정 이관** — 형식(frontmatter·링크·퀴즈·뱃지)만 변환. 문장 리라이트 금지.
- 단일 액센트: 라이트 #0066cc, 다크 #2997ff. 다른 액센트 색 도입 금지.
- 본문 17px/1.47, 헤드라인 weight 600 (700·500 금지), 카드 그림자 금지(헤어라인 #e0e0e0 1px, radius 18px), 그라디언트 금지.
- 플러그인 확정판: astro-mermaid@2.1.0, starlight-quiz@1.0.0, starlight-links-validator@0.25.2, starlight-heading-badges@0.8.0, starlight-sidebar-topics@0.8.0, starlight-fullview-mode@0.2.6, starlight-scroll-to-top@1.0.1, starlight-image-zoom@0.15.0, starlight-llm-actions@0.9.0(copy-button 대체 — npm에 starlight-copy-button 부재), starlight-codeblock-fullscreen@1.0.0.
- links-validator는 Task 6까지 비활성(부분 이관 중 빌드 깨짐 방지), Task 6에서 활성화.
- 커밋 메시지는 한국어, 기존 레포 스타일(짧은 제목 1줄).
- mermaid 코드블록 내용 무변경.
- 서브에이전트 사용 시 model opus / effort high.

## 라우트 매핑 (전 태스크 공통)

| 원본 | 라우트(mdx 위치) |
|---|---|
| `README.md` | `src/content/docs/index.mdx` (랜딩, Task 5에서 재작성) |
| `STYLE.md` | `src/content/docs/reference/style.mdx` |
| `00-prerequisites/README.md` | `src/content/docs/start/index.mdx` |
| `00-prerequisites/<x>.md` | `src/content/docs/start/<x>.mdx` |
| `PART-<n>-*/<mm>-<name>/README.md` | `src/content/docs/part-<n>/<mm>-<name>/index.mdx` |
| `PART-<n>-*/<mm>-<name>/{theory,lab}.md` | `src/content/docs/part-<n>/<mm>-<name>/{theory,lab}.mdx` |
| `reference/<x>.md` | `src/content/docs/reference/<x>.mdx` |

내부 링크는 전부 **절대 라우트 경로**로: 예 `../../reference/timings.md` → `/reference/timings/`, `[lab.md](lab.md)` → 같은 모듈이면 `/part-5/13-mock-exam/lab/`. README를 가리키는 링크는 폴더 인덱스 라우트(`/part-1/01-terraform-vpc/`).

---

### Task 1: Astro Starlight 스캐폴드

**Files:**
- Create: `package.json`, `astro.config.mjs`, `src/content.config.ts`, `netlify.toml`, `tsconfig.json`, `src/content/docs/index.mdx`(임시), `.gitignore` 수정

**Interfaces:**
- Produces: `npm run build`가 통과하는 빈 Starlight 프로젝트. 이후 태스크는 `src/content/docs/` 아래에 mdx만 추가.

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "skills-guide",
  "type": "module",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/starlight": "^0.41.4",
    "@fontsource-variable/inter": "^5.2.5",
    "@fontsource/ibm-plex-mono": "^5.3.0",
    "@mermaid-js/layout-elk": "^0.2.0",
    "astro": "^7.0.2",
    "astro-mermaid": "^2.1.0",
    "mermaid": "^11.0.0",
    "sharp": "^0.34.5",
    "starlight-codeblock-fullscreen": "^1.0.0",
    "starlight-fullview-mode": "^0.2.6",
    "starlight-heading-badges": "^0.8.0",
    "starlight-image-zoom": "^0.15.0",
    "starlight-links-validator": "^0.25.2",
    "starlight-llm-actions": "^0.9.0",
    "starlight-quiz": "^1.0.0",
    "starlight-scroll-to-top": "^1.0.1",
    "starlight-sidebar-topics": "^0.8.0"
  }
}
```

- [ ] **Step 2: astro.config.mjs 생성**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightQuiz from 'starlight-quiz';
import starlightHeadingBadges from 'starlight-heading-badges';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightFullViewMode from 'starlight-fullview-mode';
import starlightScrollToTop from 'starlight-scroll-to-top';
import starlightImageZoom from 'starlight-image-zoom';
import starlightLlmActions from 'starlight-llm-actions';
import starlightCodeblockFullscreen from 'starlight-codeblock-fullscreen';
// Task 6에서 활성화: import starlightLinksValidator from 'starlight-links-validator';

export default defineConfig({
  integrations: [
    mermaid(),
    starlight({
      title: 'skills-guide',
      description: '전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드',
      defaultLocale: 'root',
      locales: { root: { label: '한국어', lang: 'ko' } },
      customCss: ['./src/styles/apple.css'],
      plugins: [
        starlightQuiz(),
        starlightHeadingBadges(),
        starlightFullViewMode(),
        starlightScrollToTop(),
        starlightImageZoom(),
        starlightLlmActions(),
        starlightCodeblockFullscreen(),
        starlightSidebarTopics([
          {
            label: '시작 (D0)',
            link: '/start/',
            icon: 'rocket',
            items: [{ label: '선수 지식', autogenerate: { directory: 'start' } }],
          },
          {
            label: 'PART 1 — Foundation·IaC',
            link: '/part-1/01-terraform-vpc/',
            items: [{ label: 'D1~3', autogenerate: { directory: 'part-1' } }],
          },
          {
            label: 'PART 2 — EKS Core',
            link: '/part-2/04-eksctl-cluster/',
            items: [{ label: 'D4~7', autogenerate: { directory: 'part-2' } }],
          },
          {
            label: 'PART 3 — 관측성·Hard Mode',
            link: '/part-3/07-observability/',
            items: [{ label: 'D8~9', autogenerate: { directory: 'part-3' } }],
          },
          {
            label: 'PART 4 — 2과제 패턴',
            link: '/part-4/09-serverless-event/',
            items: [{ label: 'D10~11', autogenerate: { directory: 'part-4' } }],
          },
          {
            label: 'PART 5 — Battle Drills',
            link: '/part-5/11-mutation-drill/',
            items: [{ label: 'D12~14', autogenerate: { directory: 'part-5' } }],
          },
          {
            label: 'PART 6 — 3과제 운영',
            link: '/part-6/14-task3-load-ops/',
            items: [{ label: '3과제', autogenerate: { directory: 'part-6' } }],
          },
          {
            label: 'Reference',
            link: '/reference/cheatsheet/',
            icon: 'open-book',
            items: [{ label: 'Reference', autogenerate: { directory: 'reference' } }],
          },
        ]),
      ],
    }),
  ],
});
```

주의: 플러그인 옵션 형식이 버전과 안 맞아 빌드 에러 나면 해당 플러그인 README(`npm view <pkg> readme`)를 보고 옵션만 고칠 것. 그래도 안 되면 그 플러그인만 빼고 계속 — 뺀 것은 최종 보고에 명시.

- [ ] **Step 3: src/content.config.ts 생성**

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

- [ ] **Step 4: tsconfig.json 생성**

```json
{
  "extends": "astro/tsconfigs/base",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: netlify.toml 생성**

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

- [ ] **Step 6: 임시 index.mdx 생성** (Task 5에서 교체)

```mdx
---
title: skills-guide
description: 전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드
template: splash
---

이관 진행 중.
```

- [ ] **Step 7: 임시 apple.css 생성** (Task 2에서 교체 — 없으면 customCss가 빌드 실패)

`src/styles/apple.css`에 `/* Task 2 */` 한 줄.

- [ ] **Step 8: .gitignore에 추가**

기존 `.obsidian/` 유지하고 아래 추가:

```
node_modules/
dist/
.astro/
```

- [ ] **Step 9: 설치·빌드 검증**

Run: `cd /c/Users/kryuk/skills-guide && npm install && npm run build`
Expected: 빌드 성공, `dist/index.html` 생성. sidebar-topics는 콘텐츠 없어 경고 가능 — 에러만 아니면 통과. 에러 시 Step 2 주의사항대로 대응.

- [ ] **Step 10: 커밋**

```bash
git add -A && git commit -m "Astro Starlight 스캐폴드 (플러그인 10종·Netlify 설정)"
```

---

### Task 2: Apple 디자인 CSS

**Files:**
- Create: `src/styles/apple.css` (교체)

**Interfaces:**
- Produces: Starlight 전역 토큰 오버라이드 + 랜딩용 클래스 `.apple-hero`, `.apple-tile`, `.apple-tile--dark`, `.apple-tile--dark2`, `.apple-tile--parchment`, `.apple-pill`, `.apple-pill--ghost`, `.apple-tagline`, `.apple-footer` (Task 5가 사용).

- [ ] **Step 1: apple.css 작성**

```css
/* DESIGN-apple.md 토큰 → Starlight 오버라이드 */
@import '@fontsource-variable/inter';
@import '@fontsource/ibm-plex-mono';

:root {
  --sl-font: 'Inter Variable', system-ui, -apple-system, sans-serif;
  --sl-font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  /* 다크 모드 (Apple 다크 타일 팔레트) */
  --sl-color-accent-low: #16385c;
  --sl-color-accent: #2997ff;
  --sl-color-accent-high: #7dbeff;
  --sl-color-white: #ffffff;
  --sl-color-gray-1: #f5f5f7;
  --sl-color-gray-2: #cccccc;
  --sl-color-gray-3: #7a7a7a;
  --sl-color-gray-4: #4a4a4c;
  --sl-color-gray-5: #2a2a2c;
  --sl-color-gray-6: #272729;
  --sl-color-black: #1d1d1f;
}

:root[data-theme='light'] {
  --sl-color-accent-low: #d6e6f9;
  --sl-color-accent: #0066cc;
  --sl-color-accent-high: #004999;
  --sl-color-white: #1d1d1f;
  --sl-color-gray-1: #333333;
  --sl-color-gray-2: #4a4a4c;
  --sl-color-gray-3: #7a7a7a;
  --sl-color-gray-4: #cccccc;
  --sl-color-gray-5: #e0e0e0;
  --sl-color-gray-6: #f5f5f7;
  --sl-color-gray-7: #fafafc;
  --sl-color-black: #ffffff;
}

/* 본문 17px/1.47, Apple 자간 */
:root {
  --sl-text-base: 1.0625rem; /* 17px */
  --sl-line-height: 1.47;
}
.sl-markdown-content {
  font-size: 1.0625rem;
  line-height: 1.47;
  letter-spacing: -0.022em;
}

/* 헤드라인: weight 600, 네거티브 자간 (Inter 보정 -0.01em) */
.sl-markdown-content :is(h1, h2, h3, h4),
h1[data-page-title] {
  font-weight: 600;
  letter-spacing: -0.01em;
}
.sl-markdown-content h1, h1[data-page-title] { line-height: 1.1; }
.sl-markdown-content h2 { line-height: 1.19; }

/* 카드: 그림자 제거, 헤어라인, 18px radius */
.sl-markdown-content .card,
.card {
  border: 1px solid var(--sl-color-gray-5);
  border-radius: 18px;
  box-shadow: none;
}

/* 링크·버튼: 단일 액센트, pill */
.sl-markdown-content a { color: var(--sl-color-accent); }
.sl-link-button.primary {
  background: var(--sl-color-accent);
  border: 0;
  border-radius: 9999px;
  padding: 11px 22px;
  font-weight: 400;
}
.sl-link-button.primary:active { transform: scale(0.95); }
.sl-link-button.secondary {
  border: 1px solid var(--sl-color-accent);
  color: var(--sl-color-accent);
  border-radius: 9999px;
  padding: 11px 22px;
}

/* ── 랜딩 타일 (Task 5 사용) ── */
.apple-hero {
  text-align: center;
  padding: 80px 24px 64px;
}
.apple-hero h1 {
  font-size: clamp(34px, 5vw, 56px);
  font-weight: 600;
  line-height: 1.07;
  letter-spacing: -0.015em;
  margin: 0;
}
.apple-hero .apple-tagline {
  font-size: clamp(21px, 3vw, 28px);
  font-weight: 400;
  line-height: 1.14;
  margin: 16px auto 24px;
  max-width: 40em;
}
.apple-tile {
  padding: 80px 24px;
  margin: 0 calc(-1 * var(--sl-content-pad-x, 1rem));
  text-align: center;
  background: var(--sl-color-black);
}
.apple-tile h2 {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
}
.apple-tile p { font-size: 21px; line-height: 1.19; margin: 0 0 20px; }
.apple-tile--parchment { background: var(--sl-color-gray-6); }
:root[data-theme='light'] .apple-tile--dark { background: #272729; color: #ffffff; }
:root[data-theme='light'] .apple-tile--dark2 { background: #2a2a2c; color: #ffffff; }
:root[data-theme='dark'] .apple-tile--dark,
.apple-tile--dark { background: #272729; color: #ffffff; }
.apple-tile--dark2 { background: #2a2a2c; color: #ffffff; }
.apple-tile--dark a, .apple-tile--dark2 a { color: #2997ff; }
.apple-pill {
  display: inline-block;
  background: var(--sl-color-accent);
  color: #ffffff;
  border-radius: 9999px;
  padding: 11px 22px;
  text-decoration: none;
  margin: 0 6px;
}
.apple-pill:active { transform: scale(0.95); }
.apple-pill--ghost {
  background: transparent;
  border: 1px solid var(--sl-color-accent);
  color: var(--sl-color-accent);
}
.apple-footer {
  background: var(--sl-color-gray-6);
  padding: 64px 24px;
  margin: 0 calc(-1 * var(--sl-content-pad-x, 1rem));
}
.apple-footer a {
  display: block;
  font-size: 17px;
  line-height: 2.41;
  text-decoration: none;
  color: var(--sl-color-gray-1);
}
.apple-footer h3 { font-size: 14px; font-weight: 600; }
```

- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: 성공. `dist/`의 css에 `#0066cc` 포함 확인: `grep -rl "0066cc" dist/_astro/ | head -1`

- [ ] **Step 3: 커밋**

```bash
git add src/styles/apple.css && git commit -m "Apple 디자인 토큰 CSS (DESIGN-apple.md 기반)"
```

---

### Task 3: 콘텐츠 이관 배치 A — start + reference (15파일)

**Files:**
- Create: `src/content/docs/start/*.mdx` (7), `src/content/docs/reference/*.mdx` (8 — STYLE.md 포함)
- 원본: `00-prerequisites/*.md`, `reference/*.md`, `STYLE.md` (이 태스크에서는 삭제하지 않음 — Task 5에서 일괄 삭제)

**Interfaces:**
- Consumes: Task 1의 라우트 매핑.
- Produces: `/start/…`, `/reference/…` 라우트. 이후 배치가 이 라우트로 링크.

**변환 규칙 (배치 B·C 동일 적용):**

1. frontmatter 생성 — h1을 title로 옮기고 본문에서 h1 제거:
   ```yaml
   ---
   title: <h1 텍스트 그대로>
   description: <"문서 유형:" 인용구 다음 첫 문장 요약 1줄 — 새 문장 작성 허용(유일한 신규 텍스트)>
   ---
   ```
2. `> 문서 유형: xxx` 인용구는 유지.
3. 내부 md 링크 → 절대 라우트 (Global 매핑 표). 외부 URL·앵커(`#…`)는 무변경.
4. mermaid 블록 무변경.
5. 헤딩에 "함정"·"실측" 단어 포함 시 뱃지: `## OIDC 함정` → `## OIDC :badge[함정]{variant=danger}`, "실측" → `:badge[실측]{variant=note}`. 헤딩만, 본문 인라인은 그대로.
6. theory.mdx의 자기 점검 퀴즈: 객관식(보기 나열)으로 표현 가능한 문항만 `<Quiz>` 변환:
   ```mdx
   import { Quiz } from 'starlight-quiz/components';

   <Quiz title="자기 점검">
   질문 텍스트

   - [x] 정답 보기
   - [ ] 오답 보기

   해설 (기존 답/해설 텍스트 그대로)
   </Quiz>
   ```
   주관식·서술형 문항은 원형 유지. import는 파일당 1회, 첫 `<Quiz>` 사용 파일에만.
7. mdx 충돌 이스케이프: 본문 `<`가 태그로 오인되는 곳(`<pod-name>` 등 플레이스홀더)은 백틱 감싸기(이미 코드면 무변경). `{}`는 인라인 코드 밖이면 이스케이프.
8. 체크박스 목록(`- [ ]`)은 퀴즈 블록 밖에서는 그대로 (GFM 태스크리스트로 렌더).

- [ ] **Step 1: 15파일 변환** — 위 규칙대로 각 파일 생성.
- [ ] **Step 2: 빌드 검증**

Run: `npm run build`
Expected: 성공. mdx 파싱 에러 나면 해당 파일 규칙 7 재점검.

- [ ] **Step 3: 커밋**

```bash
git add src/content/docs/start src/content/docs/reference && git commit -m "콘텐츠 이관 A: start·reference 15파일 mdx 변환"
```

---

### Task 4: 콘텐츠 이관 배치 B — part-1~3 (24파일) · 배치 C — part-4~6 (18파일)

**Files:**
- Create: `src/content/docs/part-1/…part-6/**/*.mdx` (모듈별 index/theory/lab)

**Interfaces:**
- Consumes: Task 3의 변환 규칙 전부.
- Produces: `/part-<n>/<mm>-<name>/{,theory/,lab/}` 라우트.

- [ ] **Step 1: 배치 B (part-1~3, 24파일) 변환** — Task 3 규칙 동일. 병렬 에이전트 가능(opus/high, PART별 1개).
- [ ] **Step 2: 배치 C (part-4~6, 18파일) 변환** — 동일.
- [ ] **Step 3: 빌드 검증**

Run: `npm run build`
Expected: 성공, 라우트 수 = 문서 57 + index.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs && git commit -m "콘텐츠 이관 B·C: part-1~6 42파일 mdx 변환"
```

---

### Task 5: Apple 랜딩 + 구 md 정리

**Files:**
- Modify: `src/content/docs/index.mdx` (전면 재작성)
- Create: `README.md` (레포 소개용으로 교체)
- Delete: `00-prerequisites/ PART-1…PART-6/ reference/ STYLE.md` (원본 md — git 히스토리 보존)

**Interfaces:**
- Consumes: Task 2 클래스(`.apple-hero`, `.apple-tile*`, `.apple-pill*`, `.apple-footer`), 기존 README.md의 로드맵·대원칙 내용.

- [ ] **Step 1: index.mdx 작성** — 기존 README 내용을 Apple 타일 구조로 배치 (문구는 README 원문 사용):

```mdx
---
title: skills-guide
description: 전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드
template: splash
hero: false
---

{/* 히어로: 화이트 */}
<div class="apple-hero">
  <h1>2주 완성. 문서 기반. AI 없이.</h1>
  <p class="apple-tagline">AWS 기초에서 수상 과제 스택까지 — 런북으로 빠르게, 문서 밖은 개념으로.</p>
  <a class="apple-pill" href="/start/">시작하기</a>
  <a class="apple-pill apple-pill--ghost" href="#roadmap">로드맵 보기</a>
</div>

{/* PART 0~6 타일: 라이트↔다크 교차. 각 타일 = h2 + 태그라인 + pill 링크 */}
<div class="apple-tile apple-tile--parchment">…PART 0…</div>
<div class="apple-tile apple-tile--dark">…PART 1…</div>
<div class="apple-tile">…PART 2…</div>
<div class="apple-tile apple-tile--dark2">…PART 3…</div>
<div class="apple-tile apple-tile--parchment">…PART 4…</div>
<div class="apple-tile apple-tile--dark">…PART 5…</div>
<div class="apple-tile">…PART 6…</div>

{/* 로드맵 표(id="roadmap") + 최종 목표 4항 + 대원칙 6항: 기존 README 원문, 일반 마크다운 섹션 */}

{/* 파치먼트 푸터: reference 덴스 링크 */}
<div class="apple-footer">…</div>
```

각 타일: PART명 h2(예: "PART 2 — EKS Core"), 태그라인은 로드맵 표의 "주제" 열 텍스트, pill은 해당 PART 첫 모듈 라우트. `hero: false`가 스키마 에러 나면 frontmatter에서 hero 자체를 빼고 splash 유지.

- [ ] **Step 2: 새 README.md 작성** — 레포 루트용 짧은 소개 (사이트 URL, `npm run dev`/`build`, 구조 설명, 스펙·플랜 위치). 사이트 콘텐츠와 중복 금지, 20줄 이내.
- [ ] **Step 3: 원본 md 삭제**

```bash
git rm -r 00-prerequisites PART-1-Foundation-IaC PART-2-EKS-Core PART-3-Observability-HardMode PART-4-Task2-Patterns PART-5-Battle-Drills PART-6-Task3-Operations reference STYLE.md
```

- [ ] **Step 4: 빌드 + 육안 검증**

Run: `npm run build && npm run preview` 후 랜딩 확인 (타일 교차, pill, 다크 토글).
Expected: 타일이 풀블리드 교차 렌더.

- [ ] **Step 5: 커밋**

```bash
git add -A && git commit -m "Apple 랜딩 페이지 + 원본 md 정리 (site로 일원화)"
```

---

### Task 6: 링크 검증 활성화 + 수정

**Files:**
- Modify: `astro.config.mjs` (links-validator 활성화)

- [ ] **Step 1: validator 활성화** — astro.config.mjs에서 주석 해제하고 starlight `plugins` 배열 **마지막**에 추가:

```js
import starlightLinksValidator from 'starlight-links-validator';
// plugins 배열에:
starlightLinksValidator({ errorOnRelativeLinks: false }),
```

- [ ] **Step 2: 빌드 → 깨진 링크 전수 수정**

Run: `npm run build`
Expected: 깨진 링크 목록이 에러로 출력 → 전부 수정 후 재빌드 통과(0건).

- [ ] **Step 3: 커밋**

```bash
git add -A && git commit -m "links-validator 활성화·깨진 링크 정리"
```

---

### Task 7: Netlify 배포 + push

- [ ] **Step 1: Netlify 사이트 생성·배포**

```bash
cd /c/Users/kryuk/skills-guide
netlify deploy --prod --create-site skills-2026-learn-module --dir dist
```

`--create-site` 미지원/이름 충돌 시: `netlify sites:create --name skills-2026-learn-module` → `netlify link --name skills-2026-learn-module` → `netlify deploy --prod --dir dist`. 인증 에러 시 사용자에게 `! netlify login` 요청하고 중단.

- [ ] **Step 2: 배포 URL 확인**

Run: `curl.exe -sI <배포 URL> | head -3`
Expected: `HTTP/2 200`.

- [ ] **Step 3: push + 메모리 갱신**

```bash
git push origin main
```

`memory/skills-guide-repo.md`에 사이트 URL·배포 명령 추가.

---

## Self-Review 결과

- 스펙 커버리지: 구조(T1)·플러그인 10종(T1, copy-button→llm-actions 대체 명시)·Apple 토큰 전역(T2)·랜딩(T5)·변환 규칙 6항(T3)·validator(T6)·Netlify(T7) — 전부 태스크에 매핑됨.
- 타입/이름 일관성: CSS 클래스명 T2 정의 = T5 사용 일치. 라우트 매핑 표 = sidebar-topics link 일치.
- 플레이스홀더: T5 index.mdx의 `…PART n…`은 "기존 README 원문 사용" 규칙으로 내용 출처 명시 — 리라이트 금지 제약과 일치.
