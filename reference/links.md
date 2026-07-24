# 모듈 ↔ skills-2026 경로 매핑

로컬 클론 기준 상대 경로 (`skills-2026/` 루트).

| 모듈 | 참고 경로 | 내용 |
|---|---|---|
| 01 | `set-02/task-1/terraform/vpc.tf` | VPC 정답지 (RTB↔서브넷 매핑) |
| 02 | `set-02/task-1/terraform/{kms,s3,cloudfront}.tf` | KMS 3키, OAC, 버킷정책 |
| 02 | `set-03/task-1/terraform/kms.tf` | root-less 키 정책 (하드 모드) |
| 03 | `set-02/task-1/{app/Dockerfile,terraform/lambda,terraform/dynamodb.tf}` | alpine+tzdata, GSI, ALB 응답 포맷 |
| 04 | `set-02/task-1/eksctl/cluster.yaml` | IRSA, disableDefaultAddons, instanceName |
| 04 | `set-03/task-1/eksctl/cluster.yaml` | fully-private, Access Entry, Pod Identity |
| 05 | `set-02/task-1/k8s/app/` | deployment/probe/PDB/TargetGroupBinding |
| 05 | `set-02/task-1/terraform/alb.tf` | 리스너 규칙 2개 + 403 기본 |
| 06 | `set-02/task-1/README.md`, `mark.md` | 완주 런북·채점 기준 |
| 06 | `set-02/task-1/terraform/cloudfront/book-rewrite.js` | CF Function rewrite |
| 07 | `set-02/task-1/k8s/monitoring/`, `set-03/task-1/k8s/logging/` | Grafana provisioning, Fluent Bit log_to_metrics |
| 07 | docs `setlist/set-03/task-1/{notes,runbook}.md` | 함정 원문 |
| 08 | `set-03/task-1/terraform/kms.tf`, `set-07/task-1/terraform/iam.tf` | root-less KMS, audit role(9-1/9-2) |
| 08 | `set-07/task-1/README.md` | 머신 3분할, S3 릴레이, VPC Origin |
| 09 | `set-02/task-2/module-1-*`, `module-3-*` | Step Functions, EventBridge/Config |
| 10 | `set-07/task-2/module-3-*`, `module-4-*` | KEDA/Karpenter, OTel/Loki |
| 10 | `set-02/task-2/module-2-*`, `module-4-*` | Flink Studio, MSK (개념 위주) |
| 11–13 | 각 과제 `mark/`, `mark.md`, `mark.sh` | 변동 드릴·모의 대회 채점 |
| 13 | `set-07/task-2/` docs `setlist/set-07/task-2/*` | 모의 대회 대체 세트 |

문서 사이트(Astro Starlight): `skills-2026/docs/` — set-03·set-06·set-07 task-2에 notes/runbook 상세.
