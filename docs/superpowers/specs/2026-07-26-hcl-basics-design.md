# HCL 선수 지식 문서 분리 — 설계

날짜: 2026-07-26
상태: 승인됨

## 문제

`part-1/01-terraform-vpc/theory.mdx` 의 `## 0. HCL 읽는 법` 섹션(15~81행)이 두 가지를 한 문서에서
하고 있다 — HCL 언어 자체를 가르치는 일과, set-02 VPC 아키텍처를 설명하는 일이다.

HCL 문법은 PART-1 모듈 01 에만 필요한 것이 아니라 모듈 02·03, PART-4 모듈 09 까지 계속 쓰인다.
모듈 01 안에 묻혀 있으면 나중 모듈에서 문법이 막힐 때 되돌아올 자리가 없다. 그리고 분량 제약
때문에 타입·표현식·함수 같은 실제로 막히는 지점을 다루지 못하고 있다.

`start/` 의 다른 선수 지식 문서(vpc-basics·iam-basics 등)가 이미 이 역할을 하는 자리다.

## 해결

`src/content/docs/start/hcl-basics.mdx` 를 새로 만들어 HCL 언어를 담당하게 하고, theory.mdx 는
set-02 VPC 아키텍처에만 집중하게 한다.

### 새 문서

- 경로: `src/content/docs/start/hcl-basics.mdx`
- title: `HCL 기초 (선수 학습, 약 1.5시간)`
- 문서 유형: `explanation`
- 사이드바 등록은 자동 (`astro.config.mjs` 가 `start` 디렉토리를 autogenerate 한다)

섹션 구조는 다른 선수 지식 문서와 같다. 심화가 퀴즈보다 앞에 온다.

| 섹션 | 내용 |
|---|---|
| ① 학습 목표 | 체크박스 |
| ② 핵심 개념 | theory 0-1~0-6 이식 |
| ③ 대회에서 어떻게 쓰이나 | 정답지 diff 를 읽으려면 문법이 먼저 · 채점은 코드가 아니라 만들어진 리소스를 본다 |
| ④ 미니 실습 | `terraform console` — AWS 자격 증명·과금 없음 |
| ⑤ 심화 개념 | 아래 표 |
| ⑥ 자기 점검 퀴즈 | 6~7문항 |
| ⑦ 다음 단계 · 공식 문서 | PART-1 모듈 01 로 |

### ⑤ 심화에 넣을 것 — 정답지 실측 근거

`C:\Users\kryuk\practice\skills-2026` 의 `.tf` 191개 약 14,000줄을 전수 조사했다.

처음에는 사이트 문서에 인용된 `hcl` 코드 펜스 354줄만 보고 범위를 정했는데, 그 판단은 틀렸다.
문서가 인용하지 않았을 뿐 정답지에서 많이 쓰이는 구문이 여럿이었다. 아래는 정답지 기준이다.

| 항목 | 정답지 사용 |
|---|---|
| 문자열 보간 `${}` | 476회 / 98파일 |
| 타입 제약 (`type =`) | 362회 / 82파일 |
| `variable` 블록과 `default` | 233회 / 230회 |
| `each.key` / `each.value` | 182회 / 23파일 |
| `output` 블록 | 154회 / 17파일 |
| `data` 블록 | 130회 / 59파일 |
| `for_each` | 81회 / 23파일 |
| `for` 표현식 | 59회 / 33파일 |
| `toset()` | 50회 / 12파일 |
| `depends_on` | 38회 / 33파일 |
| `locals` 블록 | 37회 / 37파일 |
| `count` | 20회 / 6파일 |
| `jsonencode()` | 20회 / 10파일 |
| `object()` · `map()` 타입 | 15회 · 15회 |
| 조건 표현식 `a ? b : c` | 15회 / 10파일 |
| `file()` / `filebase64()` | 15회 / 9파일 |
| splat `[*]` | 10회 / 9파일 |
| `templatefile()` | 7회 / 7파일 |
| `merge()` · heredoc | 6회 · 6회 |
| `lifecycle` | 5회 (`create_before_destroy` 2, `ignore_changes` 1) |
| `lookup()` · `regex()` | 4회 · 4회 |
| `provider alias` | 4회 (CloudFront 용 `us-east-1`) |
| `sensitive` · `validation` | 9회 · 2회 |

### ⑤ 에서 뺀 것 — 정답지 0회

`cidrsubnet()`/`cidrhost()` · `module` 블록 · `backend` 블록 · `provisioner` · `try()` ·
`coalesce()` · `format()`/`formatlist()` · `join()` · `split()` · `flatten()` · `distinct()` ·
`keys()`/`values()` · `element()` · `slice()` · `jsondecode()` · `yamlencode()` ·
`optional()`/`tolist()`/`tomap()`/`tostring()`/`tonumber()` · `prevent_destroy` ·
`timestamp()`/`formatdate()`

`module` 과 `backend` 가 0회인 것이 이 커리큘럼의 성격을 말해 준다 — 정답지는 전부 flat 한 루트
모듈이고 state 는 로컬이다. `cidrsubnet()` 은 CIDR 를 변수로 직접 주기 때문에 쓰지 않는다.

### 기존 문서 변경 3곳

1. **`part-1/01-terraform-vpc/theory.mdx`** — `## 0. HCL 읽는 법` 섹션(15~81행)을 삭제한다.
   `## 1. provider / versions` 부터 시작한다. frontmatter `description` 의 "HCL 문법 5요소" 문구를
   고친다.
2. **`part-1/01-terraform-vpc/index.mdx`** — `## 선행 지식` 블록에 hcl-basics 링크 3~4줄을 넣는다.
   `## 학습 목표` 첫 항목("HCL 블록 구조…")을 조정한다.
3. **`start/index.mdx`** — `<CardGrid>` 에 카드를 넣고, `## 5. 선수 지식 자가진단` 표 아래의
   "Kubernetes·Terraform·eksctl은 선수 지식 아님" 문장에서 Terraform 을 뺀다.

## 제약

- 예제는 `C:\Users\kryuk\practice\skills-2026` 의 실제 `.tf` 에서 가져온다. 지어낸 코드에
  `:badge[실측]` 을 붙이지 않는다.
- **Terraform 은 채점 대상이 아니다.** 1·2과제 문제지·채점지에 IaC 언급이 없다. 이 문서는
  "정답지를 읽고 30% 변동을 빠르게 반영하기 위한 도구"로 자신을 소개해야 하며, 채점되는 능력인
  것처럼 쓰지 않는다. 근거는 `2026-07-26-curriculum-direction.md`.
- 용어는 `reference/style.mdx` 의 표준화 표를 따른다.

## 검증

- `npm run build` — starlight-links-validator 가 함께 돌아 내부 링크를 검사한다
- 퀴즈 매니페스트 등록 수가 늘어나는지 확인
- 새 문서를 브라우저에서 다크·라이트 양쪽으로 확인
