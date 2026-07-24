# 13. 모의 대회 — Mock Exam (Day 14)

타이머 4시간, 문서 없이 set-02 1과제(또는 가장 자신 없는 세트)를 처음부터 끝까지 — terraform → docker/ECR → eksctl → k8s/helm → 검증 시드 → mark.sh 셀프 채점.

## 목표

- [ ] 4시간 내 완주, mark.sh 자동 채점 90% 이상
- [ ] 착수 순서를 timings.md대로 몸이 기억함 (eksctl 20분 먼저 던지고 docker 병렬)
- [ ] 채점 직전 리셋 체크리스트를 빠짐없이 수행
- [ ] 아키텍처 백지 도식(화살표별 인증 방식 주석 포함) 재현
- [ ] 오답 노트 작성 + troubleshooting.md 반영

## 소요 / 일차

- Day 14, 4시간(본 시험) + 1~2시간(채점·회고·3과제 대비)

## 과금 / destroy

- 풀스택 4시간+ 기동 — 이 커리큘럼에서 과금이 가장 큰 날. EKS·NAT GW·ALB·CloudFront 동시 과금.
- 회고까지 끝나면 즉시 destroy: k8s 리소스(LBC ALB 포함) 삭제 → `eksctl delete cluster` → `terraform destroy` → CloudFront disable·삭제 확인 → 콘솔에서 잔존 리소스 육안 확인.

## 선행 모듈

- 11-mutation-drill, 12-break-fix 완료 (판정 통과 상태)
- [../../reference/timings.md](../../reference/timings.md) · [../../reference/mark-script-guide.md](../../reference/mark-script-guide.md) 암기 수준

## 파일

- [theory.md](theory.md) — 시험 운영 전략(시간 배분·막힘 규칙) + 퀴즈
- [lab.md](lab.md) — 진행 절차·판정 기준·오답 노트 양식·종료 후 과제
