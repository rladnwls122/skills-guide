# 디버깅 중심 개편 — 7단계 구현 계획 (콘솔 배포 문서 4편)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PART 1~4 에 콘솔 배포 문서를 하나씩 신설한다. 지금 사이트 어디에도 없고 대회 당일 반드시 만나는 **drift 판단**이 이 문서들의 존재 이유다.

**Spec:** `docs/superpowers/specs/2026-08-14-debug-first-restructure-design.md` 5절
**선행:** 1~6단계 전부 완료. 01~13 이 변동 이행 계약으로 서 있다.

## 왜 필요한가

01~13 은 전부 코드로 만드는 훈련이다. 그런데 대회 당일에 콘솔을 아예 안 쓰는 일은 없다.

- 코드로 만든 것을 **급히 한 번 고칠 때**
- Terraform 이 막혀 **우회해야 할 때**
- 채점 직전 **분 단위로 손볼 때**

그리고 그렇게 고친 뒤에 `terraform plan` 을 돌리면 **되돌리려 든다.** 그때 무엇을 해야 하는지를 아무 문서도 말해 주지 않는다. 이 넷이 그 자리를 맡는다.

## 문서 계약

`src/content/docs/part-N/console-deploy.mdx`, 총 4개.

- `> 문서 유형: how-to` — [style.mdx](../../src/content/docs/reference/style.mdx) 의 매핑 표에 1단계에서 이미 등록했다
- `sidebar: order: 99` 로 파트 끝에 놓는다. 사이드바가 `autogenerate: { directory: 'part-N' }` 라 파일만 두면 잡힌다
- **클릭 순서를 나열하지 않는다.** 콘솔 UI 는 자주 바뀌고, 그것을 적으면 문서가 금방 낡는다

각 문서는 네 절이다.

| 절 | 담는 것 |
|---|---|
| 1. 같은 리소스, 두 경로 | 그 파트의 핵심 리소스를 콘솔로 만들고 코드 산출물과 대조 |
| 2. 콘솔이 몰래 만드는 것 | 마법사가 끼워 넣는 리소스. 잔존 리소스 점검에 걸리는 지점 |
| 3. drift 판단 | **이 문서의 존재 이유.** import · 코드 수정 · 방치 각각이 옳은 때 |
| 4. 판단표 | 콘솔이 옳은 때와 코드가 옳은 때 |

## Global Constraints

- 커밋 메시지는 한국어로. 무엇을 왜 바꿨는지 본문에 남긴다.
- 본문 H1 금지. 사이트 문서는 절대 경로 링크.
- 셸 명령은 PowerShell·bash 두 탭.
- **재보지 않은 수치는 쓰지 않는다.**
- **콘솔 화면의 버튼 이름과 위치를 적지 않는다.** 바뀐다. 대신 "무엇을 만들려는지"와 "만든 뒤 무엇을 확인하는지"를 적는다.
- **새 `.mdx` 4개를 만든다.** dev 서버가 떠 있으면 재시작해야 콘텐츠 컬렉션이 갱신된다(`npx astro dev stop` 후 재시작). 빌드는 영향 없다.

## 근거 — 실측한 것

**Terraform 1.15.8** 기준이다.

| 확인한 것 | 결과 |
|---|---|
| `terraform plan -generate-config-out=PATH` | 존재한다. **도움말에 `(Experimental)` 로 표시된다** |
| `terraform import` 명령 | 존재한다 |

`import` 블록과 `-generate-config-out` 조합은 코드를 자동 생성해 주지만 **실험적이라고 도구가 스스로 말한다.** 문서에 그대로 옮긴다 — 대회에서 처음 써 보는 실험적 기능에 의존하는 것은 위험하다는 판단 근거가 된다.

## 파트별 소재

각 문서가 다루는 리소스는 그 파트가 이미 코드로 만든 것 중에서 고른다. **새 개념을 끌어오지 않는다.**

| 파트 | 콘솔로 만들 것 | 콘솔이 몰래 만드는 것 | drift 소재 |
|---|---|---|---|
| 1 | VPC 와 서브넷 | 메인 라우트 테이블 · 기본 보안 그룹 · DHCP 옵션 세트 | 콘솔에서 태그를 고치면 `plan` 이 되돌린다 |
| 2 | 노드그룹 | 노드 IAM 역할 · 기본 애드온 | eksctl 은 CloudFormation 이라 되돌리는 주체가 다르다 |
| 3 | VPC 엔드포인트 · IAM 역할 | 프라이빗 DNS 기본값 · 정책 마법사의 넓은 권한 | **코드 밖에 있는 리소스**(08 의 작업 호스트) |
| 4 | 2과제 리소스 일반 | 서비스가 자동 생성하는 로그 그룹 | **리전** — 콘솔에서 가장 틀리기 쉬운 값 |

PART-4 를 리전 중심으로 잡는 이유가 있다. 콘솔은 리전이 화면 위 드롭다운 하나이고 **한 번 잘못 고르면 그 뒤 모든 작업이 그 리전에서 일어난다.** 6단계에서 확인한 대로 2과제는 모듈마다 리전이 다르고 틀리면 0점이다.

---

### Task 1: PART-1 콘솔 배포 문서

