# CLAUDE.md

전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드를 담은 Astro Starlight 문서 사이트. Vercel 로 배포된다(https://skills-2026-learn-module.vercel.app/). 콘텐츠 59개 `.mdx` 가 전부이고 애플리케이션 코드는 없다 — 이 레포에서 하는 일은 대부분 **문서 작성**과 **사이트 설정 조정** 둘 중 하나다.

## 명령

```bash
npm run dev          # 로컬 서버. 데몬으로 뜬다 — 중복 실행 말 것
npx astro dev stop   # 그 서버 종료
npm run build        # 프로덕션 빌드. starlight-links-validator 가 함께 돈다
npm run check:icons  # 도식 아이콘 이름 검증 (아래 참조)
npm run font         # 한글 서체 서브셋 재생성 (python 필요)
```

Node 버전은 mise 로 고정한다(`.mise.toml`). 셸 통합이 없으면 명령 앞에 `mise exec --` 를 붙인다.

## 구조

```
src/
  content/docs/      콘텐츠 전부. start / part-1~6 / reference
  styles/            customCss 로 주입 (astro.config.mjs 의 배열 순서가 곧 로드 순서)
  scripts/           페이지에 주입되는 클라이언트 스크립트
  icons/             자체 아이콘 팩 (생성물, 커밋됨)
  components/        Starlight 오버라이드
scripts/             빌드·검증용 node/python 스크립트
docs/superpowers/    설계 문서(spec)와 구현 계획(plan)
```

콘텐츠 배치·문장 규칙의 **원본은 `src/content/docs/reference/style.mdx`** 다. 문서를 쓰거나 고칠 때는 그 문서를 기준으로 판단한다.

## 이 레포에서만 통하는 것

- **`npm run dev` 는 데몬화된다.** 이미 떠 있는지 먼저 확인하고, 없을 때만 띄운다. 종료는 `npx astro dev stop`.
- **GFM 이 꺼져 있다.** `markdown.gfm: false` + `remark-gfm` 을 `singleTilde: false` 로 직접 넣었다. 홑물결 취소선이 `D4~7`·`8~10h` 같은 범위 표기를 먹어치웠기 때문이다. 표·작업 목록 등 나머지 GFM 기능은 그대로 산다.
- **도식 아이콘 이름 오타는 빌드가 잡지 못한다.** 해당 노드만 조용히 깨지고 빌드는 통과한다. 도식을 건드렸으면 `npm run check:icons` 를 돌린다.
- **`docs/` 는 사이트에 발행되지 않는다.** 설계 근거를 남기는 곳이고, 콘텐츠는 `src/content/docs/` 다. 두 경로를 혼동하지 않는다.

## 작업 규칙

1. 문서 내용을 고칠 때는 `reference/style.mdx` 의 Diátaxis 분류를 먼저 확인한다. 한 문서에 유형을 섞지 않는다.
2. 도식(mermaid)을 건드렸으면 `npm run check:icons` 와 브라우저 확인을 함께 한다. 렌더는 클라이언트에서 일어나므로 빌드 성공이 렌더 성공을 보장하지 않는다.
3. 사이트 설정(`astro.config.mjs`·`src/styles`·`src/scripts`)을 바꿨으면 대표 페이지를 **다크·라이트 양쪽**에서 확인한다. 테마별로만 깨지는 회귀가 실제로 있었다.
4. 커밋 메시지는 한국어로 쓰고, 무엇을 왜 바꿨는지를 본문에 남긴다.

## 세부 규칙

파일을 건드릴 때 `.claude/rules/` 의 해당 규칙이 자동으로 붙는다.

| 규칙 | 적용 대상 |
|---|---|
| `docs-style.md` | `src/content/docs/**/*.mdx` |
| `mermaid-diagrams.md` | `src/content/docs/**/*.mdx` |
| `site-config.md` | `astro.config.mjs`, `src/mermaid-icons.mjs`, `src/styles/**`, `src/scripts/**` |
