# 커리큘럼 방향 재정립 — 실제 과제 기준

날짜: 2026-07-26
상태: 검토 중

## 왜 이 문서를 쓰나

지금까지 사이트는 `skills-2026` 수상 과제 정답지를 근거로 만들어졌다. 그런데 정답지는 "어떻게
만들었나"만 알려주고 "무엇이 채점되나"는 알려주지 않는다. 과제지·채점지·채점 스크립트를 직접
확인해 보니 사이트의 방향과 실제 과제가 어긋나는 지점이 있다. 그중 하나는 0점 규칙에 걸린다.

## 조사 근거

레포 밖 두 경로를 전수 조사했다.

| 경로 | 내용 |
|---|---|
| `C:\Users\kryuk\Downloads\national-skills-v7` | **set-08 제출작**의 1·2과제 문제지·채점지 PDF, 채점 스크립트 5개, 지급파일, 다이어그램 + 출제기준·출제가이드 PDF |
| `C:\Users\kryuk\Downloads\I_331_클라우드컴퓨팅.pdf` | 직종설명서. 실체는 **WorldSkills International Technical Description**(`WSC2024_TD53_en`, 영문 28쪽) |
| `C:\Users\kryuk\practice\skills-2026` | 과제 구현 저장소. `.tf` 191개 약 14,000줄, set-02·03·05·07·08·09 + `task-3` |

채점 스크립트가 가장 확실한 근거다. 문제지가 애매하게 쓴 것도 스크립트는 정확한 값으로 검사한다.

### `national-skills-v7` 의 정체 — 처음에 잘못 읽었다

이 폴더를 "2026 실제 시험지"로 읽고 방향을 잡았는데 **틀렸다.** `1과제/asgmt1_check.sh` 와
`skills-2026/set-08/task-1/mark.sh` 가 **완전히 동일한 파일**이고(`diff` 무차이), `task.md` 첫 줄이
`# 2026년도 전국기능경기대회 과제출제 양식 (별첨3)` 이다. 즉 **set-08 이라는 한 편의 공모전
제출작**이지 확정된 경기 과제가 아니다.

### 수상 후보 — 실제로 출제될 수 있는 것만

| 과제 | 후보 세트 |
|---|---|
| 1과제 | **00002 · 00007 · 00003** |
| 2과제 | **00002 · 00007 · 00008** |
| 3과제 | 확인 불가 — 후보 목록을 받지 못했다 |

최종 경기과제는 각 과제 시작 직전에 이 후보군에서 선정된다. **set-05·set-09 는 후보가 아니므로
근거로 쓰지 않는다.** 000006 은 탈락했다.

`skills-2026/task-3` 는 **3과제 예상 풀이**다. 공식 과제지가 아니라 예측이고, 그 안의
`task-sample.md`·`mark-sample.md` 도 파일명 그대로 샘플이다. 3과제에 관한 아래 서술은 전부
이 예측에 기댄 것이므로 **확정으로 다루지 않는다.**

## 발견

### 1. 채점은 IaC 를 보지 않는다

1·2과제 문제지·채점지 어디에도 Terraform·CloudFormation·CDK 언급이 없다. 채점은 CloudShell 에서
AWS CLI 로 **배포된 리소스 상태만** 검사한다. 제출물은 비번호와 Custom Header 값뿐이다.

Terraform 은 출제기준 체크리스트의 `"AWS, Terraform, GitHub 및 직종설명서에 명시된 범위"` 라는
대회 전체 범위 문구에만 나온다. **그래서 직종설명서를 확인했는데, 근거가 없었다.**

직종설명서(`I_331_클라우드컴퓨팅.pdf`)의 실체는 한국 전국대회 전용 문서가 아니라 WorldSkills
International 의 영문 Technical Description(`WSC2024_TD53_en`, 28쪽)이다. 여기서:

- `Terraform` · `GitHub` · `Git` 이 **전체 0회**
- `AWS` 는 2회뿐이고 둘 다 플랫폼 지정 문장이 아니다 (AWS JAM 챌린지 규정, 자문 조직 크레딧)
- `EC2` · `S3` · `VPC` · `IAM` · `Lambda` · `EKS` 등 서비스명 **전부 0회**
- IaC 관련 서술은 도구 무관한 한 문장뿐 — *"Automate infrastructure creation and modification
  through the use of scripting or programming"* (WSOS 3절)
