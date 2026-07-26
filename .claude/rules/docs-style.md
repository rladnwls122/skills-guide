---
paths:
  - "src/content/docs/**/*.mdx"
---

문장·용어·문서 분류 규칙의 원본은 `src/content/docs/reference/style.mdx` 다. 고치기 전에 그 문서를 확인한다.

핵심만:

- 한 문서에 Diátaxis 유형을 섞지 않는다. `theory` = explanation, `lab` = tutorial(PART-5 는 how-to), `index` = 개요, `reference/*` = reference, `start/*` = explanation.
- frontmatter·import 다음 본문 첫 줄에 `> 문서 유형: ...` 을 둔다. 값은 `explanation` · `tutorial` · `how-to` · `reference` · `개요` 다섯 중 하나.
- Starlight 가 frontmatter 의 `title` 을 제목으로 렌더한다. 본문에 H1 을 따로 쓰지 않는다.
- 용어는 `style.mdx` 의 표준화 표를 따른다. 같은 개념을 두 가지로 표기하지 않는다.
- 산문에서 사이트 문서를 `troubleshooting.md` 같은 옛 파일명으로 지칭하지 않는다. 절대 경로 링크(`/reference/troubleshooting/`)를 쓴다. **산문 속 파일명은 `starlight-links-validator` 가 잡지 못한다.**
- `start/*` 는 `①~⑦` 번호 절 구조다. **심화 개념이 자기 점검 퀴즈보다 앞에 온다** — 배운 뒤 점검하는 순서다.
- **GFM 홑물결 취소선이 꺼져 있다.** `D4~7`·`8~10h` 같은 범위 표기가 문단 안에서 짝지어져 통째로 취소선이 되던 것을 막았다. 겹물결(`~~`)만 취소선이고 표·작업 목록 등 나머지 GFM 은 그대로 산다. 설정 근거는 `site-config.md`.