**Files:** Create `src/content/docs/part-1/console-deploy.mdx`

- [ ] **Step 1: 1절 — VPC 를 콘솔로 만들고 대조**
  - 만든 뒤 `aws ec2 describe-vpcs` 로 확인하는 명령을 준다. **클릭 순서는 안 적는다**
  - [01 실습](/part-1/01-terraform-vpc/lab/)의 Terraform 산출물과 같은 조회로 비교
- [ ] **Step 2: 2절 — 콘솔이 끼워 넣는 것**
  - VPC 를 만들면 메인 라우트 테이블·기본 보안 그룹·DHCP 옵션 세트가 함께 생긴다
  - 그중 무엇이 [잔존 리소스 점검](/reference/cleanup-check/)에 걸리고 무엇이 VPC 와 함께 사라지는지 가른다
- [ ] **Step 3: 3절 — drift 판단**
  - 콘솔에서 태그를 하나 고치고 `terraform plan` 을 돌려 되돌리려 드는 것을 눈으로 본다
  - 세 선택지(코드 수정 · import · 방치)와 각각이 옳은 때
- [ ] **Step 4: 4절 — 판단표**

### Task 2: PART-2 콘솔 배포 문서

**Files:** Create `src/content/docs/part-2/console-deploy.mdx`

- [ ] **Step 1: 1절 — 노드그룹을 콘솔로 추가하고 대조**
- [ ] **Step 2: 2절 — 콘솔이 만드는 IAM 역할과 애드온**
- [ ] **Step 3: 3절 — eksctl 은 되돌리는 주체가 다르다**
  - eksctl 이 만든 것은 CloudFormation 스택이다. **`terraform plan` 이 아니라 스택이 정본이다**
  - 콘솔로 고치면 스택 상태와 어긋나고, 다음 `eksctl` 명령이 예상 못 한 동작을 한다
  - 이 파트의 drift 는 Terraform 과 성격이 다르다는 것이 요점
- [ ] **Step 4: 4절 — 판단표**

### Task 3: PART-3 콘솔 배포 문서

**Files:** Create `src/content/docs/part-3/console-deploy.mdx`

- [ ] **Step 1: 1절 — VPC 엔드포인트를 콘솔로 만들고 대조**
- [ ] **Step 2: 2절 — 프라이빗 DNS 기본값과 정책 마법사**
  - 엔드포인트 마법사의 기본값이 무엇인지, 그것이 닫힌 환경에서 왜 중요한지([08 실습 7-1](/part-3/08-private-eks-iam/lab/)과 연결)
- [ ] **Step 3: 3절 — 코드 밖 리소스**
  - 08 의 작업 호스트가 그 예다. 콘솔·CLI 로 만들어 코드에 없으면 `plan` 이 모르고, **지우는 것도 사람 몫**이다
  - set-03 이 그것을 코드로 옮긴 이유가 여기 있다
- [ ] **Step 4: 4절 — 판단표**

### Task 4: PART-4 콘솔 배포 문서

**Files:** Create `src/content/docs/part-4/console-deploy.mdx`

- [ ] **Step 1: 1절 — 리전을 먼저 맞추고 시작한다**
  - 콘솔의 리전 드롭다운이 세션 전체에 걸린다는 것
  - 지금 어느 리전을 보고 있는지 확인하는 방법
- [ ] **Step 2: 2절 — 서비스가 자동 생성하는 로그 그룹**
  - 함수·API 를 만들면 로그 그룹이 자동으로 생긴다. 이름 규칙이 코드로 지정한 것과 다르면 [03 의 6-1](/part-1/03-container-lambda-dynamodb/lab/)과 같은 상황이 된다
- [ ] **Step 3: 3절 — 리전이 다른 drift**
  - 틀린 리전에 만든 것은 `plan` 이 모른다. **다른 리전의 리소스는 상태에도 코드에도 없다**
  - 찾는 유일한 방법이 리전을 바꿔 가며 조회하는 것
- [ ] **Step 4: 4절 — 판단표**

### Task 5: 검증과 마무리

- [ ] **Step 1: `npm run build`** — 링크 검증 0건
- [ ] **Step 2: 사이드바에 네 문서가 각 파트 끝에 붙었는지 확인** — `dist` 의 파트 페이지에서 링크 존재 확인
- [ ] **Step 3: spec 5절·10절 갱신** — 7단계 완료 표시

## 다음 단계 게이트

Task 5 까지 끝나면 멈춘다. spec 10절 8단계(모듈 14 QnA 반영 · 16 색인 · 15 축소 · `reference/links` 갱신)로 가기 전에 확인받는다.

## 미해결

- 앞 단계에서 넘어온 것 — 6·7절 주입·복구 명령의 실행 결과 문구는 미검증이다.
- **콘솔 화면은 실제로 열어 보지 않았다.** 그래서 이 문서들은 화면 묘사를 하지 않고 **만든 뒤 CLI 로 확인하는 방식**으로만 쓴다. 그 편이 UI 변경에도 안 낡는다.
- `변형 셀프 체크`·`오답 노트 양식` 이 PART-5·6 다섯 파일에 남아 있다. 8단계 소관이다.