- 문서가 스스로 명시 — *"The Assessment Criteria, the allocation of marks, and the assessment
  methods, should not be set out within this Technical Description."*

즉 출제기준 문구의 Terraform·GitHub 은 **한국 출제기준이 자체적으로 얹은 것**이고 직종설명서
근거가 아니다.

**함의** — Terraform 은 채점 항목이 아니라 **30% 변동을 30분에 반영하는 수단**이다. 사이트가 이걸
"배워야 할 대상"처럼 제시하면 학습자가 우선순위를 잘못 잡는다. 정답지가 전부 Terraform 이므로
읽는 능력은 여전히 필요하다.

참고로 직종설명서가 규정하는 평가 축은 WSOS 8영역이다 — Work organization and management /
Communication and interpersonal skills / Problem solving, innovation, and creativity /
**Cybersecurity** / **Reliability, scalability, and elasticity** / **Performance and optimization** /
**Operational considerations** / **Sustainability**. 채점 유형에 `Processed messages`(처리량)와
`Operational efficiency`(인프라 스케일 업·다운)가 있는 것이 3과제 성격과 정확히 맞는다.

### 2. 1과제 후보 3개는 전부 EKS 다 — EKS 축 유지가 맞다

처음에는 `national-skills-v7`(= set-08)의 채점지에 있는 0점 규칙 —

> Fargate 아닌 **EC2·EKS 직접 구동** → 0점

— 을 근거로 "1과제는 ECS 이므로 ECS 경로를 신설해야 한다"고 판단했다. **틀렸다.** 그 규칙은
set-08 제출작 안에서만 유효하고, set-08 은 **2과제 후보**다. 그 1과제는 후보가 아니다.

1과제 후보 세 편의 컴퓨트는 이렇다.

| 세트 | 아키텍처 | 컴퓨트 |
|---|---|---|
| set-02 | 글로벌 티켓 예매 | EKS |
| set-03 | Book 예약 플랫폼 | EKS |
| set-07 | Unicorn Tickets — WAF→CloudFront→(S3 + internal ALB VPC Origin)→EKS | EKS |

**셋 다 EKS다.** 저장소에서 ECS 를 쓰는 것은 set-08·set-09 둘뿐인데 set-09 는 후보가 아니고
set-08 은 2과제로만 후보다.

출제기준상 1과제 컴퓨트 필수 항목이 `Container(ECS·EKS, EC2·Fargate)` 라 ECS 가 원리적으로
불가능한 것은 아니다. 하지만 **확정된 후보군 안에 ECS 1과제가 없으므로 ECS 경로 신설은
우선순위가 아니다.** 현재 사이트의 EKS 축(PART-2)이 1과제에 맞게 조준돼 있다.

다만 후보가 셋이므로 **set-02 만이 아니라 set-03·set-07 의 차이도 다뤄야 한다.** 세 편의 스택을
나란히 놓으면 이렇다(각 `task-1/task.md` 의 Software Stack 절).

| 구성 | set-02 | set-03 | set-07 | 사이트 |
|---|---|---|---|---|
| 컴퓨트 | EKS | EKS | EKS | PART-2 |
| Lambda | ○ | ○ | ○ | 모듈 03·09 |
| KMS | ○ | ○ (**root-less 강제**) | ○ | 모듈 02 |
| **WAF** | ✗ | **○** | **○** | **언급만** |
| EC2 | ✗ | ○ | ○ | — |
| **관측성**(Prometheus·Grafana·Fluent Bit) | ✗ | ✗ | **○ — 1과제 안에 포함** | PART-3 모듈 07(D8) |

두 가지가 걸린다.

**WAF 가 후보 셋 중 둘에 있는데 사이트는 언급만 한다.** set-03 과 set-07 이 선정되면 WAF 구성이
채점 대상이 된다. 최소한 관리형 룰 적용과 CloudFront 연결은 다뤄야 한다.

