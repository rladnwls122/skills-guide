# 디버깅 중심 개편 — 5단계 구현 계획 (모듈 02·03·06·07·08)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 01·04·05 에서 확정한 계약(theory 접이식 + lab 0~8절)을 PART-1·2·3 의 나머지 모듈로 확산한다.

**Architecture:** 형식은 4단계에서 확정됐다. 이 단계에서 새로 정할 것은 **모듈마다 다른 판정 축**과 **변동 짝** 둘뿐이다. 01 은 `terraform plan` 의 `forces replacement`, 04 는 수정 API 유무, 05 는 k8s 불변 필드와 AWS 불변 속성이었다. 02·03 은 Terraform 이라 01 축을 쓰고, 06 은 helm·k8s 라 05 축을 쓰고, 08 은 04 축을 쓴다.

**Spec:** `docs/superpowers/specs/2026-08-14-debug-first-restructure-design.md` 10절 5단계
**선행:** 1~3단계 계획(완료), 4단계 계획(완료, 실행 검증 결과 포함)

## 확산 게이트 결과 (2026-08-14 승인)

4단계 뒤 네 문항 전부 **현행 유지**로 승인됐다.

1. 0절이 정답지 GitHub 링크로 넘기는 방식 — 유지. 01 만 사이트 안에서 세우는 비대칭도 유지
2. theory 가 인프라를 만드는 모듈(01)과 안 만드는 모듈(04·05)이 섞이는 것 — 유지
3. 판정 축을 모듈마다 다시 쓰는 것 — 유지
4. lab 이 560행대로 늘어나는 분량 — 유지

## Global Constraints

- 커밋 메시지는 한국어로. 무엇을 왜 바꿨는지를 본문에 남긴다.
- 콘텐츠는 CRLF. 스크립트로 `.mdx` 를 다루면 `\r` 을 먼저 지운다.
- 새 `.mdx` 를 만들지 않는다. dev 서버 재시작 불필요.
- 본문에 H1 금지. 사이트 문서는 절대 경로 링크, 정답지 레포 파일은 GitHub 링크.
- 셸 명령은 PowerShell·bash 두 탭.
- **재보지 않은 분 단위 수치는 쓰지 않는다.** 정답지 README 에 적힌 값(클러스터 20분 등)만 인용한다.
- 접이식 블록 안은 셋으로 제한: 실행 명령, 기대 출력, 기대와 다를 때 볼 곳 한 줄.
- 접이식은 **띄울 것이 있는 절에만.** 절마다 하나는 상한이지 의무가 아니다.
- 고장 주입은 CLI·kubectl 로 하고 복구 명령을 짝으로 적는다.
- `변형 셀프 체크` 는 흡수해 삭제한다.

---

## 근거 — 실측한 변동 (2026-08-14 diff)

### 모듈 02: KMS·S3·CloudFront (set-02 → set-07)

| 항목 | set-02 | set-07 |
|---|---|---|
| CMK 분류 축 | **리소스별** — `s3` · `dynamodb` · `eks` | **용도별** — `app`(DynamoDB·Secrets) · `data`(S3·ECR) · `platform`(EKS·EBS·Log·WAF) |
| 회전 | `enable_key_rotation` 만 (기본 365일) | `rotation_period_in_days = 90` |
| 다중 리전 | 없음 | **platform 은 MRK** — WAF 로그가 us-east-1 이라 복제 키가 필요하다 |
| S3 버킷명 | `wskorea26-concert-bucket-<비번호>` | `unicorn-web-<ACCOUNT_ID>` |
| S3 버전 관리 | 없음 | **있음** |
| 정적 객체 경로 | `web/main/` 아래, 파일명 명시 목록 | 버킷 루트, `setsubtract(fileset(...))` 로 자동 |
| WAF | 없음 | **`waf.tf` 신규** |
| CloudFront | 인터넷 ALB 오리진 + 커스텀 헤더 | **VPC Origin** |

