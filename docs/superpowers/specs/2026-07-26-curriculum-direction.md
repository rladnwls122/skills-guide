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
| `C:\Users\kryuk\Downloads\national-skills-v7` | 1·2과제 문제지·채점지 PDF, **채점 스크립트 5개**(`asgmt1_check.sh`, `asgmt2_module1~4_check.sh`), 지급파일, 다이어그램, 출제기준·출제가이드 PDF |
| `C:\Users\kryuk\Downloads\I_331_클라우드컴퓨팅.pdf` | 직종설명서. 실체는 **WorldSkills International Technical Description**(`WSC2024_TD53_en`, 영문 28쪽) |
| `C:\Users\kryuk\practice\skills-2026` | 수상 과제 정답지. `.tf` 191개 약 14,000줄, set-02·03·05·07·08·09 + **`task-3`(3과제 과제지·채점지 포함)** |

채점 스크립트가 가장 확실한 근거다. 문제지가 애매하게 쓴 것도 스크립트는 정확한 값으로 검사한다.

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

### 2. 2026 1과제는 ECS Fargate 다 — EKS 로 풀면 0점

1과제 채점지의 0점 처리 규칙에 이것이 있다.

> Fargate 아닌 **EC2·EKS 직접 구동** → 0점

채점 스크립트도 ECS 를 전제로 짜여 있다. `family=skills-book-task`, `launchType=FARGATE`,
`networkMode=awsvpc`, `assignPublicIp=DISABLED`, Target Group `TargetType=ip`.

출제기준상 1과제 컴퓨트 필수 항목은 `Container(ECS·EKS, EC2·Fargate)` 로 **양쪽 다 출제 가능**하다.
2026 은 ECS 였을 뿐이다. `skills-2026` 에도 set-08·set-09 가 ECS Fargate 기반이다.

**현재 사이트에는 ECS·Fargate 실습이 없다.** PART-2 전체(D4~D7)가 EKS·eksctl 축이고, 1과제 완주
모듈(06)도 set-02(EKS) 기준이다.

### 3. 2과제 13개 모듈 풀 중 7개가 비어 있다

2과제는 13개 모듈 풀에서 4개가 출제되고, **모듈마다 리전이 다르다**(틀리면 0점).

| 2026 실출제 모듈 | 리전 | 사이트 |
|---|---|---|
| DocumentDB NoSQL | 서울 | ❌ 없음 |
| VPC Lattice | 도쿄 | ❌ 없음 |
| Cloud Event Handling | 싱가포르 | ✅ PART-4 모듈 09 |
| SQS + KEDA Pod Scaling | 오레곤 | ✅ PART-4 모듈 10 |

풀 전체 기준 미커버: **DocumentDB · VPC Lattice · CDN Functions/Lambda@Edge · RDS Proxy/Data API ·
Client VPN · Keycloak SSO · REST API(Lambda+APIGW)**.

### 4. 3과제는 배점이 가장 크고 성격이 완전히 다르다

| 과제 | 시간 | 배점 |
|---|---|---|
| 1과제 | 4h | 30점 |
| 2과제 | 4h | 30점 (모듈 4 × 7.5) |
| **3과제** | **3h** | **40점** |

사이트는 3과제를 PART-6 모듈 14 하나로 D15~16 에 두고 "예비"로 표기한다. 2주 밖이다.

`skills-2026/task-3/task.pdf`·`mark.pdf` 를 확인해 보니 1·2과제와 **채점 모드 자체가 다르다.**

| | 1과제 | 3과제 |
|---|---|---|
| 성격 | 만들면 끝 | **T+60분부터 채점 플랫폼이 실제 트래픽을 주입한다** |
| 컴퓨트 | ECS Fargate (EKS 쓰면 0점) | **EKS 필수 · EC2 만 · Fargate·Lambda 전면 금지** |
| 채점 | 리소스 상태 스냅샷 | 채점자가 로드 인스턴스에 SSH 접속해 `results_<비번호>.log` 확인 |

**이것이 ECS/EKS 문제를 정리한다.** 1과제는 ECS, 3과제는 EKS 필수다. 둘 다 가르쳐야 한다.

