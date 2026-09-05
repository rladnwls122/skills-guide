# skills-guide

전국기능경기대회 클라우드컴퓨팅 한 달 완성 가이드 — Astro Starlight 문서 사이트.

**사이트: [skills-learn.zenru.net](https://skills-learn.zenru.net/)** (Vercel 배포)

- 콘텐츠: `src/content/docs/` — `start/`(선수 학습) · `part-0`~`part-6`(주차별 모듈) · `reference/`
- 설계 근거: `docs/` — 사이트에 발행되지 않는다. 스펙은 `superpowers/specs/`, 실행 계획은 `superpowers/plans/`, 감사 기록은 `reports/`
- 디자인: [starlight-theme-exquisitus](https://github.com/anaxite/starlight-theme-exquisitus) — 팔레트·서체는 테마가 전담
- 한글 서체: 제목·본문 조선일보명조 · UI Pretendard — `src/styles/korean-fonts.css`

## 개발

Node 버전은 [mise](https://mise.jdx.dev) 로 고정한다(`.mise.toml` — astro 7 최소
요구 node >=22.12.0 위에서 검증한 24.18.0). 설치 후:

```bash
mise install     # .mise.toml 이 지정한 node 버전을 받아 프로젝트 전용으로 고정
mise trust       # 최초 1회 — 이 디렉터리의 .mise.toml 을 신뢰
```

**mise 설치**

| OS | 명령 |
| --- | --- |
| macOS | `brew install mise` |
| Linux | `curl https://mise.run \| sh` |
| Windows | `winget install jdx.mise` |

셸 통합(`mise activate`)을 설정하면 이 디렉터리에 들어올 때마다 node 버전이
자동으로 바뀐다 — 안 해도 명령 앞에 `mise exec --` 를 붙이면 된다. 자세한 셸별
설정은 [mise 문서](https://mise.jdx.dev/getting-started.html)를 본다.

```bash
npm install
npm run dev      # 로컬 미리보기
npm run build    # 프로덕션 빌드 (links-validator 포함)
```

mise 셸 통합 없이 쓴다면 `npm run dev` 앞에 `mise exec --` 를 붙인다
(`mise exec -- npm run dev`).

`npm run dev` 는 데몬으로 뜬다. 이미 떠 있는지 먼저 확인하고, 종료는
`npx astro dev stop` 이다. 새 `.mdx` 를 추가했다면 콘텐츠 컬렉션이 갱신되도록
재시작한다.

## 검사

문서를 고쳤으면 아래를 돌린다. 세 가지 모두 `npm run build` 와 별개다.

| 명령 | 잡는 것 |
| --- | --- |
| `npm run check:read` | 한 문장 80자 초과 — 절이 셋 이상 붙어 읽다 끊기는 자리 |
| `npm run check:lab` | 실습 이행 절에 실행 명령이 새어 든 것 |
| `npm run check:icons` | 도식이 쓰는 mermaid 아이콘이 목록에 등록됐는지 |

범위를 좁힐 수 있다 — `npm run check:read -- start/` 처럼 쓴다.

문장·용어·문서 유형 규칙의 원본은 사이트 안에 있다:
[문서 규칙](https://skills-learn.zenru.net/reference/style/).

## 서체 서브셋

`npm run font` 은 한글 서체를 사용 글자만 남겨 줄인다. python 이 필요하고,
결과는 `scripts/.font-cache/` 에 캐시된다.
