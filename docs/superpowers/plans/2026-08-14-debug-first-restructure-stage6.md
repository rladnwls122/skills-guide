# 디버깅 중심 개편 — 6단계 구현 계획 (PART-4, 모듈 09~13)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2과제 모듈 다섯 편을 변동 이행 훈련으로 바꾼다.

**Spec:** `docs/superpowers/specs/2026-08-14-debug-first-restructure-design.md` 10절 6단계
**선행:** 1~3단계·4단계·5단계 계획(전부 완료)

## 사용자 지시 (2026-08-14)

- **짝이 없으면 자체 제작해도 된다.** 12·13 에 적용한다.
- **대회장에서 30% 변동에 대응하는 훈련이 최우선이다.** 다른 목표와 충돌하면 이쪽을 택한다.

## PART-4 는 계약을 변형한다

PART-1~3 은 모듈 하나가 계층 하나였다. PART-4 는 다르다. **2과제는 세트마다 독립 모듈 4개**이고, 사이트의 모듈 하나가 여러 세트의 여러 유형을 묶고 있다 — 09 는 Part A·B, 10 은 Part A·B·C 다.

유형이 서로 독립이므로 `0~8절` 을 통째로 한 벌 쓸 수 없다. 대신 이렇게 한다.

```
## 0. 변동 짝과 리전            모듈 전체 공통. 어느 세트에서 어느 세트로 가나
## Part A — <유형 이름>
###   A-1 변동 과제지
###   A-2 이행 (타이머)
###   A-3 통과 기준
###   A-4 복기
###   A-5 배포와 채점
## Part B — <유형 이름>          (같은 구조)
## 6. 과제지 오독 복구           모듈 공통 + 파트별
## 7. 장애 진단                  모듈 공통
## 8. 정리
```

**6·7·8 절은 모듈 하나에 한 벌만 둔다.** 파트마다 복구·진단을 반복하면 같은 판정 축을 여러 번 쓰게 되고 분량만 는다.

기준본을 띄우는 방식은 PART-2 와 같다 — **기준본은 읽는 파일이고, 배포되는 것은 이행본 하나다.** 2과제 모듈은 서로 다른 리전에 떠서 동시에 여러 벌을 띄우면 비용이 곱으로 든다.

## Global Constraints

- 커밋 메시지는 한국어로. 무엇을 왜 바꿨는지를 본문에 남긴다.
- 콘텐츠는 CRLF. 새 `.mdx` 를 만들지 않는다.
- 본문 H1 금지. 사이트 문서는 절대 경로 링크, 정답지 레포 파일은 GitHub 링크.
- 셸 명령은 PowerShell·bash 두 탭.
- **재보지 않은 분 단위 수치는 쓰지 않는다.**
- 접이식은 띄울 것이 있는 절에만. 블록 안은 실행·기대 출력·안 나올 때 볼 곳 셋.
- 고장 주입은 CLI·kubectl 로, 복구 명령을 짝으로.
- `변형 셀프 체크` 와 `오답 노트 양식` 은 흡수해 삭제한다. 6절과 4절이 같은 일을 한다.
- **자체 제작한 변동은 `:badge[자체 제작]{variant=caution}` 로 표시한다.** 실측과 섞이면 안 된다.

---

## 근거 — 실측한 변동 (2026-08-14 diff)

### 리전이 모듈마다 다르다 — PART-4 공통 변동

| 모듈 | 기준본 리전 | 타깃 리전 |
|---|---|---|
| 09 | `eu-west-1` | `ap-southeast-1` |
| 10 | `ap-northeast-2` | `us-west-2` |
| 11 | `ap-northeast-2` | `ap-southeast-1` |
| 12 | `ap-northeast-1` | (자체 제작) |
| 13 | `us-east-1` | (자체 제작) |

**전부 다르고, 틀리면 그 모듈은 0점이다.** PART-1~3 에서는 리전이 서울로 고정이라 나오지 않던 축이다. 이것 하나만으로도 PART-4 의 이행은 성격이 다르다.

### 모듈 09 — 이벤트 자동복구 (set-02 모듈3 → set-08 모듈3)

