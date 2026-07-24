# 모의 대회 실습 — 4시간 완주

## 규칙

- 타이머 **4시간**. set-02 1과제(또는 가장 자신 없는 세트)를 **문서 없이** 완주.
- 허용: AWS 공식 문서·CLI help. 금지: 이 가이드·저장소 README·본인 노트 (막힘 규칙 예외 제외).
- 막힘 규칙: **15분까지 자력** → 이후 저장소 README 참조 허용, 참조 즉시 오답 노트에 기록.
- 파이프라인: terraform → docker/ECR → eksctl → k8s/helm → 검증 시드 → mark.sh 셀프 채점.

## 진행 절차

착수 순서는 [../../reference/timings.md](../../reference/timings.md) — 긴 것 먼저.

- [ ] **T+0:00** 타이머 시작. mark 항목 표를 기억에서 복기(5분) — 무엇이 채점되는지부터
- [ ] **T+0:05** terraform apply 시작 (VPC·IAM·데이터·ECR)
- [ ] apply 완료 즉시 **eksctl create cluster 던지기** (~20분)
- [ ] eksctl 대기 중 CloudShell에서 **docker build/push 병렬** + ECR 스캔 결과 확인 (High/Critical이면 `apk upgrade --no-cache` 재빌드)
- [ ] 클러스터 완료 → kubeconfig → helm/k8s apply (번호 prefix 순서)
- [ ] ingress로 ALB 확보 → **2차 apply** (`-var enable_cdn=true`) → `aws cloudfront wait distribution-deployed`
- [ ] 전파 대기 중 검증 시드 준비 (POST 데이터·트래픽·Grafana 패널)
- [ ] **T+3:20 목표** 구현 완료. [../../reference/mark-script-guide.md](../../reference/mark-script-guide.md)의 **채점 직전 리셋 체크리스트** 수행
- [ ] mark.sh 실행 (지정 환경에서 — `rm -rf ~/.aws`류 있으면 반드시 CloudShell) → 항목별 O/X 기록
- [ ] **T+4:00** 하드 스톱. 미완이어도 채점

## 판정 기준

| 항목 | 기준 |
|---|---|
| 자동 채점 | mark.sh **90% 이상** 득점 |
| 백지 도식 | 종료 후 아무것도 안 보고 아키텍처 재현 — **화살표별 인증 방식 주석**(OAC/커스텀 헤더/IRSA 등) 포함 |
| 운영 | 착수 순서가 timings.md와 일치했는가, 리셋 체크리스트 누락 0건 |

90% 미만이면: 실패 항목이 몰린 컴포넌트의 PART 모듈 재실습 후 **다른 세트로 재시험**.

## 오답 노트 양식 (3열)

```
| 증상 | 원인 | 다음에 칠 명령 |
|---|---|---|
| TG unhealthy 지속 | probe path 오타 | kubectl describe pod → describe-target-health |
```

- README를 참조한 항목도 한 행으로 기록 (증상 = "기억 안 남: <무엇>").
- 작성 후 실패 항목을 [../../reference/troubleshooting.md](../../reference/troubleshooting.md)에 자기 언어로 추가.

## 종료 후 (남는 시간)

- [ ] 오답 노트 → troubleshooting.md 반영
- [ ] 선택 A — **3과제 대비**: 1시간 내 "빌드+트래픽" 미니 스택 (set-02 스택 축소판: VPC 최소 + 앱 1개 배포 + curl 트래픽 검증)
- [ ] 선택 B — 취약 모듈 재실습 (오답 노트에서 가장 빈번한 컴포넌트)
- [ ] **스택 전체 destroy** — k8s(LBC ALB 포함) → eksctl delete → terraform destroy → 콘솔 잔존 확인

## 회고 양식

```
## 모의 대회 회고 (날짜: )
- 총점: __% / 완주 시각: T+__:__
- 시간을 가장 태운 구간: (계획 vs 실제)
- README 참조 횟수: __회 (항목: )
- 리셋 체크리스트 누락: 
- 백지 도식: 성공/실패 — 못 그린 화살표:
- 대회 전 마지막으로 고칠 습관 1가지:
```
