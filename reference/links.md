# 모듈 ↔ skills-2026 경로 매핑

> 문서 유형: reference

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
| 14 | `task-3/README.md`, `ARCHITECTURE.md` | 3과제 런북·설계 근거(튜닝 표·당일 변경 시나리오) |
| 14 | `task-3/k8s/{01-nodepool,10-user}.yaml` | NodePool 상한·consolidation, HPA behavior·CPU limit 부재 |
| 14 | `task-3/script/load.js` | k6 부하 스크립트 (임계값 = 채점표) |

문서 사이트(Astro Starlight): `skills-2026/docs/` — set-03·set-06·set-07 task-2에 notes/runbook 상세.

## 공식 문서 (대회장에서 AI 대신 여는 곳)

대회장은 AI 불가·공식 문서 허용. 문서에 없는 요구는 결국 여기서 찾는다 —
연습 때부터 검색이 아니라 **문서 구조로** 찾는 습관을 들일 것.
모듈별 심화 링크는 각 모듈 README의 "공식 문서" 절에 있다. 아래는 전 모듈 공통.

**IaC**

- Terraform AWS Provider (리소스 인자·반환 속성): https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- Terraform 언어 (블록·표현식·메타 인자): https://developer.hashicorp.com/terraform/language
- Terraform CLI 명령: https://developer.hashicorp.com/terraform/cli/commands
- eksctl (ClusterConfig 스키마): https://eksctl.io/usage/schema/

**Kubernetes**

- kubectl Quick Reference: https://kubernetes.io/docs/reference/kubectl/quick-reference/
- Kubernetes API 레퍼런스 (매니페스트 필드 정본): https://kubernetes.io/docs/reference/kubernetes-api/
- AWS Load Balancer Controller (annotation·TargetGroupBinding): https://kubernetes-sigs.github.io/aws-load-balancer-controller/
- Karpenter: https://karpenter.sh/docs/
- KEDA Scalers: https://keda.sh/docs/latest/scalers/
- Helm: https://helm.sh/docs/

**AWS**

- EKS User Guide: https://docs.aws.amazon.com/eks/latest/userguide/
- CloudFront Developer Guide: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/
- IAM 정책 평가 로직: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
- 서비스별 액션·리소스·조건 키: https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html
- AWS CLI 명령 레퍼런스: https://docs.aws.amazon.com/cli/latest/reference/

**관측성·부하**

- Fluent Bit: https://docs.fluentbit.io/manual
- PromQL: https://prometheus.io/docs/prometheus/latest/querying/basics/
- LogQL: https://grafana.com/docs/loki/latest/query/
- k6: https://grafana.com/docs/k6/latest/