| 항목 | set-02 (기준본) | set-08 (타깃) |
|---|---|---|
| 리전 | `eu-west-1` | `ap-southeast-1` |
| 이름 | `wsc2026-event-*` | `skills-ceh-*` |
| **탐지 수단** | **AWS Config 규칙 2개** + EventBridge 규칙 2개 | **CloudTrail** + EventBridge 규칙 1개 |
| Lambda | **4개** — ec2-stop-remediation · ec2-terminate-alert · sg-remediation · tag-alert | **1개** — `skills-ceh-remediate-fn` |
| 복구 대상 | EC2 중지 복구 + SG 인바운드 제거 + 태그 알림 | **SG 인바운드 제거 하나** |
| 채점 방식 | 트리거를 실제로 만들고 30초 뒤 상태 확인 | **Lambda 를 직접 invoke** 하고 최대 36회 폴링 |
| tf 파일 | `config.tf` · `ec2.tf` 있음 | 대신 `sg.tf` |

**교육적 핵심은 탐지 수단의 교체다.** AWS Config 는 주기 평가라 반영이 늦고, CloudTrail 은 API 호출을 이벤트로 흘려 즉시 반응한다. 같은 "자동복구" 요구를 다른 기전으로 푸는 것이라, 규칙 이름만 바꿔서는 안 된다.

Lambda 가 4개에서 1개로 줄어드는 것도 방향이 반대다 — 보통 요구가 늘면 리소스가 느는데 여기서는 **역할이 통합된다.** 남는 Lambda 를 지우는 판단이 [08](/part-3/08-private-eks-iam/lab/)의 삭제 판단과 같은 종류다.

### 모듈 10 — 오토스케일링 (set-07 모듈3 → set-08 모듈4)

파일 구조는 양쪽이 같다. **바뀌는 것은 값이고, 그 값 하나가 다른 필드의 유효성을 뒤집는다.**

| 항목 | set-07 (기준본) | set-08 (타깃) |
|---|---|---|
| 리전 | `ap-northeast-2` | `us-west-2` |
| 네임스페이스 | `skillsmkt` | `skills-sqs` |
| SQS | 기본값만 | `visibility_timeout_seconds` 명시 |
| **`minReplicaCount`** | **1** | **0** |
| `maxReplicaCount` | 5 | 6 |
| `queueLength` | 5 | 2 |
| `pollingInterval` | **없다** (min=1 이면 무효 필드) | **15** (min=0 이면 필수) |
| `cooldownPeriod` | 없다 | 30 |
| scaleDown 조율 | `advanced.horizontalPodAutoscalerConfig.behavior` | **없다** — `cooldownPeriod` 가 대신 |
| 인증 | `identityOwner: operator` | **`TriggerAuthentication` + `podIdentity.provider: aws`** |

**`minReplicaCount` 를 1에서 0으로 바꾸는 한 줄이 세 필드의 필요성을 뒤집는다.**

- min≥1 이면 스케일링이 전부 HPA 폴링이라 `pollingInterval` 이 무효 필드다 (KEDA webhook 이 경고한다)
- min=0 이면 0→1 활성화를 KEDA operator 가 직접 폴링하므로 `pollingInterval` 이 **필수**가 된다
- min≥1 이면 축소를 HPA `behavior` 로 조율하고, min=0 이면 `cooldownPeriod` 가 그 자리를 맡는다

이 모듈의 판정 축은 **"한 값이 다른 필드를 유효/무효로 만든다"** 이다. PART-1~3 에 없던 축이다.

`identityOwner` → `TriggerAuthentication` 은 KEDA 3.0 에서 전자가 제거되기 때문이다. 도구 세대 교체가 과제에 반영된 사례라 [03 의 프로바이더 버전 판정](/part-1/03-container-lambda-dynamodb/lab/)과 짝이 된다.

### 모듈 11 — NoSQL (set-08 모듈1 → set-07 모듈1)

**엔진 자체가 바뀐다.** 이 커리큘럼에서 가장 큰 변동이다.

| 항목 | set-08 (기준본) | set-07 (타깃) |
|---|---|---|
| 리전 | `ap-northeast-2` | `ap-southeast-1` |
| 엔진 | **DocumentDB** — 클러스터 + 인스턴스 | **DynamoDB** — 테이블 2개 |
| 자격증명 | Secrets Manager + 전용 KMS 키 | 없다 — IAM 으로 접근 |
| 네트워크 | VPC 안, 보안 그룹 필요 | VPC 밖 관리형 엔드포인트 |
| 스키마 | 인덱스를 부트스트랩 EC2 가 만든다 | `hash_key`·`range_key`·GSI 를 선언 |
| 변경 감지 | 없음 | **Streams** `NEW_AND_OLD_IMAGES` + Lambda ESM |
| tf 파일 | `docdb.tf` · `secrets.tf` · `sg.tf` · `index_setup.py.tftpl` | `dynamodb.tf` · `lambda.tf` |

