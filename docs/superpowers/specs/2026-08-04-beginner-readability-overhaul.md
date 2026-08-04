# 초심자 가독성 전면 개편 — 진단과 6차 계획

날짜: 2026-08-04
상태: 확정 (그릴링 세션에서 합의)

## 왜

사용자 체감: "기술 설명은 자세한데 대회 훈련을 시작한 사람이 읽기에 너무 어렵다."
실례 3건(키 정책 Principal 역할, `"Resource": "*"` 가 키 자신을 뜻하는 이유, SSE-KMS 정의)에서 출발해
감사 5개(용어 정의·전제지식 대조·구조/항행·lab 실행 가능성·문장 난도)를 돌려 원인을 확정했다.

## 진단 요약 (감사 5개 종합, 심각도 순)

1. **항행·순서 붕괴** — `sidebar` frontmatter 가 74편 중 0편이라 알파벳순 정렬. 모듈마다
   `index → lab → theory` 로 뜨고 "다음" 버튼도 lab 을 먼저 가리킨다(17개 모듈 전부).
   start 의 첫 "다음"은 최난도 autoscaling-basics. 선수 학습 체인은 3갈래로 끊겨 있고
   hcl-basics 는 어떤 문서도 "다음"으로 가리키지 않는 고아. eks-basics 는 이미 읽은
   awscli 로 순환. 자가진단 표 1~6번은 내부 문서 대신 외부 워크숍만 안내.
2. **lab 착수 불가** — 정답지 저장소 `skills-2026` 를 받는 방법이 사이트 전체 0건.
   저자 로컬 경로(`C:\Users\kryuk\...`) 하드코딩 17건. `.env.ps1` 변수 체인 단절
   (01 lab 은 2개 저장, 04 lab 은 9개 전제). `$ACCOUNT_ID`·`$env:NUM`·`$env:ECR` 미정의 사용.
   `terraform apply` 실패 대처가 어느 lab 에도 없고 part-1·2 는 troubleshooting/cleanup 링크 0건.
   05 lab 이 이미지 빌드를 06 lab 이라고 오지시(실제는 03). `rm -rf ~/.aws` 를 경고 없이 지시.
3. **용어 정의 구멍** — ARN·CIDR 접두사(`/16`)·AZ 는 사이트 어디에도 정의가 없다(첫 문서부터 사용).
   Principal 은 일반 정의 없이 신뢰 정책 맥락으로만 등장. SSE-KMS 정의는 s3-basics 에 있는데
   읽기 순서가 kms → s3 라 사용이 정의보다 앞선다. kms-basics 는 주제인 root-less 키 정책의
   실물 JSON 이 없고 키 정책 `"Resource": "*"`(= 이 키 자신)를 언급하지 않는다.
   DynamoDB(PK·GSI)·Prometheus/Grafana 는 start 문서 자체가 없어 part-1/03·part-2/06 이 공중에 뜬다.
4. **되돌아갈 길 부재** — 선행 지식 안내는 모듈 index 에만 있고 theory 17·lab 17편의 역링크 0건.
   theory 본문의 `/start/` 링크는 7편 중 1개.
5. **문장 난도** — 한 문장에 새 정보 3개+, 괄호 속 핵심 정의(QoS·CRD), 4중 부정
   (part-1/02 theory 185행), 표 셀에 문단급 정보. 밀집 3편: part-2/05 · part-1/02 · part-2/07.
6. **밀도·경계** — theory 400줄+ 6편(최장 part-1/02 665줄), Day 12 하루 1,692줄,
   start 13편 합계 4,272줄인데 Day 0 공지는 "반나절". 봉투 암호화·root-less·HCL 문법이
   start 와 theory 에 중복. 기초 문서가 대회 심화를 흡수(loadbalancer-basics 546줄).

세부 근거(file:line 목록)는 그릴링 세션의 감사 에이전트 5개 결과에 있다. 필요하면 재감사가 싸다.

## 편집 원칙 (사용자 확정)

- **개념이 어려우면 길어지는 것을 감수하고 쉽게 쓴다.** 압축이 난이도의 원인이다. 단
  끊어쓰기는 수단이지 목표가 아니다 — 기계적으로 토막 내면 오히려 가독성이 죽는다.
  정보 3개+ 문장·괄호 속 핵심 정의·다중 부정처럼 **읽기를 실제로 막는 곳만** 푼다. 적당히.
- 대회는 인터넷(공식 문서 열람)이 허용된다(사용자 확인). 문서는 "실전에서 어디를 열어 값을
  찾는가"를 훈련시키는 방향으로 링크를 단다. competition-rules 에 이 사실을 명시한다.

## 계획 — 6차, 차수마다 커밋 분리

| 차수 | 내용 | 상태 |
|---|---|---|
| 1 | 구조: 전 문서 `sidebar.order`(모듈 내 index→theory→lab, start 읽기 순서 강제), 선수 학습 체인 단일화, 자가진단 표 내부 링크, 고아·순환 해소 | 착수 |
| 2 | lab 착수 차단 해소: clone 안내, 경로 치환 규칙, `.env.ps1` 체인 복구, 미정의 변수, 오지시 수정, apply 실패 대처, 위험 명령 경고 | 대기 |
| 3 | 용어 구멍: start 에 ARN·CIDR·AZ·Principal·SSE-KMS·키 정책 `Resource:"*"` 정의 보강, root-less 키 정책 실물 JSON, DynamoDB·관측성 기초 신설, 규칙 명문화(정의 없이 용어 사용 금지 등) | 대기 |
| 4 | 링크·실전 참조: theory 해설에 Terraform Registry 리소스 링크, lab 17편 상단 "실전 참조" 박스, **실전 문서 검색 가이드 신설(승패 결정 문서 — 전담 작업)**, theory/lab 상단 선행 지식 축약 블록, competition-rules 인터넷 허용 명시 | 검색 가이드 착수 |
| 5 | 문장 리라이트: 밀집 3편(part-2/05·part-1/02·part-2/07) 우선 + **start 기초 문서군 전반 보강**(사용자 지시 — 3편에 한정하지 않는다). 끊어쓰기는 막힌 곳만, 과용 금지 | 대기 |
| 6 | 분할·중복 정리: 665줄 theory 분할, start/theory 중복 절 한쪽으로 몰기 | 대기 |

## 확정 결정

- theory 코드 해설: **리소스 타입 단위** Registry 링크(인자 앵커 아님 — 링크 부패 회피).
- lab: 상단 "실전 참조" 박스 + 검색 가이드 링크. 인라인 링크는 막히는 지점에만 선별.
- 검색 가이드 범위: HCL 인자→Registry, CLI→`help`+AWS 문서, **YAML→`kubectl explain`·
  `helm show values`·eksctl 스키마**, helm values→ArtifactHub. 값 종류별 "대회 화면에서
  여는 순서" 동선 포함. YAML 값 찾기 훈련은 사용자 명시 요구.
- 선수 학습 순서: s3-basics 를 kms-basics **앞**으로(SSE-KMS 정의 순서 교정).
- hcl-basics 는 awscli 다음, PART-1 직전에 배치(part-1/01 이 전제하는 마지막 기초).
