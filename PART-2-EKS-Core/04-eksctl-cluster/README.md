# 04. eksctl 클러스터 — ClusterConfig 완전 정복

> 문서 유형: 개요

## 학습 목표

- [ ] eksctl ClusterConfig의 5대 블록(metadata / vpc / iam / managedNodeGroups / addons)을 백지에 쓸 수 있다
- [ ] IRSA(OIDC) vs Pod Identity vs Access Entry 3방식의 차이와 **세트별 채점 갈림**을 설명할 수 있다
- [ ] 노드그룹 2분할(addon/app)의 이유(mark 5-4)와 label/taint 설계를 설명할 수 있다
- [ ] `${VAR}` 플레이스홀더를 terraform output으로 치환해 클러스터를 생성할 수 있다
- [ ] `tags.Name` vs `instanceName` 함정, `disableDefaultAddons` 함정을 안다

## 소요 시간 / 일차

- **Day 4** (1일)
- 이론 2h + 실습 4h (클러스터 생성 자체가 ~20분 소요, 대기 중 theory 복습)

## 과금 리소스 & destroy 방침

| 리소스 | 요금(서울) | 비고 |
|---|---|---|
| EKS Control Plane | **$0.10/h** | 클러스터 존재하는 동안 계속 과금 |
| t3.medium x 4 (노드) | 약 $0.21/h | addon 2 + app 2 |
| NAT Gateway x 2 | 약 $0.118/h (개당) | PART-1 VPC에서 이미 생성 |

> **예외: 04 → 05는 클러스터를 삭제하지 않고 유지한다.**
> 05(워크로드/ALB)는 이 클러스터 위에서 실습하므로 이틀 연속 학습 시 유지가 더 싸고 빠르다.
> 하루 이상 쉬면 `eksctl delete cluster -f cluster.rendered.yaml` 후 다음날 재생성(20분)한다.
> 클러스터 하루 방치 비용 ≈ $0.10×24 + $0.21×24 ≈ **$7.4/일** — 잊지 말 것.

## 선행 모듈

- PART-1 (Terraform 기초: VPC/서브넷/SG/KMS/IAM 정책이 이미 apply 되어 있어야 한다)

## 참고 경로

- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\eksctl\cluster.yaml` (IRSA 방식)
- `C:\Users\kryuk\practice\skills-2026\set-03\task-1\eksctl\cluster.yaml` (Pod Identity + fully private)
- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\README.md` (배포 순서 3 — 치환 스크립트)