`mark 2-1-A` 가 세 키의 `[KeyRotationEnabled, RotationPeriodInDays]` 를 alias 로 역조회한다. `3-1-A` 가 버킷의 퍼블릭 차단 4종·버전 관리·암호화를, `8-6-A` 가 XSS 프로브로 WAF 를 잰다.

**교육적 핵심은 분류 축의 전환이다.** "리소스마다 키 하나"를 규칙으로 외우면 set-07 에서 키를 여섯 개 만들게 된다. 키를 나누는 기준이 과제지마다 다르다는 것을 알아야 한다.

### 모듈 03: 컨테이너·Lambda·DynamoDB (set-02 → set-07)

| 항목 | set-02 | set-07 |
|---|---|---|
| 테이블명 | `wskorea26-data-table` | `unicorn-concert-db` |
| **파티션 키** | `client_id` | **`booking_id`** |
| GSI | `concert_name-created_at-index` | `client-id-created-at-index` (PK `client_id` / SK `created_at`) |
| GSI 문법 | `key_schema` 블록 2개 | `hash_key` · `range_key` 축약 |
| PITR | 없음 | **있음** |
| 테이블 CMK | `wskorea26-dynamodb-key` | App CMK |
| ECR 태그 정책 | 기본(MUTABLE) | **`IMMUTABLE_WITH_EXCLUSION`** + `latest` 제외 필터 — **provider 6.8.0+ 필요** |
| ECR 암호화 키 | AWS 관리형 `aws/ecr` | Data CMK 명시 |
| 이미지 태그 | `stable` | `v1.0.0` + `latest` |
| Lambda 이름 | `wskorea26-book-lambda` | `unicorn-get-booking-func` |
| Lambda 로그 그룹 | `/aws/lambda/<함수명>` (기본 규칙) | **`/unicorn/lambda/get-booking`** (직접 지정) + Platform CMK |
| Lambda 권한 | `dynamodb:Query` | `dynamodb:GetItem` + `Query` |

**파티션 키가 이 모듈의 VPC CIDR 자리다.** DynamoDB 의 `hash_key` 는 변경 불가라 테이블 재생성이고, 삭제 방지가 켜져 있어 **먼저 꺼야** 지워진다. 그 순서를 모르면 destroy 가 막힌다.

**ECR 태그 정책이 두 번째 함정이다.** 요구가 "latest 를 제외한 태그 중복 불허"인데, 그걸 표현하는 값은 provider 6.8.0 이상에만 있다. 과제지 요구가 **도구 버전을 올리게 만드는** 사례라 따로 다룬다.

### 모듈 06: 관측성 — **타깃을 set-03 에서 set-07 로 바꾼다**

spec 4절 표는 06 의 변동 타깃을 set-03 으로 적었다. **이 계획은 set-07 로 바꾼다.** 근거는 둘이다.

1. **04·05 가 set-07 클러스터를 세운다.** 06 이 set-03 을 타깃하면 학습자는 06 을 하려고 다른 클러스터를 다시 세워야 한다. 20분과 실비가 한 번 더 든다.
2. **실측한 set-07 변동이 04·05 와 정확히 맞물린다.** 특히 저장소가 그렇다 — set-02 는 EBS CSI 가 없어 Prometheus 를 `emptyDir` 로 두는데, set-07 은 04 에서 `aws-ebs-csi-driver` 를 깔았으므로 PVC 를 쓴다. **04 의 애드온 추가가 06 의 저장소 변경을 부른다**는 연결이 set-03 짝으로는 안 나온다.

set-03 의 `log_to_metrics` 패턴은 theory 주제 3 에 이미 있으므로 개념 대조로 남기고, 이행 훈련만 set-07 로 옮긴다.

