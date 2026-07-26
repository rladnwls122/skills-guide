# CLAUDE.md

전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드를 담은 Astro Starlight 문서 사이트. Vercel 로 배포된다(https://skills-2026-learn-module.vercel.app/). 애플리케이션 코드는 없고 `.mdx` 콘텐츠가 전부다 — 하는 일은 **문서 작성**과 **사이트 설정 조정** 둘 중 하나다.

## 콘텐츠 근거

문서 내용의 근거는 레포 밖에 있다. 사이트 콘텐츠만 보고 판단하지 않는다.

- `C:\Users\kryuk\practice\skills-2026` — 과제 구현. set-02·03·05·07·08·09 + `task-3`
- `C:\Users\kryuk\Downloads\national-skills-v7` — **set-08 제출작**의 과제지·채점지·채점 스크립트

**수상 후보만 근거로 쓴다** — 1과제 set-02·03·07, 2과제 set-02·07·08. set-05·09 는 후보가 아니다. `task-3` 는 3과제 **예상 풀이**지 확정이 아니다. 인용 전에 그 자료가 무엇인지부터 확인한다(`national-skills-v7/1과제/asgmt1_check.sh` 는 `set-08/task-1/mark.sh` 와 동일 파일이었다). 전체 방향은 `docs/superpowers/specs/2026-07-26-curriculum-direction.md`.

## 함정

- **`npm run dev` 는 데몬화된다.** 이미 떠 있는지 먼저 확인한다. 종료는 `npx astro dev stop`. **새 `.mdx` 를 추가하면 재시작해야 한다** — 콘텐츠 컬렉션이 갱신되지 않아 404 가 난다.
- **콘텐츠는 CRLF 다.** 스크립트로 `.mdx` 를 파싱하면 `\r` 부터 지운다. 코드 펜스에 ` ```hcl title="vpc.tf" ` 처럼 속성이 붙으므로 정규식이 줄 끝까지 받아야 한다.
- **`docs/` 는 사이트에 발행되지 않는다.** 설계 근거를 남기는 곳이고, 콘텐츠는 `src/content/docs/` 다.
- Node 버전은 mise 로 고정한다(`.mise.toml`). 셸 통합이 없으면 `mise exec --` 를 앞에 붙인다. `npm run font` 는 python 이 필요하다.

## 규칙

커밋 메시지는 한국어로 쓰고, 무엇을 왜 바꿨는지를 본문에 남긴다.

나머지는 파일을 건드릴 때 `.claude/rules/` 에서 자동으로 붙는다 — 문장·문서 유형은 `docs-style.md`, 도식은 `mermaid-diagrams.md`, 사이트 설정은 `site-config.md`. 문장·용어 규칙의 원본은 `src/content/docs/reference/style.mdx` 다.
