# 12. 파괴/복구 훈련 — Break & Fix (Day 13)

[../../reference/troubleshooting.md](../../reference/troubleshooting.md)의 12개 증상을 **고의로 재현하고 자력으로 복구**한다. 대회장에서 문서를 볼 수 없으니, 증상→확인 명령→원인→조치의 사슬을 손에 붙인다.

## 목표

- [ ] 12개 시나리오 중 8개 이상을 문서 없이 "확인 명령 → 원인 → 조치" 순서로 복구
- [ ] 각 증상의 1순위 확인 명령을 즉시 침 (추측 수리 금지)
- [ ] 실패한 항목을 troubleshooting.md에 자기 언어로 추가

## 소요 / 일차

- Day 13, 약 4~5시간 (시나리오당 목표 10~25분 x 12개)

## 과금 / destroy

- **set-02 스택 전체가 떠 있어야 한다** — EKS·NAT GW·ALB·CloudFront 시간당 과금. 하루 안에 12개를 몰아서 돌리고 당일 destroy.
- 종료 시: `kubectl delete` → `eksctl delete cluster` → `terraform destroy` (CloudFront disable 전파 대기 포함).
- 시나리오 ⑫(순환 체험)는 별도 디렉토리 사본에서 plan만으로도 가능 — 과금 없음.

## 선행 모듈

- 11-mutation-drill (mark 표 정리 완료 상태)
- set-02 1과제를 mark 통과 상태로 배포할 수 있을 것
- [../../reference/troubleshooting.md](../../reference/troubleshooting.md)를 최소 1회 정독

## 파일

- [theory.md](theory.md) — 복구 방법론(추측 금지·분리 진단) + 퀴즈
- [lab.md](lab.md) — 12개 시나리오: 망가뜨리는 법·목표 시간·복구 확인