| 항목 | set-02 | set-07 |
|---|---|---|
| release 이름 | `wskorea26-monitoring` | `unicorn-monitoring` |
| 노드 라벨 키 | `node-type: addon` | `unicorn: addon` |
| Alertmanager | `enabled: false` | 비활성 블록 없음 = **활성** |
| Prometheus 저장소 | `emptyDir` (EBS CSI 미설치) | **PVC + `unicorn-sc`** (Platform CMK) |
| 로그 네임스페이스 | `monitoring` 안에 Fluent Bit | **`logging` 으로 분리** |
| 추가 수집기 | 없음 | **CloudWatch Exporter** (ALB `TargetResponseTime` → Prometheus) |
| 로그 그룹 | set-02 규칙 | `/unicorn/eks/book-app` |

`mark 11-1-A` 가 로그 그룹의 JSON 키 목록과 `/health` 필터 건수를, `11-2-A` 가 파드 상태와 **ServiceMonitor 수가 0 인지**를 잰다. `12-1-A`·`12-2-A` 는 로그 파이프라인 지연을 감안해 `sleep` 을 건다.

### 모듈 07: 완주 — **계약을 다르게 적용한다**

07 은 PART-2 종합이라 변동 짝이 "종합"이다. 여기에 6·7절을 또 넣으면 01~06 의 것을 중복한다. **07 은 0~5절까지만 쓰고, 6절을 앞 모듈의 복구·진단으로 보내는 색인으로 둔다.**

| 절 | 07 에서 |
|---|---|
| 0 기준본 | 없음 — 백지에서 시작하는 것이 이 모듈의 요점이다 |
| 1 변동 과제지 | set-07 1과제 전체. 앞 모듈이 나눠 본 것을 한 장으로 |
| 2 이행 (타이머) | 전체를 시간 안에 |
| 3 통과 기준 | 배포 없이 되는 판정 전부 |
| 4 복기 | 정답지 전체와 diff |
| 5 배포와 채점 | `mark.sh` 전 항목 |
| 6 복구·진단 색인 | 01~06 의 6·7절로 보내는 표. 무작위로 골라 도는 드릴 진행법 |
| 7 정리 | 순서 엄수 |

spec 7절이 모듈 16 을 전체 색인으로 만든다. 07 의 색인은 **PART-2 범위**로 좁혀 겹치지 않게 한다.

### 모듈 08: Private EKS·IAM — **타깃을 set-03 으로 확정한다**

spec 13절이 "타깃을 못 정했다"로 남긴 항목이다. **기준본 set-07 → 타깃 set-03** 으로 정한다.

근거: 1과제 수상 후보는 set-02·03·07 셋이고, 그중 fully-private 클러스터는 set-03 과 set-07 둘이다. 기준본이 set-07 이므로 타깃은 set-03 하나로 결정된다.

| 항목 | set-07 (기준본) | set-03 (타깃) |
|---|---|---|
| 클러스터 | `unicorn-eks-cluster` | `wsc2026-eks-cluster` |
| 작업 bastion | **손으로 만든다** — README `3)` 의 CLI 절차, 채점 전 수동 삭제 | **Terraform 이 관리한다** — `bastion.tf` |
| 노드그룹 | `unicorn-app-ng` · `unicorn-addon-ng` | `wsc2026-workload-ng` · `wsc2026-addon-nodegroup` |
| taint | 없음 | **workload NG 에 `NoSchedule`** — 앱에 toleration 필요 |
| CoreDNS | 기본 도메인 | **커스텀 도메인** (`overrideBootstrapCommand` 로 nodeadm NodeConfig) |
| 라벨 키 | `unicorn` | `wsc2026/node` |

**변동의 성격이 다른 모듈과 다르다.** 값이 바뀌는 것이 아니라 **같은 문제를 푸는 방식이 수동에서 IaC 로** 바뀐다. 그래서 6절 오독 복구도 "값을 잘못 읽었다"가 아니라 "손으로 만든 것을 채점 전에 못 지웠다"가 소재가 된다 — 불필요 리소스 감점이다.