**set-07 은 관측성을 1과제 안에서 요구한다.** 사이트는 관측성을 PART-3 모듈 07(D8)에 별도로 두는데,
set-07 이 나오면 그것을 **1과제 4시간 안에** 끝내야 한다. 커리큘럼 순서상 D4~D7 에 1과제를 완주하고
D8 에 관측성을 배우므로, set-07 시나리오에서는 순서가 맞지 않는다. 모듈 07 의 일부(Fluent Bit·
kube-prometheus-stack 설치)를 1과제 완주 모듈에서 최소한 언급하고 링크해야 한다.

set-03 의 root-less KMS 와 CoreDNS 커스텀 도메인은 이미 모듈 02·08 이 다룬다.

### 3. 2과제 후보 12개 모듈 중 3개가 비어 있다

2과제는 후보 세 세트가 각각 모듈 4개를 낸다. 최종 선정된 세트의 4개 모듈이 출제되고,
**모듈마다 리전이 다르다**(틀리면 0점).

| 세트 | 모듈 1 | 모듈 2 | 모듈 3 | 모듈 4 |
|---|---|---|---|---|
| set-02 | Workflow (Step Functions) | Real-time analytics (Flink) | Cloud Event Handling | MSK |
| set-07 | NoSQL (싱가포르) | **CDN Function** (버지니아) | EKS Scaling (서울) | Container Logging (도쿄) |
| set-08 | **DocumentDB** | **VPC Lattice** | Cloud Event Handling | SQS + KEDA |

set-08 의 task-2 는 저장소에 **아직 구현되지 않았다.** 과제지·채점지·지급파일은
`national-skills-v7/2과제` 에 있으므로 근거는 확보돼 있다.

사이트 커버리지를 대조하면 이렇다.

| 상태 | 모듈 |
|---|---|
| 커버됨 | Workflow · Cloud Event Handling(모듈 09) · EKS Scaling · SQS+KEDA · Container Logging(모듈 07·10) · NoSQL-DynamoDB(모듈 03) |
| 실습 없이 함정 암기만 | Real-time analytics(Flink) · MSK — 모듈 10 Part C |
| **전무** | **DocumentDB · VPC Lattice · CDN Function** |

메워야 할 것은 셋이다. 이전 판(7개 미커버)은 확정되지 않은 13개 모듈 풀 전체를 대상으로 삼아
과대 추정한 것이다 — Client VPN·Keycloak SSO·RDS Proxy 등은 후보 세 세트 어디에도 없다.

### 4. 3과제는 배점이 가장 크고 성격이 완전히 다르다 (근거는 예측)

:::caution
이 절의 근거는 `skills-2026/task-3` — **3과제 예상 풀이**다. 공식 과제지·채점지가 아니다.
아래 수치와 채점 항목은 전부 예측이고, 실제 3과제는 다를 수 있다. 커리큘럼 배분의 근거로는
쓰되, 문서 본문에 확정 사실처럼 쓰지 않는다.
:::

| 과제 | 시간 | 배점 |
|---|---|---|
| 1과제 | 4h | 30점 |
| 2과제 | 4h | 30점 (모듈 4 × 7.5) |
| **3과제** | **3h** | **40점** |

배점 40점은 1·2과제 각 30점과 총점 100점에서 역산되므로 이 부분은 예측에 덜 의존한다.

사이트는 3과제를 PART-6 모듈 14 하나로 D15~16 에 두고 "예비"로 표기한다. 2주 밖이다.

예상 풀이 기준으로 1·2과제와 **채점 모드 자체가 다르다.**

| | 1과제 | 3과제 (예상) |
|---|---|---|
| 성격 | 만들면 끝 | **T+60분부터 채점 플랫폼이 실제 트래픽을 주입한다** |
| 컴퓨트 | EKS (후보 3편 공통) | **EKS · EC2 만 · Fargate·Lambda 금지** |
| 채점 | 리소스 상태 스냅샷 | 채점자가 로드 인스턴스에서 `results_<비번호>.log` 확인 |

1과제와 3과제 모두 EKS 라는 점이 오히려 커리큘럼을 단순하게 만든다 — EKS 축 하나로 둘을 덮는다.

40점 구성 (예상):

| 항목 | 배점 | 방식 |
|---|---|---|
| 비정상 요청 처리 | 4 | 이미지 처리율 4단계 + 403/404 정확도 4단계 |
| 고가용성 | 12 | user·product·stress 3앱 × availability 8단계 |
| 성능 효율성 | 12 | 3앱 × SLO 달성률 8단계 |
| **비용 최적화** | **12** | 인스턴스 cost ratio 12단계. 단계마다 "3앱 performance ≥30%" 게이트 |

