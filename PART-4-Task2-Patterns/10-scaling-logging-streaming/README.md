# 10. 오토스케일링 + 로깅 + 스트리밍 (Day 11)

2과제 유형 세 개를 다룬다: **유형 3 — 오토스케일링**(SQS→KEDA→Karpenter, set-07 task-2 module-3), **유형 4 — 로깅**(OTel→Loki→Grafana, set-07 task-2 module-4), **유형 5 — 스트리밍**(Kinesis/Flink Studio·MSK, set-02 task-2 module-2·4 — **개념+함정 암기만, 실습 생략**).

## 학습 목표

- [ ] SQS 큐 길이 → KEDA(Pod 1~5) → Karpenter(Node) 2단 스케일링 체인을 백지에서 그릴 수 있다
- [ ] scaleDown `stabilizationWindowSeconds: 30` + NodePool `consolidateAfter: 60s`가 "2.5분 내 수렴" 채점과 한 쌍인 이유를 설명할 수 있다
- [ ] Pod requests 500m×5가 t3.medium 1대(allocatable ~1.9 vCPU)를 넘어 노드 2대가 유발되는 계산을 할 수 있다
- [ ] Karpenter 디스커버리 태그(`karpenter.sh/discovery` 서브넷, `aws:eks:cluster-name` SG)의 역할을 안다
- [ ] OTel Collector filelog(container 파서) → Loki OTLP → Grafana 로그 파이프라인을 구성할 수 있다
- [ ] LogQL `{k8s_namespace_name="..."} | json | level="ERROR"` 쿼리와 라벨 승격 원리를 설명할 수 있다
- [ ] Flink Studio·MSK 모듈의 함정 목록(READY 상태, TIMESTAMP 파싱, String 저장 등)을 암기한다

## 소요 시간 / 일차

- Day 11, 약 7~9시간 (이론 2h + 유형 3 실습 2.5h + 유형 4 실습 3h + 유형 5 암기 1h)
- EKS 클러스터 생성 ~20분 ×2회가 포함되므로 두 실습을 병렬로 돌리면 단축된다 (리전이 달라 간섭 없음)

## 과금 리소스와 destroy 방침

| 리소스 | 과금 | 방침 |
|---|---|---|
| **EKS 클러스터 ×2** (skm-eks-cluster, o11y-cluster) | **시간당 컨트롤플레인 과금 (가장 큼)** | **실습 종료 즉시 `eksctl delete cluster`** |
| 노드 EC2 (t3.medium 등) | 시간당 과금 | 클러스터 삭제로 함께 정리 |
| NAT Gateway (모듈 VPC) | 시간당 + 처리량 | terraform destroy 즉시 |
| ALB ×2 (유형 4) | 시간당 과금 | terraform destroy |
| SQS / ECR / EBS PV | 소액 | destroy로 정리 |

**삭제 순서 주의**: k8s 리소스(TGB, Karpenter 노드) → helm → `eksctl delete cluster` → `terraform destroy`. Karpenter가 만든 노드가 남아 있으면 클러스터 삭제가 걸릴 수 있으니 NodePool을 먼저 지운다.

유형 5는 실습하지 않으므로 과금 없음 (MSK ~30분 생성·시간당 과금이 커서 개념 암기로 대체하는 것).

## 선행 모듈

- PART-2 EKS-Core 전체 (eksctl, IRSA, addon 노드그룹)
- PART-3 07-observability (Grafana/LogQL 기초)
- 09-serverless-event (2과제 채점 상태 감각)

## 참고 경로 (정답지)

- `skills-2026/set-07/task-2/module-3-eks-scaling/` — 유형 3 정답
  - `k8s/30-keda-scaledobject.yaml` — pollingInterval 10 / stabilization 30
  - `k8s/10-karpenter-nodepool.yaml` — taint·consolidation·디스커버리 태그
  - `k8s/20-deployment.yaml` — env 리터럴 3개·requests 500m
  - `README.md` / `README.linux.md` — CloudShell 실측 런북
- `skills-2026/set-07/task-2/module-4-container-logging/` — 유형 4 정답
  - `k8s/logging/21-otel-configmap.yaml` — filelog container 파서·otlphttp
  - `terraform/alb.tf` + `k8s/**/12-,30-*targetgroupbinding.yaml` — 이름 고정 ALB 패턴
  - `app/Dockerfile` — 제공 Dockerfile 결함 대응 자체 빌드
- `skills-2026/docs/src/content/docs/setlist/set-07/task-2/notes.md` — 실측 함정 모음
- `skills-2026/set-02/task-2/module-2-analytics/README.md` — 유형 5 Flink Studio 함정 원문
- `skills-2026/set-02/task-2/module-4-msk/README.md` — 유형 5 MSK 함정 원문