set-03 의 채점 항목 형식은 `=====5-1=====` 이라 set-07 의 `=== 6-1-A ===` 와 다르다. 인용할 때 형식을 맞춘다.

---

### Task 1: 모듈 02 — KMS·S3·CloudFront

**Files:** `src/content/docs/part-1/02-kms-s3-cloudfront/{theory,lab,index}.mdx`

현행 theory 690행 · lab 486행. theory 7절 구조는 좋으므로 유지하고 접이식과 대조만 더한다. lab 은 `단계별 절차`(65~373행) 구조라 전면 재작성이다.

- [ ] **Step 1: theory 접이식 2개**
  - 1절(Envelope Encryption) 끝 — `aws kms encrypt`/`decrypt` 왕복으로 데이터 키가 무엇인지 눈으로. 과금은 요청당 극소. CMK 를 새로 만들지 않고 **기존 alias 를 조회만** 하도록 쓴다
  - 5절(S3 보안) 끝 — `aws s3api get-public-access-block`·`get-bucket-encryption` 조회. 만들지 않는다
- [ ] **Step 2: theory 4절에 set-07 대조 추가** — 키 분류 축이 리소스별에서 용도별로 바뀌는 것, 90일 회전, MRK. 4절 제목이 "서비스별 CMK 분리"라 그 전제 자체가 변동 대상임을 밝힌다
- [ ] **Step 3: theory 7절(WAF)에 set-07 이 WAF 를 실제로 쓴다는 것 명시** — 현행은 개념만. `mark 8-6-A` 가 XSS 프로브로 잰다는 실측을 넣는다
- [ ] **Step 4: lab 0~8절 재작성.** 판정 축은 01 과 같은 `terraform plan`
  - 6-1 **키 alias 를 잘못 지었다** — alias 는 `aws kms update-alias` 로 옮길 수 있다. 즉시 수정
  - 6-2 **회전 주기를 안 넣었다** — `plan` 이 `~ update in-place`. 초
  - 6-3 **버킷 이름을 잘못 읽었다** — `forces replacement`. 버킷명이 바뀌면 CloudFront OAC 와 KMS 키 정책이 함께 끌려온다. 이 모듈의 가장 비싼 값
  - 7-1 **CloudFront 가 403 을 낸다** — 주입: `aws s3api delete-bucket-policy`. 좁히는 순서는 CDN → OAC → 버킷 정책 → KMS 키 정책. **KMS 까지 내려가는 것이 이 모듈 고유의 계층**
  - 7-2 **객체는 있는데 복호화가 안 된다** — 주입: 키 정책에서 CloudFront service principal 의 `Decrypt` 제거. 복구는 `terraform apply`

### Task 2: 모듈 03 — 컨테이너·Lambda·DynamoDB

**Files:** `src/content/docs/part-1/03-container-lambda-dynamodb/{theory,lab,index}.mdx`

- [ ] **Step 1: theory 접이식 2개**
  - 2절(ECR) 끝 — `aws ecr describe-repositories` 로 태그 정책·스캔·암호화 조회. 만들지 않는다
  - 3절(DynamoDB) 끝 — `aws dynamodb describe-table` 로 PK·GSI·PITR 조회
