# 07. 관측성 — Fluent Bit + kube-prometheus-stack + Grafana

> 문서 유형: 개요

## 학습 목표

- [ ] 관측성 파이프라인 전체(앱 로그 → Fluent Bit → CloudWatch + 로그→메트릭 → Prometheus → Grafana/알람)를 백지에 그릴 수 있다
- [ ] Fluent Bit DaemonSet의 구성요소(hostPath, cri 파서, tolerations, cloudwatch_logs 출력)를 설명할 수 있다
- [ ] `log_to_metrics` 필터로 액세스 로그에서 requests/errors counter + duration histogram을 만들고 `:2021/metrics` → PodMonitor로 스크레이프시킬 수 있다 (set-03 패턴)
- [ ] Lua로 Go duration 문자열(µs/ms/s/1m30s)을 초 단위 float로 변환하는 이유와 방법을 안다
- [ ] Grafana datasource/dashboard provisioning(configmap + `grafana_dashboard=1` 라벨 → sidecar import)을 할 수 있다
- [ ] PrometheusRule 알람 6종을 작성하고, 발화 가능/불가 항목을 구분할 수 있다
- [ ] 채점 전 "No Data 패널 = 오답" 원칙에 따라 트래픽을 시드할 수 있다

## 소요 시간 / 일차

- **Day 8** (1일)
- 이론 3h + 실습 4h (PART-2 클러스터 위에서 실습)

## 과금 리소스 & destroy 방침

| 리소스 | 요금(서울) | 비고 |
|---|---|---|
| EKS Control Plane + 노드 | 약 $0.31/h | PART-2에서 유지 중인 클러스터 재사용 |
| Grafana LoadBalancer(NLB) | 약 $0.028/h | kps values의 `service.type: LoadBalancer`가 생성 |
| CloudWatch Logs | 수집량 과금 (실습 수준 무시 가능) | 로그 그룹은 남으면 삭제 |

> 08(Day 9)도 같은 클러스터를 쓰므로 이틀 연속이면 유지, 하루 이상 쉬면
> `helm uninstall` + `eksctl delete cluster` 후 재생성. 클러스터 방치 ≈ **$7.4/일**.

## 선행 지식

- ConfigMap으로 설정을 주입하는 두 방법(환경변수 / 볼륨 마운트) — Fluent Bit·Grafana 설정이 전부 이 방식 — [k8s-basics](../../00-prerequisites/k8s-basics.md)
- Helm `install`/`upgrade --install`과 values 오버라이드 — [k8s-basics](../../00-prerequisites/k8s-basics.md)
- 라벨 셀렉터 — sidecar가 `grafana_dashboard=1` 라벨로 대시보드를 찾는다 — [k8s-basics](../../00-prerequisites/k8s-basics.md)
- 파이프·`grep`·`jq`로 로그에서 필요한 줄만 뽑는 원라이너 — [shell-basics](../../00-prerequisites/shell-basics.md)

막히면 위 링크, 아니면 바로 다음 파일로.

## 선행 모듈

- PART-2 전체 (04 eksctl 클러스터, 05 워크로드/ALB — 앱이 떠 있어야 액세스 로그가 나온다)

## 참고 경로

- `C:\Users\kryuk\practice\skills-2026\set-03\task-1\k8s\logging\fluent-bit.yaml` (log_to_metrics + Lua 완본)
- `C:\Users\kryuk\practice\skills-2026\set-03\task-1\k8s\monitoring\` (kps values, PrometheusRule 6종, dashboard.json)
- `C:\Users\kryuk\practice\skills-2026\set-07\task-1\k8s\logging\fluent-bit.yaml` (5키 JSON 재구성 패턴)
- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\k8s\monitoring\` (IRSA 세트의 변형)
- `C:\Users\kryuk\practice\skills-2026\docs\src\content\docs\setlist\set-03\task-1\notes.md` (함정 실측 기록)