**"NoSQL 데이터베이스"라는 같은 요구가 전혀 다른 구성으로 간다.** 문서 DB 는 서버가 있고 VPC 안에 있으며 접속 정보를 관리해야 한다. 키-값 DB 는 서버가 없고 VPC 밖이며 IAM 으로 접근한다.

그래서 이 모듈의 이행은 **고칠 자리를 찾는 것이 아니라 지우고 새로 쓰는 것**이다. 그것을 판정하는 것 자체가 훈련이다 — 어디까지가 옮겨 쓸 수 있는 것이고 어디부터가 버려야 하는 것인지.

### 모듈 12 — VPC Lattice (set-08 모듈2 → **자체 제작**)

spec 4절 표는 타깃을 `set-05 모듈2` 로 적었다. **쓰지 않는다.** `CLAUDE.md` 의 근거 규칙상 2과제 수상 후보는 set-02·07·08 이고 **set-05 는 후보가 아니다.** 후보 밖 세트를 이행 타깃으로 삼으면 훈련 방향이 실제 시험과 어긋난다.

사용자 승인(2026-08-14)에 따라 **변동을 자체 제작한다.** 지어내되 기전은 실재하는 것만 쓴다.

기준본 실측 — [set-08 `module-2-lattice`](https://github.com/ishs-cloud-computing/skills-2026/tree/main/set-08/task-2/module-2-lattice):

| 항목 | 값 |
|---|---|
| 리전 | `ap-northeast-1` |
| 서비스 네트워크 `auth_type` | `NONE` |
| 서비스 `auth_type` | `NONE` |
| VPC 연결 | Client VPC 만 (소비 측만) |
| 타깃 그룹 | EC2 인스턴스 대상, HTTP + 헬스체크 |
| 리스너 | HTTP forward |

**자체 제작할 변동 — 인증을 켠다.**

| 항목 | 기준본 | 자체 제작 타깃 |
|---|---|---|
| 리전 | `ap-northeast-1` | `ap-southeast-2` |
| `auth_type` | `NONE` | **`AWS_IAM`** |
| 인증 정책 | 없음 | `aws_vpclattice_auth_policy` 신설 |
| 클라이언트 호출 | 평범한 HTTP | **SigV4 서명 필요** |
| 클라이언트 권한 | 불필요 | 인스턴스 역할에 `vpc-lattice-svcs:Invoke` |

이 변동을 고른 이유는 셋이다.

1. **`auth_type` 은 실재하는 필드이고 값이 둘뿐이다** — `NONE` 과 `AWS_IAM`. 지어낸 것이 아니다
2. **한 값을 바꾸면 클라이언트 쪽이 통째로 바뀐다.** 서명 없는 요청이 403 이 되므로 `curl` 이 그대로는 안 된다. 서버만 고치고 끝내면 통신이 끊긴다 — 짝을 세는 훈련이 그대로 성립한다
3. **7절 진단 소재가 자연스럽게 나온다.** "설정은 다 맞는데 403" 이 인증 계층 고장의 전형이다

리전은 후보 세트가 쓰지 않는 곳으로 골라 기준본과 겹치지 않게 한다.

### 모듈 13 — CDN Function (set-07 모듈2 → **자체 제작**)

spec 이 "짝 없음 — 자체 제작"으로 이미 정해 둔 모듈이다.

기준본 실측 — [set-07 `module-2-cdn-function`](https://github.com/ishs-cloud-computing/skills-2026/tree/main/set-07/task-2/module-2-cdn-function):

- KVS 키 셋: `weight` · `version_a` · `version_b`
- viewer-request: 쿠키 `x-sp-ab` 가 있으면 그 버전 유지, 없으면 `weight` 로 **무작위** 배정 후 `request.uri` 교체
- viewer-response: 배정이 새로 일어났을 때만 `Set-Cookie`
- `keys_exclusive` 로 여분 키 금지, `publish = true` 로 LIVE 발행

**자체 제작할 변동 — 무작위 배정을 결정적 배정으로 바꾼다.**

| 항목 | 기준본 | 자체 제작 타깃 |
|---|---|---|
| 배정 기준 | `Math.random()` 과 `weight` 비교 | **요청 속성에서 계산한 결정적 값** |
| 재방문 처리 | 쿠키로 고정 | **쿠키 없이도 같은 사용자는 같은 버전** |
| KVS 키 | `weight` · `version_a` · `version_b` | **버킷 수 + 버킷별 경로** |
| viewer-response | Set-Cookie | 배정 결과를 응답 헤더로 노출 |

이 변동을 고른 이유는 셋이다.

1. **요구가 현실적이다.** "쿠키를 못 쓰는 환경에서도 사용자당 일관된 버전"은 A/B 테스트의 표준 요구다
2. **`Math.random()` 을 지우는 것이 핵심이다.** 무작위가 있으면 채점이 결정적으로 확인할 수 없다. 기준본이 쿠키로 그것을 메웠는데, 쿠키를 빼면 다른 방법이 필요하다
3. **CloudFront Functions 의 제약을 만난다.** 실행 환경이 제한적이라 해시를 직접 만들어야 하고, `await` 를 인자 안에 못 쓰는 제약도 그대로 남는다 — 기준본 주석이 이미 그것을 경고한다

**지어낸 부분과 실측 부분을 문서에서 분리해 표시한다.** 기준본 서술은 전부 실측이고, 타깃 요구만 자체 제작이다.

---

### Task 1: 모듈 09 — 서버리스·이벤트

**Files:** `src/content/docs/part-4/09-serverless-event/{theory,lab,index}.mdx`

- [ ] **Step 1: theory 접이식 1~2개** — 탐지 수단 대조. `aws configservice describe-config-rules` 와 `aws events describe-rule` 을 나란히 조회해 **반영 시점이 다르다**는 것을 보게 한다. 조회는 무료
- [ ] **Step 2: theory 에 set-08 대조 절** — AWS Config ↔ CloudTrail, Lambda 4→1
- [ ] **Step 3: lab 을 Part 구조 + 6·7·8절로 재작성**
  - 0절: 변동 짝과 **리전 표**. 리전 틀리면 0점이라는 경고를 여기 둔다
  - Part A(서버리스 워크플로)·Part B(이벤트 자동복구) 각각 A-1~A-5
  - 6절: 6-1 리전을 기준본대로 뒀다 · 6-2 Lambda 를 4개 그대로 뒀다(삭제 판단) · 6-3 탐지 수단을 Config 로 뒀다(전면 재작성)
  - 7절: 7-1 복구가 안 돈다(EventBridge 타깃·Lambda 권한) · 7-2 복구는 도는데 되돌아온다(무한 루프 — 자기 호출 배제 조건 누락)

### Task 2: 모듈 10 — 스케일링·로깅

**Files:** `src/content/docs/part-4/10-scaling-logging-streaming/{theory,lab,index}.mdx`

- [ ] **Step 1: theory 접이식** — `helm show values kedacore/keda` 또는 KEDA CRD 필드 조회로 `minReplicaCount` 와 `pollingInterval` 의 관계를 문서에서 확인
- [ ] **Step 2: theory 에 set-08 대조 절** — min=0 이 뒤집는 세 필드
- [ ] **Step 3: lab 재작성**
  - 6절: 6-1 `queueLength` 오독(in-place) · 6-2 min 을 1로 둔 채 `pollingInterval` 만 넣었다(무효 필드 — 경고만 나고 안 먹는다) · 6-3 `identityOwner` 를 그대로 뒀다(KEDA 버전 의존)
  - 7절: 7-1 파드가 안 늘어난다(트리거 인증 → 큐 조회 권한) · 7-2 파드가 0으로 안 준다(`cooldownPeriod`·소비 완료 여부)

### Task 3: 모듈 11 — NoSQL 엔진 교체

**Files:** `src/content/docs/part-4/11-documentdb/{theory,lab,index}.mdx`

- [ ] **Step 1: theory 접이식** — 두 엔진의 접근 경로 차이를 조회로. DocumentDB 는 `describe-db-clusters` 로 엔드포인트가 나오고 DynamoDB 는 엔드포인트가 없다
- [ ] **Step 2: theory 에 엔진 대조 절** — 서버 유무 · VPC 안팎 · 자격증명 방식 · 스키마 선언 위치
- [ ] **Step 3: lab 재작성**
  - 2절 이행 질문에 **"무엇을 버리나"** 를 명시한다. Secrets Manager·보안 그룹·부트스트랩 EC2 가 전부 불필요해진다
  - 6절: 6-1 테이블 이름 오독(재생성) · 6-2 Streams 를 안 켰다(**나중에 켤 수 있으나 과거 변경은 안 온다** — 06 의 시간 축과 같은 종류) · 6-3 DocumentDB 리소스를 안 지웠다(삭제 판단 + **클러스터는 시간당 과금**이라 가장 비싸다)
  - 7절: 7-1 Lambda 가 스트림을 못 읽는다(ESM 권한) · 7-2 조건부 쓰기가 항상 실패한다(조건식과 키 스키마 불일치)

### Task 4: 모듈 12 — VPC Lattice (자체 제작 변동)

**Files:** `src/content/docs/part-4/12-vpc-lattice/{theory,lab,index}.mdx`

- [ ] **Step 1: theory 접이식** — `aws vpc-lattice get-service-network` 로 `authType` 조회. 값이 둘뿐이라는 것을 CLI help 로 확인
- [ ] **Step 2: theory 에 인증 켜기 절 추가** — `AWS_IAM` 을 켜면 클라이언트가 SigV4 를 해야 한다는 연쇄
- [ ] **Step 3: lab 재작성.** 타깃 표에 `:badge[자체 제작]{variant=caution}` 를 단다
  - 6절: 6-1 서비스 네트워크만 켜고 서비스는 안 켰다(둘 다 필요) · 6-2 인증 정책을 안 붙였다(**기본 거부**) · 6-3 클라이언트 역할에 호출 권한을 안 줬다
  - 7절: 7-1 설정은 맞는데 403(서명 안 함) · 7-2 이름이 안 풀린다(VPC 연결 누락)

### Task 5: 모듈 13 — CDN Function (자체 제작 변동)

**Files:** `src/content/docs/part-4/13-cdn-function/{theory,lab,index}.mdx`

- [ ] **Step 1: theory 접이식** — `aws cloudfront describe-function` 으로 스테이지(`DEVELOPMENT`/`LIVE`)를 조회. `publish` 한 줄이 무엇을 만드는지 본다
- [ ] **Step 2: theory 에 결정적 배정 절 추가** — 무작위를 지우면 무엇이 필요해지나
- [ ] **Step 3: lab 재작성.** 자체 제작 표시
  - 6절: 6-1 KVS 키를 남겼다(`keys_exclusive` 라 여분 키가 채점에 걸린다) · 6-2 `publish` 를 빼먹었다(코드는 맞는데 LIVE 에 없다) · 6-3 배정 기준을 무작위로 뒀다(재현이 안 돼 채점 불가)
  - 7절: 7-1 함수가 통째로 안 돈다(연결 안 함 vs 문법 오류 구분) · 7-2 KVS 를 못 읽는다(연결 ARN·키 부재)

### Task 6: 마무리

- [ ] **Step 1: `변형 셀프 체크`·`오답 노트 양식` 전멸 확인**

  Run: `grep -rn "변형 셀프 체크\|오답 노트 양식" src/content/docs/part-4/`
  Expected: 0건

- [ ] **Step 2: `reference/links` 의 변동 짝 표에 PART-4 행 추가** — 자체 제작 표시 포함
- [ ] **Step 3: spec 4절 표와 13절 갱신** — 12 의 타깃을 set-05 에서 자체 제작으로, 13 확정
- [ ] **Step 4: `npm run build`** — 링크 검증 0건

## 다음 단계 게이트

Task 6 까지 끝나면 멈춘다. spec 10절 7단계(콘솔 배포 문서 4편)로 가기 전에 확인받는다.

## 미해결

- 4·5단계에서 넘어온 것 — kubectl 출력 문구와 6·7절 end-to-end 미검증. PART-4 도 같다.
- **자체 제작한 12·13 의 변동은 실제 과제로 나온 적이 없다.** 기전은 실재하지만 "이렇게 바뀔 것"이라는 예측은 아니다. 문서에 그렇게 밝힌다.
- 모듈 10 의 Part C(스트리밍)는 set-02 근거가 개념 위주라 이행 짝을 만들 수 없다. 현행 유지한다.