- [ ] **Step 2: theory 3절에 set-07 대조** — PK 가 바뀌면 무엇이 따라오는지. GSI 문법 두 가지(`key_schema` 블록 ↔ `hash_key`/`range_key`)를 나란히
- [ ] **Step 3: theory 2절에 `IMMUTABLE_WITH_EXCLUSION` 과 provider 버전 요구** — 과제지가 도구 버전을 올리게 만드는 사례
- [ ] **Step 4: lab 0~8절 재작성**
  - 6-1 **Lambda 로그 그룹 이름을 기본 규칙대로 뒀다** — `plan` 이 로그 그룹만 교체. 분
  - 6-2 **ECR 태그 정책을 못 바꾼다** — `plan` 이 아니라 **`terraform init -upgrade` 가 먼저다.** provider 가 낮으면 인자 자체를 모른다(`Unsupported argument`). 판정 축 밖의 실패라 따로 다룬다
  - 6-3 **파티션 키를 잘못 읽었다** — `forces replacement`. 삭제 방지를 먼저 꺼야 지워지고, GSI·Lambda 정책·앱 코드가 전부 따라온다. 이 모듈의 가장 비싼 값
  - 7-1 **Lambda 가 500 을 낸다** — 주입: 실행 역할에서 `dynamodb:Query` 제거. 좁히는 순서는 로그 그룹 → 에러 문자열 → 역할 정책 → 리소스 ARN(인덱스 `/index/*` 누락이 흔하다)
  - 7-2 **이미지 push 가 거부된다** — 주입: 같은 태그로 재push. `IMMUTABLE` 이면 거부되는 것이 정상 동작임을 구분하는 훈련

### Task 3: 모듈 06 — 관측성

**Files:** `src/content/docs/part-2/06-observability/{theory,lab,index}.mdx`

현행 theory 312행 · lab 247행으로 짧다. 늘어난다.

- [ ] **Step 1: theory 접이식 2개**
  - 2절(Fluent Bit) 끝 — `kubectl get ds -n <ns> -o wide` 로 DaemonSet 이 전 노드에 하나씩인지 확인
  - 4절(kube-prometheus-stack) 끝 — `helm template` 로 `nodeSelector` 가 실제로 어디에 박히는지. 설치하지 않는다
- [ ] **Step 2: theory 에 set-07 대조 절 추가** — Alertmanager, PVC, CloudWatch Exporter, `logging` 분리. **04 의 EBS CSI 추가가 여기서 PVC 를 가능하게 한다는 연결을 명시한다**
- [ ] **Step 3: lab 0~8절 재작성.** 판정 축은 05 와 같은 k8s 불변 필드 + helm
  - 6-1 **release 이름을 기준본대로 뒀다** — helm release 이름은 변경 불가. `uninstall` 후 재설치이고 그 사이 메트릭이 끊긴다
  - 6-2 **저장소를 `emptyDir` 로 뒀다** — StatefulSet 의 `volumeClaimTemplates` 는 불변. Prometheus 를 다시 세워야 하고 지금까지 쌓인 메트릭이 사라진다
  - 6-3 **로그 그룹 이름을 잘못 읽었다** — Fluent Bit ConfigMap 한 줄. 값은 싸지만 **이미 흘러간 로그는 옛 그룹에 남는다.** `mark 11-1-A` 가 새 그룹을 보므로 재시드가 필요하다
  - 7-1 **로그가 CloudWatch 에 안 올라온다** — 주입: Fluent Bit SA 의 Pod Identity 연결 삭제. 좁히는 순서는 DaemonSet 파드 → 그 로그 → 신원 → 로그 그룹 존재
  - 7-2 **Grafana 대시보드가 비었다** — 주입: ServiceMonitor 삭제. 좁히는 순서는 패널 쿼리 → Prometheus 타깃 → ServiceMonitor → 라벨 셀렉터

### Task 4: 모듈 07 — 완주

**Files:** `src/content/docs/part-2/07-full-deploy-set02/{theory,lab,index}.mdx`

- [ ] **Step 1: theory 4절(후보 세트 차이) 갱신** — 지금 set-02·03·07 을 나열만 한다. 04·05·06 이 실측한 차이를 반영해 표를 다시 쓴다
- [ ] **Step 2: theory 접이식 1개** — 1절(전체 아키텍처) 끝. `aws resourcegroupstaggingapi get-resources` 로 지금 계정에 뜬 것을 한 번에 세는 조회. 도식과 실제를 대조한다
- [ ] **Step 3: lab 0~7절 재작성** — 위 표대로. 6절은 색인이고 새 시나리오를 만들지 않는다
- [ ] **Step 4: 제목·경로 재검토** — 디렉터리가 `07-full-deploy-set02` 인데 내용이 set-07 완주가 된다. **디렉터리는 바꾸지 않는다**(URL 이 깨지고 새 `.mdx` 취급이 된다). frontmatter `title` 과 산문만 고친다