40점 구성:

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

1. **ECS Fargate 축을 추가하고 EKS 는 유지한다.** 어느 쪽이 출제돼도 대응한다.
2. **Terraform 은 유지하되 위치를 재정의한다.** "채점 대상이 아니라 변동 대응 수단"임을 모듈
   약속에 명시하고, 콘솔·CLI 대안 경로를 병기한다.
3. **방향 문서를 먼저 내고 승인 후 콘텐츠를 고친다.**

## 개편안

### 축을 바꾼다 — 서비스별에서 과제별로

지금 축은 기술 스택 순서(Terraform → 컨테이너 → EKS → 관측성 → 서버리스)다. 실제 채점 단위는
과제다. 학습자가 "지금 배우는 게 몇 과제 것인가"를 항상 알 수 있어야 한다.

| PART | 일차 | 내용 | 근거 |
|---|---|---|---|
| 선수 지식 | D0 | 자가진단 + 기초 문서 | 현행 유지 |
| PART-1 공통 기반 | D1~D3 | VPC · IAM · KMS · S3 · CloudFront · DynamoDB · ECR · Terraform | 1·2·3과제 공통 부품 |
| PART-2 1과제 · ECS 경로 | D4~D5 | ECS Fargate · ALB · CloudFront 이중 오리진 → set-08/09 완주 | **신설**. 2026 실출제 |
| PART-3 1과제 · EKS 경로 | D6~D7 | eksctl · k8s 워크로드 · LBC · TargetGroupBinding → set-02 완주 | 현행 PART-2 이관 |
| PART-4 2과제 모듈 풀 | D8~D10 | 13개 모듈을 얕고 넓게. 실출제 4개 우선 | 모듈당 1시간 분량이 출제기준 |
| PART-5 3과제 | D11~D13 | 부하 운영 · SLO 튜닝 · RDS Proxy·인덱스 · **비용 최적화** | **배점 40점. 승격** |
| PART-6 모의 대회 | D14 | 4시간 타이머 · AI 금지 · 봉인 변형 | 현행 모듈 13 |
| 변동 드릴 | **일차 없음** | 30분 치환 드릴 · "이름이 숨는 곳" 8종 | **시간 여유 있을 때만** |

합계 14일로 "2주 완성"과 맞는다.

**3과제에 3일을 준 이유** — 배점이 40점으로 가장 크고, 채점 모드(부하 하 SLO 유지·비용 ratio)가
1·2과제와 완전히 달라 기존 학습이 전이되지 않는다. 새로 가르쳐야 할 것이 많다.

1. 부하를 실제로 걸고 HPA·Karpenter 를 실측 튜닝하는 절차 (k6)
2. SLO 를 기준으로 CPU limit·scaleUp/scaleDown 정책을 정하는 판단
3. RDS Proxy 커넥션 풀링과 인덱스 설계 — 과제지가 "테이블 구조 재설계가 필요할 수 있다"고만 하고
   정답을 주지 않는다
4. **비용 ratio 를 점수로 다루는 사고** — 12점짜리인데 현재 사이트에 독립 주제로 없다
5. 403/404 계약을 인프라 레이어(WAF·ALB)로 분리 구현
6. "API 캐시 불가 vs 정적 콘텐츠 캐시" 구분

### 변동 드릴과 파괴/복구를 일차에서 뺀다

현행 PART-5 는 변동 드릴(D12)·파괴 복구(D13)·모의 대회(D14) 3일이다. 이 셋 중 모의 대회만 일차를
갖는다.

- **변동 드릴** — 일차를 아예 없앤다. 시간 여유가 있을 때 하는 것으로 두고 로드맵 표에서 Day 를
  뺀다. 모듈 문서 자체는 남긴다.
- **파괴/복구** — 독립 모듈(현행 12)을 없애고 `reference/troubleshooting` 으로 합친다. 각 PART 의
  lab 말미에서 그 PART 에서 깨지는 것만 링크한다. 방금 만든 것을 고치는 편이 하루 몰아서 12개
  시나리오를 도는 것보다 붙는다.