**전체 100점 중 12점이 비용이다.** 현재 사이트에 비용 최적화는 독립 주제로 없다.

고정 제약 — DB identifier `apdev-rds-instance`(대소문자 구분), RDS MySQL Community 8.0 · Multi-AZ ·
`db.t3.micro` · gp3. 앱은 Golang/Gin 바이너리로 지급된다.

0점 게이트가 무겁다 — 제출 엔드포인트가 본인 시스템이 아님(전체 0점) / DB 타입·대수 불일치(3·4번
항목 전체 0점) / **Lambda 부적절 사용(전체 0점)**.

기술적 핵심 — 응답이 요청 uuid 를 그대로 되돌려주므로 **API 캐시가 원천적으로 불가능하다**
(`CachingDisabled`). 성능은 전적으로 DB 단(RDS Proxy · 인덱스)과 HPA·Karpenter 튜닝에서 나온다.
SLO 는 user·product ≤0.2초, stress ≤1.0초이고 공통 5초가 마지노선이다.

### 5. 문서 위생

방향과 별개로 고칠 것들이다.

- **끊긴 참조 약 15곳** — 산문이 사이트 문서를 옛 `.md` 파일명으로 지칭한다(`troubleshooting.md` 9곳,
  `timings.md` 2곳 등). 링크가 아니라 산문이라 `starlight-links-validator` 가 잡지 못한다.
- **`start/kms-basics` 가 고아다** — 선수 학습 CardGrid 에 없고, 인바운드 링크가 하나뿐이다.
- **KMS 중복** — `start/kms-basics`(339줄)와 `part-1/02/theory`(413줄)가 절 4개(봉투암호화·키정책·
  root-less·순환참조)를 겹쳐 쓴다.
- **신규 3종 미연결** — `kms`·`s3`·`eks`-basics 가 대응 모듈의 "선행 지식" 블록에서 링크되지 않는다.
- **PART-5~6 이론이 얇다** — `part-5/12`·`part-6/14` theory 는 코드 블록·도식이 0개다.

## 결정

1. ~~ECS Fargate 축을 추가하고 EKS 는 유지한다.~~ → **축소.** 1과제 후보 세 편이 모두 EKS 이므로
   D4~D5 를 차지하는 ECS 경로는 만들지 않는다. 대신 **EKS 축 안에서 set-02·03·07 의 구성 차이를
   다루고, ECS 는 부록 한 편으로 남긴다**(아래 "ECS 를 부록으로 남기는 이유").
2. **Terraform 은 유지하되 위치를 재정의한다.** "채점 대상이 아니라 변동 대응 수단"임을 모듈
   약속에 명시하고, 콘솔·CLI 대안 경로를 병기한다.
3. **방향 문서를 먼저 내고 승인 후 콘텐츠를 고친다.**
4. **근거는 수상 후보 세트로 한정한다.** 1과제는 set-02·03·07, 2과제는 set-02·07·08.
   set-05·set-09 는 후보가 아니므로 인용하지 않는다.

## 개편안

### 축을 바꾼다 — 서비스별에서 과제별로

지금 축은 기술 스택 순서(Terraform → 컨테이너 → EKS → 관측성 → 서버리스)다. 실제 채점 단위는
과제다. 학습자가 "지금 배우는 게 몇 과제 것인가"를 항상 알 수 있어야 한다.

| PART | 일차 | 내용 | 근거 |
|---|---|---|---|
| 선수 지식 | D0 | 자가진단 + 기초 문서 | 현행 유지 |
| PART-1 공통 기반 | D1~D3 | VPC · IAM · KMS · S3 · CloudFront · DynamoDB · ECR · Terraform | 1·2·3과제 공통 부품 |
| PART-2 1과제 · EKS | D4~D7 | eksctl · k8s 워크로드 · LBC · TargetGroupBinding → 1과제 완주 | 현행 유지. 후보 3편 모두 EKS |
| PART-3 관측성·Hard Mode | D8~D9 | 관측성 · fully-private EKS · IAM 심화 | 현행 유지 |
| PART-4 2과제 모듈 | D10~D11 | 후보 12개 모듈. **DocumentDB · VPC Lattice · CDN Function 신설** | 후보 세 세트 실측 |
| PART-5 3과제 | D12~D14 | 부하 운영 · SLO 튜닝 · RDS Proxy·인덱스 · **비용 최적화** | **배점 40점. 승격** |
| 모의 대회 | 위 일정 안에서 | 4시간 타이머 · AI 금지 · 봉인 변형 | 현행 모듈 13 |
| 변동 드릴 · 파괴/복구 | **일차 없음** | 30분 치환 드릴 · 12종 자력 복구 | **시간 여유 있을 때만** |

