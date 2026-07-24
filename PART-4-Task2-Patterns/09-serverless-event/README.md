# 09. 서버리스 워크플로 + 이벤트 자동복구 (Day 10)

2과제 단골 유형 두 개를 하루에 잡는다: **유형 1 — 서버리스 워크플로**(S3 → Lambda → Step Functions → DynamoDB, set-02 task-2 module-1)와 **유형 2 — 이벤트 자동복구**(EventBridge/CloudTrail/Config → Lambda 복구, set-02 task-2 module-3).

## 학습 목표

- [ ] S3 이벤트 트리거 → Lambda → Step Functions(Standard) → DynamoDB 파이프라인을 백지에서 그릴 수 있다
- [ ] S3 트리거의 suffix 필터로 재귀 무한루프를 막는 이유를 설명할 수 있다
- [ ] ASL(Amazon States Language)에서 S3 "이동"을 Copy+Delete 2개 상태로 분리하는 이유를 안다
- [ ] Python `Decimal` 나눗셈으로 483/5=96.6을 정확히 만들고, float가 왜 오답인지 설명할 수 있다
- [ ] "채점 직전 리셋"(버킷/테이블 초기화 → test.csv 정확 1회 업로드) 절차를 순서대로 수행할 수 있다
- [ ] EC2 네이티브 State-change 이벤트와 CloudTrail→EventBridge 경로의 지연 차이를 설명할 수 있다
- [ ] 자동복구 Lambda의 무한루프 2중 차단(룰 `anything-but` + 람다 값 비교)을 구현할 수 있다
- [ ] AWS Config 룰의 스코프를 좁혀야 하는 이유(NON_COMPLIANT 오답 방지)를 안다
- [ ] task.md와 mark 스크립트가 불일치할 때 "합집합 구현" 원칙을 적용할 수 있다

## 소요 시간 / 일차

- Day 10, 약 6~8시간 (이론 2h + 유형 1 실습 2.5h + 유형 2 실습 3h)

## 과금 리소스와 destroy 방침

| 리소스 | 과금 | 방침 |
|---|---|---|
| Lambda / Step Functions / EventBridge / SNS | 프리티어 내 사실상 무료 | destroy로 정리 |
| DynamoDB (온디맨드) / S3 | 실습 규모에서 무시 가능 | destroy로 정리 |
| CloudTrail (trail 1개) | 무료 (관리 이벤트 1카피) | destroy로 정리 |
| **AWS Config 레코더** | **기록 항목당 과금** — 스코프를 EC2 Instance·SG로 좁혀도 켜져 있는 동안 과금 | **실습 종료 즉시 destroy** |
| EC2 t3.micro ×1 (유형 2) | 시간당 과금 (소액) | 실습 종료 즉시 destroy |
| NAT 없음 | — | 이 모듈들은 NAT를 만들지 않는다 |

당일 실습 종료 시 두 모듈 모두 `terraform destroy`. state가 로컬이므로 다음 날 apply만 다시 하면 된다.

## 선행 모듈

- PART-1 전체 (Terraform 문법, IAM, Lambda 배포 패턴)
- 03-container-lambda-dynamodb (Lambda + DynamoDB 기초)

## 참고 경로 (정답지)

- `skills-2026/set-02/task-2/module-1-workflow/` — 유형 1 정답 (terraform + ASL + Lambda 코드)
  - `terraform/statemachine/workflow.asl.json` — 상태 머신 정의
  - `terraform/lambda/index.py` — Decimal 평균·오류행 분기 정답
  - `README.md` — "최종 실행 절차(채점 직전, 순서 엄수)" 실측 런북
- `skills-2026/set-02/task-2/module-3-event/` — 유형 2 정답
  - `terraform/eventbridge.tf` — 룰 6개 (네이티브 + CloudTrail 패턴)
  - `terraform/lambda/<function>/index.py` — 복구 함수 6개
  - `terraform/config.tf` — Config 레코더 + 스코프 제한
  - `README.md` §"설계 근거 · 함정" — 레이스 컨디션·무한루프 실측 기록
- `skills-2026/set-02/task-2/README.md` — 모듈별 리전·공통 워크플로
