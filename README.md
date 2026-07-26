# skills-guide

전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드 — Astro Starlight 문서 사이트.

**사이트: Vercel [https://skills-2026-learn-module.vercel.app/](https://skills-2026-learn-module.vercel.app/)**

- 콘텐츠: `src/content/docs/` (시작 / part-1~6 / reference)
- 디자인: [starlight-theme-exquisitus](https://github.com/anaxite/starlight-theme-exquisitus) — 팔레트·서체는 테마가 전담
- 한글 서체: 제목·본문 조선일보명조 · UI Pretendard — `src/styles/korean-fonts.css`
- 설계·계획: `docs/superpowers/`

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
