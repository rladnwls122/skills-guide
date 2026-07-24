# 06. set-02 1과제 완주 — 배포 10단계 런북 훈련

## 학습 목표

- [ ] set-02 1과제 배포 10단계를 순서·이유와 함께 암기 (terraform → 이미지 → eksctl → LBC → 앱 → 모니터링 → 로깅 → 검증 → 채점 → 정리)
- [ ] CloudFront 이중 Origin(ALB 커스텀 헤더 / S3 OAC) + CloudFront Function 경로 재작성 구조를 백지에 그릴 수 있다
- [ ] 아키텍처 백지 도식(화살표마다 인증 방식 주석)을 5분 내 그릴 수 있다
- [ ] CloudShell VPC Environment에서 mark.sh를 실행해 **80% 이상** 득점

## 소요 시간 / 일차

- **Day 6~7** (2일): Day 6 = 1~7단계(배포 완료), Day 7 = 8~10단계(검증·채점·정리) + 백지 도식 반복
- 총 실습 8~10h (eksctl 20분 + CloudFront Deployed 대기 수 분 포함)

## 과금 리소스 & destroy 방침

| 리소스 | 요금(서울) |
|---|---|
| EKS Control Plane | $0.10/h |
| t3.medium x 4 | ~$0.21/h |
| NAT x 2, ALB x 2 | ~$0.28/h |
| CloudFront / Lambda / DynamoDB / S3 | 사용량 기반 (실습 수준 ~무료) |

> **Day 6 → Day 7은 전체 유지** (완주 흐름 유지가 목적).
> **Day 7 종료 시 반드시 10단계 정리 절차로 전부 삭제** — helm → eksctl → DynamoDB 삭제방지 해제 → terraform destroy 순서를 지켜야 destroy가 안 막힌다.

## 선행 모듈

- 04-eksctl-cluster, 05-k8s-workloads-alb (개념은 전부 선행 — 06은 통합 리허설)

## 참고 경로

- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\README.md` (원본 런북 — 이 모듈의 정답지)
- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\mark.md` / `mark.sh` (채점 기준)
- `C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\cloudfront.tf`, `terraform\cloudfront\book-rewrite.js`