ECS 경로가 빠지면서 D4~D7 이 EKS 1과제로 되돌아갔고, 그만큼 2과제·3과제에 여유가 생겼다.
합계 14일로 "2주 완성"과 맞는다.

**ECS 경로 철회로 바뀐 것** — 초판은 D4~D5 를 ECS, D6~D7 을 EKS 로 쪼개려 했다. 1과제 후보가
전부 EKS 로 확인되면서 그 분할이 불필요해졌다. 대신 **현행 PART-2(D4~D7)에서 set-02 만이 아니라
set-03·set-07 의 구성 차이를 함께 다루는 쪽**으로 방향을 바꾼다. set-07 의 `internal ALB +
CloudFront VPC Origin`·WAF 가 set-02 에 없는 대표적 차이다.

**3과제에 3일을 준 이유** — 배점이 40점으로 가장 크고, 채점 모드(부하 하 SLO 유지·비용 ratio)가
1·2과제와 완전히 달라 기존 학습이 전이되지 않는다. 새로 가르쳐야 할 것이 많다.

1. 부하를 실제로 걸고 HPA·Karpenter 를 실측 튜닝하는 절차 (k6)
2. SLO 를 기준으로 CPU limit·scaleUp/scaleDown 정책을 정하는 판단
3. RDS Proxy 커넥션 풀링과 인덱스 설계 — 과제지가 "테이블 구조 재설계가 필요할 수 있다"고만 하고
   정답을 주지 않는다
4. **비용 ratio 를 점수로 다루는 사고** — 12점짜리인데 현재 사이트에 독립 주제로 없다
5. 403/404 계약을 인프라 레이어(WAF·ALB)로 분리 구현
6. "API 캐시 불가 vs 정적 콘텐츠 캐시" 구분

### 변동 드릴과 파괴/복구를 일차에서 뺀다 — 실행 결과로 교정

현행 PART-5 는 변동 드릴(11)·파괴 복구(12)·모의 대회(13) 3모듈이었고, Day 12·13·14 를 각각
차지했다. 실행하면서 최초 계획을 두 곳 교정했다 — 실제로 고쳐 보니 원안이 틀렸다.

**변동 드릴** — 원안대로 일차를 없앴다. `title`·`description`·"소요" 절에서 "Day 12"를 지우고
"시간 여유가 있을 때"로 바꿨다. 모듈 문서는 그대로 남는다.

**파괴/복구 — "troubleshooting 으로 통합"은 실행하지 않았다.** 원안은 독립 모듈(12)을 없애고
`reference/troubleshooting` 으로 합치는 것이었다. 실제 내용을 읽어 보니 두 가지가 틀렸다.

1. `part-5/12/theory.mdx` 는 진단 4원칙 설명 + 퀴즈 5문(explanation 유형)이고, `reference/
   troubleshooting.mdx` 는 증상→원인→명령 표(reference 유형)다. 합치면 `.claude/rules/
   docs-style.md` 의 "한 문서에 Diátaxis 유형을 섞지 않는다"를 정면으로 어긴다.
2. 조사에서 "트러블슈팅 3중 분산"이라 부른 것(`start/*` 5개 ↔ `reference/troubleshooting` ↔
   `part-5/12`)은 실제로는 중복이 아니라 **층이 다른 세 문서**였다. `start/*` 의 표는 개념을
   배우다 만나는 오해(예: "NACL 거부 규칙이 낮은 번호에 있어야 이긴다")고, `reference/
   troubleshooting` 은 배포 후 증상(원인 순위 ①②③ + 확인 명령)이며, `part-5/12` 는 그 표를
   실제로 손에 붙이는 12개 실습 시나리오다. 겹치는 행은 5곳 중 4곳(eks 3·kms 1)뿐이고 문장도
   다른 목적으로 쓰였다. 합치면 멀쩡한 학습 도구 세 개를 하나로 뭉개는 것이었다.

