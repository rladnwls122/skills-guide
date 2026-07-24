# 05. k8s 워크로드 + ALB 연동 — Deployment / Helm / TargetGroupBinding

> 문서 유형: 개요

## 학습 목표

- [ ] probe 3종·nodeSelector·topologySpread·PDB·graceful shutdown이 들어간 Deployment를 백지에 쓸 수 있다
- [ ] Helm의 repo/chart/release/values 개념과 `helm upgrade --install` 패턴을 안다
- [ ] AWS Load Balancer Controller를 helm으로 addon 노드에 고정 설치할 수 있다
- [ ] **Terraform ALB/TG 고정 생성 → TargetGroupBinding으로 Pod IP 등록** 패턴을 설명할 수 있다 (수상 과제 공통 패턴)
- [ ] ALB 리스너 규칙(헤더+메서드 조건, 기본 403, 규칙 정확히 2개)과 Lambda 타깃 구성을 안다

## 소요 시간 / 일차

- **Day 5** (1일) — 04에서 유지한 클러스터 위에서 진행
- 이론 2.5h + 실습 3.5h

## 과금 리소스 & destroy 방침

| 리소스 | 요금(서울) | 비고 |
|---|---|---|
| EKS + 노드 (04에서 유지) | ~$0.31/h | |
| ALB x 2 (book/grafana) | 약 $0.0225/h + LCU | PART-1 terraform이 생성 |
| NAT x 2 | 약 $0.236/h | |

> 04에서 유지한 클러스터를 그대로 쓴다. **05 종료 시**: 06을 다음날 이어가면 유지,
> 아니면 `eksctl delete cluster` + `terraform destroy` (DynamoDB 삭제방지 해제 선행 — 06 참고).

## 선행 모듈

- 04-eksctl-cluster (클러스터가 떠 있어야 함)
- PART-1 Terraform (ALB/TG/Lambda가 apply 되어 있어야 함)

## 참고 경로

- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\k8s\app\` (deployment/service/pdb/configmap/targetgroupbinding)
- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\alb.tf` (리스너 규칙 2개 + Lambda TG)
- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\README.md` (배포 순서 4~5)
