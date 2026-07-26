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
| `C:\Users\kryuk\practice\skills-2026` | 수상 과제 정답지. `.tf` 191개 약 14,000줄, set-02·03·05·07·08·09 + task-3 |

채점 스크립트가 가장 확실한 근거다. 문제지가 애매하게 쓴 것도 스크립트는 정확한 값으로 검사한다.

## 발견

### 1. 채점은 IaC 를 보지 않는다

1·2과제 문제지·채점지 어디에도 Terraform·CloudFormation·CDK 언급이 없다. 채점은 CloudShell 에서
AWS CLI 로 **배포된 리소스 상태만** 검사한다. 제출물은 비번호와 Custom Header 값뿐이다.

Terraform 은 출제기준 체크리스트의 `"AWS, Terraform, GitHub 및 직종설명서에 명시된 범위"` 라는
대회 전체 범위 문구에만 나온다. 직종설명서는 확보하지 못했다.

**함의** — Terraform 은 채점 항목이 아니라 **30% 변동을 30분에 반영하는 수단**이다. 사이트가 이걸
"배워야 할 대상"처럼 제시하면 학습자가 우선순위를 잘못 잡는다. 정답지가 전부 Terraform 이므로
읽는 능력은 여전히 필요하다.

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

### 4. 3과제가 최대 배점인데 "예비"로 밀려 있다

| 과제 | 시간 | 배점 |
|---|---|---|
| 1과제 | 4h | 30점 |
| 2과제 | 4h | 30점 (모듈 4 × 7.5) |
| **3과제** | **3h** | **40점** |

사이트는 3과제를 PART-6 모듈 14 하나로 D15~16 에 두고 "예비"로 표기한다. 2주 밖이다.
`skills-2026` 의 `task-3` 는 System operation — EKS Auto Mode, RDS Multi-AZ + Proxy, 부하 처리와
비용 최적화다.

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
| PART-4 2과제 모듈 풀 | D8~D11 | 13개 모듈을 얕고 넓게. 실출제 4개 우선 | 모듈당 1시간 분량이 출제기준 |
| PART-5 3과제 | D12 | 부하 운영 · EKS Auto Mode · RDS Multi-AZ+Proxy · 비용 | **배점 40점. 승격** |
| PART-6 실전 | D13~D14 | 변동 드릴 · 파괴/복구 · 모의 대회 | 현행 PART-5 이관 |

합계 14일로 "2주 완성"과 맞는다.

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
| 나머지 2과제 모듈 4종 요약 | CDN Functions · RDS Proxy · Client VPN · Keycloak SSO · REST API |
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

1. 이 문서 승인
2. 위생 문제 처리 — 끊긴 참조 15곳, kms-basics 연결, KMS 중복 정리
3. HCL 선수 지식 문서 신설 + `part-1/01` 에서 0번 섹션 분리
4. ECS Fargate 경로 신설
5. 2과제 모듈 공백 채우기 (VPC Lattice · DocumentDB 우선)
6. 3과제 승격
7. PART 재배치와 로드맵·인덱스 갱신

2~3번은 방향과 무관하게 확정이므로 먼저 해도 된다. 4번 이후는 분량이 크니 단계마다 끊는다.

## 미확인

- **3과제 출제가이드가 없다.** 40점짜리인데 범위를 문서로 확인하지 못했다. `skills-2026/task-3` 구현
  에서 역추정한 상태다.
- **직종설명서가 없다.** 출제기준이 "직종설명서에 명시된 범위"를 참조하는데 확보하지 못했다.
- 1과제 채점의 Metric Filter Pattern 정답은 문제지에 없다. 제공된 `book` 바이너리를 실행해 로그
  형식을 확인해야 알 수 있다.
