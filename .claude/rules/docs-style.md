---
paths:
  - "src/content/docs/**/*.mdx"
---

문장·용어·문서 분류 규칙의 원본은 `src/content/docs/reference/style.mdx` 다. 고치기 전에 그 문서를 확인한다.

핵심만:

- 한 문서에 Diátaxis 유형을 섞지 않는다. `theory` = explanation, `lab` = tutorial(PART-5~6 은 how-to), `part-N/console-deploy` = how-to, `index` = 개요, `reference/*` = reference, `start/*` = explanation.
- **유일한 예외 — theory 의 접이식 실행 블록.** 개념 절 끝에 `<details class="build-step">` 를 붙여 그 절의 리소스를 띄우게 할 수 있다. 조건은 둘이다: 기본 상태가 접힘일 것(`open` 금지), 블록 안이 실행 명령·기대 출력·안 나올 때 볼 곳 한 줄 셋으로 제한될 것. 과금 리소스를 띄우면 블록 첫 줄에 비용을 적고 문서 끝에 정리 절을 둔다. 근거는 `style.mdx` A 절.
- frontmatter·import 다음 본문 첫 줄에 `> 문서 유형: ...` 을 둔다. 값은 `explanation` · `tutorial` · `how-to` · `reference` · `개요` 다섯 중 하나.
- Starlight 가 frontmatter 의 `title` 을 제목으로 렌더한다. 본문에 H1 을 따로 쓰지 않는다.
- 용어는 `style.mdx` 의 표준화 표를 따른다. 같은 개념을 두 가지로 표기하지 않는다.
- 산문에서 사이트 문서를 `troubleshooting.md` 같은 옛 파일명으로 지칭하지 않는다. 절대 경로 링크(`/reference/troubleshooting/`)를 쓴다. **산문 속 파일명은 `starlight-links-validator` 가 잡지 못한다.**
- `start/*` 는 `①~⑦` 번호 절 구조다. **심화 개념이 자기 점검 퀴즈보다 앞에 온다** — 배운 뒤 점검하는 순서다.
- **GFM 홑물결 취소선이 꺼져 있다.** `D4~7`·`8~10h` 같은 범위 표기가 문단 안에서 짝지어져 통째로 취소선이 되던 것을 막았다. 겹물결(`~~`)만 취소선이고 표·작업 목록 등 나머지 GFM 은 그대로 산다. 설정 근거는 `site-config.md`.
- **초심자 가독성 규칙(`style.mdx` F 절).** 용어는 정의가 사용보다 먼저(첫 등장에서 한 줄 정의 또는 링크, 약어는 풀어 쓴다). `start/*` 는 뒤 순서 문서의 지식을 전제하지 않는다. 괄호 안에 핵심 정의 금지, 부정 두 겹 이상 금지, 표 셀에 문장급 정보 금지. 채점 서술("mark 가 본다")은 동작 원리 설명을 대체하지 못한다. theory 가 새 Terraform 리소스 타입을 처음 쓰면 Registry 리소스 문서를 링크한다(인자 앵커 금지). 끊어쓰기는 읽기를 막는 문장만 — 기계적 토막 금지.