대신 **변동 드릴과 같은 처리**로 바꿨다 — 모듈은 유지하고 일차만 뺀다. `title`·`description`·
"소요" 절에서 "Day 13"을 지우고 "시간 여유가 있을 때, 모의 대회 전에 한 번은 끝내 둔다"로
바꿨다. `part-5/13-mock-exam/lab.mdx` 와 `reference/ai-study-guide.mdx` 의 "Day 13 저녁" 세 곳도
"모의 대회 전날 저녁"으로 고쳐, 더 이상 존재하지 않는 고정 일차를 가리키지 않게 했다.

**결과** — PART-5 는 이제 모듈 13(모의 대회)만 D14 를 갖고, 11·12 는 그 앞에 뜨는 미고정 준비
모듈이다. 루트 로드맵 표·카드·사이드바 라벨을 `D12~14` → `D14` 로 맞췄다. PART 재배치(전체
Day 재번호)는 여전히 실행 단계 마지막 몫이다 — 2과제·3과제 콘텐츠가 없는 상태에서 먼저 하면
존재하지 않는 문서를 가리키게 된다.

### ECS 경로 신설을 착수 직전에 철회했다

실행 단계 5번(ECS 경로 신설)의 문서 작성을 시작하려던 시점에, 근거로 삼던 `national-skills-v7`
이 확정된 경기 과제가 아니라 **set-08 제출작**이라는 것이 드러났다(위 "정체" 절). 수상 후보
목록을 대조하니 1과제 후보 세 편이 모두 EKS 였다.

**아무 파일도 만들지 않은 상태에서 멈췄다.** 잘못된 전제로 모듈 6개(index·theory·lab × 2)를
쓸 뻔했다. 이 문서의 초판이 "2026 실출제는 ECS"라고 단정한 것이 원인이다 — 근거 자료의
정체를 확인하지 않고 파일 이름(`national-skills-v7`)과 내용의 완성도만 보고 실제 시험지로
단정했다.

**교훈으로 남길 것** — 근거 자료를 인용하기 전에 그 자료가 무엇인지부터 확인한다. 이 경우
`diff` 한 번으로 `set-08/task-1/mark.sh` 와 동일하다는 것이 나왔고, `task.md` 첫 줄에
`과제출제 양식 (별첨3)` 이라고 적혀 있었다.

### ECS 를 부록으로 남기는 이유

경로 신설은 접었지만 ECS 를 완전히 버리지는 않는다. 근거가 셋 있다.

1. **당일 30% 변동**이 컴퓨트를 건드릴 여지가 있다. 변동은 보통 이름·CIDR·개수·스펙 수준이지만
   범위가 규정돼 있지 않다.
2. **출제기준의 1과제 컴퓨트 필수 항목이 `Container(ECS·EKS, EC2·Fargate)`** 다. ECS 가 규정상
   배제돼 있지 않다.
3. **set-08 이 실제로 ECS 1과제를 제출했다.** 그 1과제가 후보에 들지 못했을 뿐, 같은 유형의 문제가
   나올 수 있다는 증거다. 채점 스크립트와 정답 구현이 모두 남아 있어 근거도 확보돼 있다.

다만 **비용 대비 효과가 낮으므로 하루를 쓰지 않는다.** EKS 를 아는 사람이 ECS 로 넘어가는 데
필요한 것은 대응 관계와 함정 몇 개지 새 커리큘럼이 아니다. `reference/` 에 대응표 한 편으로
둔다 — 후보가 EKS 인 이상 평소에는 읽지 않고, 변동으로 ECS 가 나왔을 때만 펴는 문서다.

담을 것: ECS 클러스터·태스크 정의·서비스가 각각 k8s 의 무엇에 대응하는지 / **실행 역할과 태스크
역할을 분리해야 하는 이유**(set-08 채점 5-4 가 두 ARN 이 서로 다른지 본다) / `awsvpc` 네트워크
모드와 Target Group `ip` 타입의 연결 / private 서브넷 + `assign_public_ip = false` 일 때 ECR pull
경로(NAT 또는 VPC Endpoint 없으면 태스크가 기동조차 못 한다) / `runtime_platform` 의
`cpu_architecture` — 제공 바이너리가 정적 링크 x86-64 ELF 라 arm 으로 빌드하면 전부 무너진다.

