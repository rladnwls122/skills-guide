# 03. 컨테이너(ECR) + Lambda + DynamoDB (Day 3)

## 학습 목표

- [ ] Dockerfile 베이스 선택(scratch/alpine/distroless)이 ECR 스캔·TLS·타임존에 미치는 영향을 설명할 수 있다
- [ ] tzdata + `TZ=Asia/Seoul` 미설정 시 Go 바이너리 `created_at` 이 UTC 로 저장돼 채점에 실패하는 이유를 안다
- [ ] scanOnPush + KMS 암호화 ECR 리포지토리를 만들고, 요구된 태그만 push 할 수 있다 (latest 추가 = 감점)
- [ ] PK + GSI(HASH+RANGE) + PITR + 삭제방지 DynamoDB 테이블을 설계하고, boto3 Decimal 함정을 피할 수 있다
- [ ] ALB 통합 Lambda(boto3 Query, ScanIndexForward=False, 환경변수 주입, 응답 포맷)를 작성할 수 있다

## 소요 시간 / 일차

- Day 3, 약 6시간 (이론 2h + 실습 3h + 정답 diff 1h)

## 과금 리소스와 destroy 방침

| 리소스 | 과금 | 방침 |
|---|---|---|
| ECR | 저장 GB당 소액 | destroy (`force_delete = true` 로 이미지 포함 삭제) |
| DynamoDB (PAY_PER_REQUEST) | 요청당 과금, 실습 수준 무시 가능. **PITR 은 저장량 과금** | destroy 전 **삭제방지 해제** 필요 |
| Lambda | 호출당, 무시 가능 | destroy |
| KMS CMK 1개 | 월 $1 일할 | destroy → 7일 대기 |
| CloudWatch Logs | 저장 소액 | destroy 로 함께 삭제 |

시간당 폭탄 리소스는 없지만, **DynamoDB 는 `deletion_protection_enabled = true` 상태에서 destroy 가 실패한다** — 정리 절차(lab.md §정리)를 반드시 따른다.

## 선행 모듈

- `01-terraform-vpc` (Terraform 기본), `02-kms-s3-cloudfront` (CMK·alias 패턴)

## 참고 경로 (정답지)

- `skills-2026/set-02/task-1/app/Dockerfile` — alpine 고정 + tzdata + 비루트 유저
- `skills-2026/set-02/task-1/terraform/ecr.tf` — scanOnPush + KMS(관리형 aws/ecr)
- `skills-2026/set-02/task-1/terraform/dynamodb.tf` — PK/GSI/PITR/삭제방지
- `skills-2026/set-02/task-1/terraform/lambda.tf` — 최소권한 실행역할 + 환경변수 주입
- `skills-2026/set-02/task-1/terraform/lambda/index.py` — ALB 통합 핸들러 정답
- `skills-2026/set-02/task-1/README.md` §2 — CloudShell 빌드/push/스캔 확인 실측 명령
- `skills-2026/set-02/task-2/module-1-workflow/terraform/lambda/index.py` — Decimal 평균 계산 실측