파괴/복구를 합치면 조사에서 나온 **트러블슈팅 3중 분산**(`start/*` 5개 문서 말미 ↔
`reference/troubleshooting.mdx` ↔ `part-5/12` 12 시나리오)도 같이 정리된다.

### 각 모듈이 지켜야 할 것

- 모듈 `index` 의 학습 목표는 **채점 항목 문장으로 쓴다.** "이해할 수 있다"가 아니라 "`asgmt1_check.sh`
  의 3-3 항목(헤더 없는 ALB 직접 호출이 403)을 통과시킬 수 있다"처럼.
- 리전·리소스명·태그는 **채점 스크립트에서 인용**한다. 대소문자까지 그대로.
- 2과제 모듈 문서는 **리전을 제목에 박는다.** 모듈마다 다르고 틀리면 0점이다.

### 신규로 써야 할 문서

| 문서 | 이유 |
|---|---|
| ECS Fargate 이론 + 실습 | 1과제 실출제 컴퓨트. 현재 전무 |
| VPC Lattice 모듈 | 2026 실출제. 현재 전무 |
| DocumentDB 모듈 | 2026 실출제. 현재 전무 |
| 나머지 2과제 모듈 요약 | CDN Functions · RDS Proxy · Client VPN · Keycloak SSO · REST API |
| **비용 최적화** | 3과제 12점. 인스턴스 사이징·cost ratio·감점 규칙. 현재 독립 주제로 없음 |
| **부하 테스트와 SLO 튜닝** | 3과제 24점(고가용성 12 + 성능 12). k6 · HPA · Karpenter 실측 |
| **RDS Proxy·인덱스 설계** | 3과제 성능의 핵심. API 캐시가 불가하므로 여기서만 점수가 난다 |
| `reference/mark-script-guide` 보강 | 실제 채점 스크립트 5개를 근거로 재작성 |

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

| # | 단계 | 방향 의존 |
|---|---|---|
| 1 | 위생 처리 — 끊긴 참조 15곳, `kms-basics` 연결, KMS 중복 정리 | 없음 |
| 2 | HCL 선수 지식 문서 신설 + `part-1/01` 0번 섹션 분리 | 없음 |
| 3 | 파괴/복구를 `reference/troubleshooting` 으로 통합, 트러블슈팅 3중 분산 정리 | 확정 |
| 4 | 변동 드릴 일차 제거 — 로드맵·인덱스에서 Day 표기만 뺀다 | 확정 |
| 5 | ECS Fargate 경로 신설 | 확정 |
| 6 | 2과제 공백 — VPC Lattice · DocumentDB 우선, 나머지 요약 | 확정 |
| 7 | 3과제 승격 — 부하·SLO·비용 최적화 신규 | 확정 |
| 8 | PART 재배치와 로드맵·인덱스 갱신 | 7까지 끝난 뒤 |

1~2번은 방향과 무관하므로 먼저 친다. 5~7번은 분량이 크니 단계마다 끊고 검토받는다. 8번은 앞이
다 끝나야 의미가 있다 — 먼저 하면 존재하지 않는 문서를 가리키게 된다.

## 미확인

- **3과제 비용 ratio 산식이 없다.** 12점짜리인데 `task.pdf`·`mark.pdf` 어디에도 계산식이 없다.
  "0.50~X.XX 범위 안이면 단계당 1.0점"만 있다. 실제 대회에서 어떻게 계산되는지 알 수 없다.
- **3과제 이미지 다운로드 5초 SLO** 를 별도 채점하는 항목이 채점지에 없다. 과제지는 요구하는데
  채점 항목은 "이미지 처리율"(4점 안) 하나뿐이다.
- 1과제 채점의 Metric Filter Pattern 정답은 문제지에 없다. 제공된 `book` 바이너리를 실행해 로그
  형식을 확인해야 알 수 있다.
- 직종설명서는 확보했으나 **구체 범위의 근거가 아니었다**(위 발견 1 참조). 한국 출제기준이 참조하는
  실제 세부 규정이 따로 있는지는 확인 불가.