### 각 모듈이 지켜야 할 것

- 모듈 `index` 의 학습 목표는 **채점 항목 문장으로 쓴다.** "이해할 수 있다"가 아니라 "`asgmt1_check.sh`
  의 3-3 항목(헤더 없는 ALB 직접 호출이 403)을 통과시킬 수 있다"처럼.
- 리전·리소스명·태그는 **채점 스크립트에서 인용**한다. 대소문자까지 그대로.
- 2과제 모듈 문서는 **리전을 제목에 박는다.** 모듈마다 다르고 틀리면 0점이다.

### 신규로 써야 할 문서

| 문서 | 이유 | 근거 |
|---|---|---|
| **DocumentDB 모듈** | 2과제 후보. 현재 전무 | set-08 모듈 1 (`national-skills-v7/2과제`) |
| **VPC Lattice 모듈** | 2과제 후보. 현재 전무 | set-08 모듈 2 (`national-skills-v7/2과제`) |
| **CDN Function 모듈** | 2과제 후보. 현재 전무 | set-07 모듈 2 (`set-07/task-2/module-2-cdn-function`) |
| Flink · MSK 실습 보강 | 2과제 후보인데 모듈 10 이 함정 암기로만 다룬다 | set-02 모듈 2·4 |
| set-03·set-07 1과제 차이 | 1과제 후보 3편 중 둘을 안 다룬다. set-07 의 internal ALB + CloudFront VPC Origin·WAF 가 대표 차이 | set-03·set-07 task-1 |
| **비용 최적화** | 3과제 12점. 인스턴스 사이징·cost ratio·감점 규칙. 현재 독립 주제로 없음 | `task-3/mark.pdf` |
| **부하 테스트와 SLO 튜닝** | 3과제 24점(고가용성 12 + 성능 12). k6 · HPA · Karpenter 실측 | `task-3/` |
| **RDS Proxy·인덱스 설계** | 3과제 성능의 핵심. API 캐시가 불가하므로 여기서만 점수가 난다 | `task-3/ARCHITECTURE.md` |
| `reference/mark-script-guide` 보강 | 실제 채점 스크립트를 근거로 재작성 | 후보 세트 `mark.sh` |
| **`reference/ecs-fallback`** (부록) | 30% 변동으로 ECS 가 나올 경우의 대응표. 하루를 쓰지 않고 한 편으로 | set-08 task-1 + `national-skills-v7/1과제` |

~~ECS Fargate 경로 신설(D4~D5)~~ 은 부록 한 편으로 축소했다(위 절 참고). Client VPN·Keycloak SSO·
RDS Proxy 모듈 요약은 뺐다 — 후보 세 세트 어디에도 없다.

### HCL 선수 지식 문서

별도 spec(`2026-07-26-hcl-basics-design.md`)으로 진행하되, 정답지 실측으로 범위를 다시 잡았다.
사이트 문서 인용만 보고 판단했던 이전 목록은 틀렸다.

정답지 191개 `.tf` 기준 실사용 상위: 보간 `${}` 476회 · `type` 제약 362회 · `variable` 233회 ·
`each.key/value` 182회 · `output` 154회 · `data` 130회 · `for_each` 81회 · `for` 표현식 59회 ·
`toset()` 50회 · `depends_on` 38회 · `locals` 37회 · `count` 20회 · `jsonencode()` 20회 ·
조건 `? :` 15회 · `file()/filebase64()` 15회 · splat `[*]` 10회 · `templatefile()` 7회 ·
`merge()` 6회 · heredoc 6회 · `lifecycle` 5회.

정답지 0회라 뺄 것: `cidrsubnet()` · `module` 블록 · `backend` · `provisioner` · `try()` ·
`coalesce()` · `format()` · `join()` · `split()` · `flatten()` · `optional()` · `tolist()` ·
`prevent_destroy`.

## 실행 단계

