# skills-guide — 전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드

> 문서 유형: 개요

> AWS 기초만 아는 상태에서 14일 만에 **수상 과제 스택을 런북(자기 문서) 기반으로
> 신속·정확하게 배포**하고, **문서에 없는 상황(오류·신규 요구)을 AI 없이 해결**하는 것이 목표.
> 대회장에서는 AI를 쓸 수 없다 — 문서가 커버하는 부분은 문서로 빠르게, 문서 밖은 개념으로 메운다.
>
> 콘텐츠 원천: [skills-2026](https://github.com/ishs-cloud-computing/skills-2026) 수상 과제 실측 분석
> — set-02 1·2과제 🥇, set-07 1·2과제 🥈, set-03 1과제 🥉.
> 구조 모범: [eks-study](https://github.com/ishs-cloud-computing/eks-study).

## 최종 목표

1. 1과제 공통 스택(CloudFront→ALB→EKS/Lambda→DynamoDB + KMS + 관측성)을
   **자기 런북 기반으로 4시간 내 배포 + mark.sh 자동 채점 90%+** — 문서를 빠르고
   정확하게 실행하는 능력.
2. **문서에 없는 상황을 AI 없이 해결** — 배포 중 오류, 문서에 없는 신규 요구가 나와도
   개념 이해로 원인을 짚고, 필요한 리소스를 **콘솔·manifest·tf 혼합**으로 직접 만든다.
3. 과제지 30% 변동을 **30분 내 반영** (grep/sed 드릴).
4. 대표 장애 12종을 **AI 없이** 확인 명령→원인→조치 순서로 해결.

## 학습 로드맵 (14일)

| PART                                | 모듈    | 일차     | 주제                                               | 종료 조건              |
| ----------------------------------- | ----- | ------ | ------------------------------------------------ | ------------------ |
| [0](00-prerequisites/)              | 00    | D0     | 계정·도구·비용 가드레일·자가진단                               | 자가진단 통과            |
| [1](PART-1-Foundation-IaC/)         | 01–03 | D1~3   | Terraform·VPC·KMS·S3/CF·컨테이너·Lambda·DynamoDB     | 미니 스택 배포           |
| [2](PART-2-EKS-Core/)               | 04–06 | D4~7   | eksctl·k8s·LBC·CloudFront 심화 → **set-02 1과제 완주** | mark.sh 80%+       |
| [3](PART-3-Observability-HardMode/) | 07–08 | D8~9   | 관측성·fully-private EKS·IAM 심화                     | No Data 0개 + 부분 재현 |
| [4](PART-4-Task2-Patterns/)         | 09–10 | D10~11 | 2과제 5유형 패턴                                       | 유형별 1회 배포          |
| [5](PART-5-Battle-Drills/)          | 11–13 | D12~14 | 변동 드릴·파괴/복구·모의 대회                                | 모의 대회 90%+         |

하루 8~10h 기준: 이론 2h + 실습 6~7h + 회고·정리 1h(고정).

## 모듈 사용법 (매 모듈 동일 순서)

1. `README.md` — 목표·소요 시간·비용 확인
2. `theory.md` — 개념 + "왜 이 구성인가" (끝의 자기 점검 퀴즈로 확인)
3. `lab.md` — 단계별 실습 + 검증 명령 + 함정 + **정리(destroy)**
4. 오답 노트 작성: `증상 / 원인 / 다음에 칠 명령` 3열

## 대원칙 (수상 과제에서 추출)

1. **채점 스크립트 우선주의** — 구현 전 mark.sh부터. 이름·필드 순서·개수·오타까지 일치.
2. **불필요 리소스 = 감점** — 요구 안 된 bastion/태그/latest 태그/폴더 마커 금지.
3. **긴 작업 먼저 던지기** — EKS 20분, MSK 30분, CloudFront 전파. [reference/timings.md](reference/timings.md)
4. **채점 직전 리셋 절차** — 데이터 정리 → 요구 상태 복원 → 트래픽 시드 → No Data 0개.
5. **매일 destroy** — 삭제방지 해제 → 역순 삭제. 비용·이름 충돌 방지.
6. **콘솔 병행 학습** — lab은 IaC(tf/manifest)로 만들되, 만든 리소스를 **콘솔에서 찾아
   설정을 눈으로 확인**하고, 핵심 리소스는 최소 1회 콘솔로도 만들어본다. 대회장에서
   문서에 없는 요구는 결국 콘솔 + AWS 공식 문서로 해결하게 된다.

## 비용 가드레일

- 시간당 과금 리소스(NAT GW, EKS, MSK, ALB)는 **당일 destroy** 필수.
- AWS Budgets 알람 $50 설정(00 모듈에서 수행). 2주 총 예산 목표 < $100.
- EKS 유지가 필요한 날(D4→D5)만 예외 — README에 명시된 날만.

## reference/

- [ai-study-guide.md](reference/ai-study-guide.md) — 학습 중 AI(Claude·Gemini)에게 묻는 법 (질문 공식·패턴 5종·의존 방지)
- [cheatsheet.md](reference/cheatsheet.md) — kubectl·eksctl·helm·aws·terraform 명령 치트시트
- [cleanup-check.md](reference/cleanup-check.md) — destroy 후 잔존 리소스 점검 (매일 종료 루틴)
- [troubleshooting.md](reference/troubleshooting.md) — 증상→원인→확인 명령 플레이북
- [mark-script-guide.md](reference/mark-script-guide.md) — mark 스크립트 읽는 법·판단 원칙
- [timings.md](reference/timings.md) — 리소스별 소요 시간 (긴 것부터 던지는 순서)
- [links.md](reference/links.md) — 모듈 ↔ skills-2026 과제 경로 매핑
- [STYLE.md](STYLE.md) — 문서 스타일 가이드 (Diátaxis 유형·문장 규칙·용어 표준화)

## 진행 체크

- [ ] D0 자가진단
- [ ] PART 1 미니 스택
- [ ] PART 2 set-02 완주 (mark.sh __%)
- [ ] PART 3 관측성·프라이빗 EKS
- [ ] PART 4 2과제 유형 4종
- [ ] PART 5 모의 대회 (mark.sh __%)
