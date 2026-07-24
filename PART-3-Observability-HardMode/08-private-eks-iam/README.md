# 08. Fully-Private EKS + IAM 심화

## 학습 목표

- [ ] fully-private EKS의 생성 메커니즘(생성 중 퍼블릭 엔드포인트 임시 on → 완료 시 off)과 중단 시 잔존 위험을 설명할 수 있다
- [ ] 이미지 pull 경로 2가지(NAT vs VPC Endpoint s3/ecr.api/ecr.dkr)와 **eks/eks-auth Endpoint가 Pod Identity를 깨는 함정**을 안다
- [ ] 머신 3분할(본 PC / 일반 CloudShell / VPC CloudShell·SSM bastion)과 S3 `_transfer/` 릴레이 + 멱등 셋업을 운용할 수 있다
- [ ] "생성자 신원 = 채점 신원" 원칙을 설명하고 access entry로 예외 처리할 수 있다
- [ ] CoreDNS 커스텀 도메인(kubelet clusterDomain + Corefile 패치 양쪽)을 구성할 수 있다
- [ ] `:root` trust + `sts:ExternalId` audit role을 만들고 **assume 성공/실패를 양쪽 다 재현**할 수 있다 (이중 평가 원리)
- [ ] 리소스 레벨 ARN 미지원 액션의 `Resource "*"` 처리와 최소권한 분리를 판단할 수 있다
- [ ] CloudFront VPC Origin(internal ALB) + prefix list SG(403/000), KMS Multi-Region Key 구조를 안다

## 소요 시간 / 일차

- **Day 9** (1일)
- 이론 3h + 실습 4h (실습 A는 IAM만 — 과금 없음. 실습 B는 PART-2 클러스터 필요)

## 과금 리소스 & destroy 방침

| 리소스 | 요금 | 비고 |
|---|---|---|
| IAM 역할/사용자 (실습 A) | **무료** | 실습 후 삭제 (계정 위생) |
| EKS + 노드 (실습 B) | 약 $0.31/h | PART-2 클러스터 재사용, 실습 후 destroy |
| VPC Interface Endpoint | 개당 약 $0.013/h + AZ당 | 실습 B에서 만들면 반드시 삭제 |

> 실습 A(IAM audit role)는 클러스터 없이 즉시 가능하고 무료 — 먼저 한다.

## 선행 모듈

- PART-1 (Terraform/VPC/KMS — 특히 02의 root-less KMS 키 정책, 이 모듈에서 재확인)
- PART-2 (eksctl 클러스터 — 실습 B의 private 전환 드릴에 필요)
- 07 (관측성 — private 환경에서의 배포 순서를 이해하는 배경)

## 참고 경로

- `C:\Users\kryuk\practice\skills-2026\set-03\task-1\eksctl\cluster.yaml` (privateCluster + overrideBootstrapCommand)
- `C:\Users\kryuk\practice\skills-2026\set-03\task-1\terraform\endpoints.tf` (eks/eks-auth Endpoint 함정 주석)
- `C:\Users\kryuk\practice\skills-2026\set-03\task-1\terraform\kms.tf` (root-less 키 정책)
- `C:\Users\kryuk\practice\skills-2026\set-07\task-1\terraform\iam.tf` (audit role 완본)
- `C:\Users\kryuk\practice\skills-2026\set-07\task-1\README.md` (머신 3분할·bastion 런북)
- `C:\Users\kryuk\practice\skills-2026\docs\src\content\docs\setlist\set-03\task-1\notes.md` (실측 함정 기록)