| # | 단계 | 방향 의존 | 상태 |
|---|---|---|---|
| 1 | 위생 처리 — 끊긴 참조 15곳, `kms-basics` 연결, KMS 중복 정리 | 없음 | 완료 |
| 2 | HCL 선수 지식 문서 신설 + `part-1/01` 0번 섹션 분리 | 없음 | 완료 |
| 3 | 변동 드릴·파괴/복구 일차 제거 — 모듈 유지, "시간 여유 시"로 전환. troubleshooting 통합은 실행하지 않음(위 교정 참고) | 확정 | 완료 |
| 4 | 로드맵·인덱스·사이드바에서 `D12~14` → `D14` 로 맞춤 | 확정 | 완료 |
| ~~5~~ | ~~ECS Fargate 경로 신설(D4~D5)~~ | — | **축소** — 부록 1편으로(9번) |
| 5 | 2과제 공백 — **DocumentDB · VPC Lattice · CDN Function** 신설 | 확정 | 완료 |
| 6 | 변동 대비 부록 — `reference/variation-drill` · `reference/ecs-fallback` | 확정 | 완료 |
| 7 | 1과제 후보 차이 — set-03·set-07 구성을 PART-2 에 반영 (WAF·set-07 관측성) | 확정 | 대기 |
| 8 | Flink · MSK 실습 보강 (현재 함정 암기만) | 확정 | 대기 |
| 9 | 3과제 승격 — 부하·SLO·비용 최적화 신규 | 확정 | 대기 |
| 10 | PART 재배치와 로드맵·인덱스 갱신 | 9까지 끝난 뒤 | 대기 |

**6번 부록의 범위** — 후보 밖 제출작(set-05·06·08·09)의 개념을 모았다. 30% 변동에서 출제자가
다른 제출작의 요구사항을 가져다 붙일 수 있다는 판단이다. `variation-drill` 은 EKS 계열 12항목
(Bastion sshpass 접속, 노드 hostname 커스터마이징, Bottlerocket, Pod SG, ECR 3MB·zstd, WAF
커스텀 응답 등), `ecs-fallback` 은 컴퓨트가 ECS 로 바뀔 때의 대응표다. 둘 다 `reference` 유형이고
우선순위가 낮다는 것을 문서 첫머리에 밝혔다.

노드 hostname 커스터마이징은 set-05 와 set-06 **양쪽에 독립적으로 나온다** — 후보 밖이지만
출제자들이 공유하는 관심사라는 뜻이라 변동 가능성이 상대적으로 높다.

1~4번은 완료했다. 5번이 가장 급하다 — 후보 12개 모듈 중 셋이 사이트에 아예 없고, 그중 둘
(DocumentDB·VPC Lattice)은 저장소에도 구현이 없어 사이트가 유일한 학습 경로가 된다. 5~8번은
분량이 크니 단계마다 끊고 검토받는다. 9번은 앞이 다 끝나야 의미가 있다.

## 미확인

- **3과제 전체가 예측이다.** `skills-2026/task-3` 는 예상 풀이이고 공식 과제지·채점지가 아니다.
  아키텍처(EKS Auto Mode·RDS Proxy)·채점 항목·SLO 수치·비용 ratio 12점이 전부 여기서 나왔다.
  커리큘럼에 3일을 배정하는 근거로는 쓰되, **문서 본문에 확정 사실로 쓰지 않는다.** 공식 자료가
  나오면 이 절 전체를 다시 검증해야 한다.
- **3과제 후보 목록을 받지 못했다.** 1·2과제 후보는 확인했다.
- **set-08 task-2 는 저장소에 구현이 없다.** 과제지·채점지·지급파일은 `national-skills-v7/2과제` 에
  있으므로 요구사항은 알 수 있지만, 정답 구현과 대조할 수는 없다. DocumentDB·VPC Lattice 모듈을
  쓸 때 참고할 정답이 없다는 뜻이다.
- set-08 1과제 채점의 Metric Filter Pattern 정답은 문제지에 없다(부록 작성 시에만 해당). 제공된
  `book` 바이너리를 실행해 로그 형식을 확인해야 알 수 있다.
- 직종설명서는 확보했으나 **구체 범위의 근거가 아니었다**(위 발견 1 참조). 한국 출제기준이 참조하는
  실제 세부 규정이 따로 있는지는 확인 불가.
