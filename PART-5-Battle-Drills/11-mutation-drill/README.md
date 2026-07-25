# 11. 변동 드릴 — 30% 변동 대응 (Day 12)

> 문서 유형: 개요

대회 당일 공개 과제의 약 30%가 수정된다(이름·스펙·개수). 이 모듈은 "바뀐 과제지를 받고 30분 안에 코드베이스 전체에 반영"하는 근육을 만든다.

## 목표

- [ ] 임의 변경된 과제지(리소스 이름 변경)를 30분 내 전체 반영하고 mark 재통과
- [ ] 치환 누락 grep 0건 확인 절차를 손에 익힘
- [ ] "이름이 숨는 곳" 8종 목록을 외움 (tfvars, YAML 리터럴, JS 코드, dashboard JSON, mark.sh, eksctl, userdata, Lambda env)
- [ ] 변형 과제지를 받고 영향 파일을 종이에 먼저 짚어내는 아키텍처 이해 검증 통과
- [ ] mark 스크립트 3개를 검사 명령→기대값 표로 정리

## 소요 / 일차

- Day 12, 약 3~4시간 (훈련 ① 30분 x 2회 + 훈련 ② 1시간 + 훈련 ③ 1시간)

## 과금 / destroy

- 훈련 ①·②의 편집 자체는 무과금(로컬 편집). mark 재통과까지 확인하려면 set-02 스택 apply 필요 — NAT GW·EKS·ALB 시간당 과금 시작.
- 검증 후 즉시 `terraform destroy` + `eksctl delete cluster`. CloudFront는 disable→삭제 전파 대기.

## 선행 지식

- `grep -rn`으로 이름이 박힌 파일을 전부 찾고, `sed`로 일괄 치환하는 원라이너 — [shell-basics](../../00-prerequisites/shell-basics.md)
- 치환 후 잔존 확인: 같은 패턴을 다시 grep해 0건인지 본다 — [shell-basics](../../00-prerequisites/shell-basics.md)
- `aws ... --query`로 실제 생성된 리소스 이름을 뽑아 과제지와 대조 — [awscli-basics](../../00-prerequisites/awscli-basics.md)

막히면 위 링크, 아니면 바로 다음 파일로.

## 선행 모듈

- PART-2~4의 set-02 1과제 실습 완료 (원본 스택을 한 번 올려본 상태)
- [../../reference/mark-script-guide.md](../../reference/mark-script-guide.md) 숙지

## 파일

- [theory.md](theory.md) — 판단 원칙과 변동 대응 방법론 + 퀴즈
- [lab.md](lab.md) — 훈련 ①②③ 절차·판정 기준·회고 양식