### Task 5: 모듈 08 — Private EKS·IAM

**Files:** `src/content/docs/part-3/08-private-eks-iam/{theory,lab,index}.mdx`

현행 lab 이 `실습 A` · `실습 B` 구조다. 0~8절로 바꾼다.

- [ ] **Step 1: theory 접이식 2개**
  - 주제 1(Fully-Private EKS) 끝 — `aws eks describe-cluster` 로 엔드포인트 상태 조회
  - 주제 4(Audit Role) 끝 — `aws iam get-role` 로 신뢰 정책의 `ExternalId` 조건 조회. **`assume-role` 을 실제로 하지 않는다** — 그것은 lab 소관
- [ ] **Step 2: theory 에 set-03 대조 절 추가** — bastion 이 수동에서 Terraform 으로, taint 추가, CoreDNS 커스텀 도메인
- [ ] **Step 3: lab 0~8절 재작성.** 판정 축은 04 와 같은 수정 API 유무
  - 6-1 **taint 를 걸고 toleration 을 안 달았다** — taint 는 `aws eks update-nodegroup-config --taints` 로 고칠 수 있으나, 앱 쪽 toleration 과 짝이라 한쪽만 고치면 파드가 Pending. 04 6-2 와 같은 구조
  - 6-2 **CoreDNS 도메인을 기본으로 뒀다** — `overrideBootstrapCommand` 는 노드 부팅 때만 도므로 **노드그룹 교체**다
  - 6-3 **작업 bastion 을 채점 전에 안 지웠다** — 값의 문제가 아니라 **불필요 리소스 감점**이다. 판정 축이 "고칠 수 있나"가 아니라 "채점 전에 지웠나"로 바뀐다. 이것이 08 고유의 오독이다
  - 7-1 **bastion 에서 클러스터에 못 닿는다** — 주입: VPC Endpoint 의 보안 그룹에서 443 제거. 좁히는 순서는 SSM 접속 → DNS 해석 → Endpoint → 보안 그룹
  - 7-2 **이미지 pull 이 안 된다** — 주입: `ecr.dkr` Endpoint 삭제. private 클러스터는 NAT 가 없으면 Endpoint 가 유일한 경로임을 몸으로

### Task 6: 검증과 마무리

- [ ] **Step 1: 각 모듈 커밋 뒤 `npm run build`** — `starlight-links-validator` 경고 0건
- [ ] **Step 2: `변형 셀프 체크` 전멸 확인**

  Run: `grep -rn "변형 셀프 체크" src/content/docs/`
  Expected: PART-5·6 을 뺀 01~08 에서 0건

- [ ] **Step 3: `reference/links` 에 변동 짝 열 추가** — spec 9절. 모듈↔정답지 매핑에 "변동 타깃"을 넣는다
- [ ] **Step 4: spec 4절 표와 13절 갱신** — 06 타깃 변경과 03·08 짝 확정을 원본 설계에 반영한다

## 다음 단계 게이트

Task 6 까지 끝나면 멈춘다. spec 10절 6단계(PART-4 — 09·10·11·12·13)로 가기 전에 확인받는다. 그 파트는 2과제라 근거 세트가 set-02·07·08 로 바뀐다.

## 미해결

- 4단계에서 넘어온 것 — kubectl 출력 문구와 6·7절 end-to-end 는 여전히 미검증이다. 이 단계에서 늘어나는 주입 명령도 같은 상태다. **CLI 의 존재와 문법은 `help` 로 확인하되, 실행 결과 문구는 정답지·`mark.sh` 근거로만 쓴다.**
- 모듈 12 의 Lattice 짝은 6단계 소관이라 여기서 다루지 않는다.
