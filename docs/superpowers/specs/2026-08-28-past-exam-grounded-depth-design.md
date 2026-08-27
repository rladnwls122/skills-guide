# 실기출 근거 기반 깊이 재정립 — 설계

날짜: 2026-08-28
상태: 승인 대기

## 왜 이 문서를 쓰나

사이트는 지금까지 `skills-2026`(공모전 제출작 모음)을 주 근거로 만들어졌다. 이번에 **실제로
시행된 과제** 두 해분을 확보했다. 제출작이 아니라 시행문제다.

| 경로 | 내용 |
|---|---|
| `C:\Users\kryuk\Downloads\부산\` | 2024년도 전국기능경기대회 1·2·3과제 문제지·채점지·채점 스크립트·배포파일 |
| `C:\Users\kryuk\Downloads\2025전국_클라우드컴퓨팅_시행문제\` | 2025년도 1·2·3과제 문제지·채점기준·채점 스크립트·배포 바이너리 |

두 해를 대조하니 사이트에 **아예 없는 축이 다섯 개** 나왔고, 3과제는 실기출과 전제가 어긋나
있었다. 이 문서는 그 격차를 메우는 설계다.

## 조사 결과

### 실기출 두 해 주제 매트릭스

| 축 | 2024 부산 | 2025 전국 | 현 사이트 |
|---|---|---|---|
| VPC·서브넷·라우팅 | 3AZ, VPC Flow Logs 커스텀 포맷 | Hub-Spoke 2VPC + Transit Gateway | TGW 없음, Flow Logs 포맷 없음 |
| 트래픽 검사 | — | Network Firewall + Suricata (1·2과제 모두) | 없음 |
| EKS | 1.29, Calico NetworkPolicy, assume-role RBAC | 1.32, addon/app 노드그룹 분리 | 있음 (Calico·노드 분리 결손) |
| CI/CD | CodeCommit·CodeBuild·CodeDeploy·CodePipeline | GitHub Actions + CodeBuild/CodePipeline(OAuth) | 없음 |
| GitOps·배포 전략 | — | ArgoCD + Argo Rollouts BlueGreen, External Secrets(IRSA) | 없음 |
| 서버리스 | API Gateway + Lambda@Edge presigned URL | Step Functions + API Gateway AWS 서비스 프록시 (Lambda 금지) | 부분 |
| 데이터 보호 | — | Macie + Lambda 마스킹 | 없음 |
| WAF | ALB 고정응답 403 | SQLi 룰 직접 작성 (취약 Flask 앱 제공) | 구조만 |
| RDS | MySQL 인덱스 설계 | 포트 3309 + CMK + RDS Proxy 전용 수신 | task-3 에만 |
| 3과제 | EC2 t3.micro, SLO 0.2s / 1s | ECS 강제(EKS·Lambda 금지), c5.large, 비용 ratio | EKS 예측 위에 구축 |
| 앱 | Go 바이너리 3개, `MYSQL_*` 환경변수 | Go 1.22 바이너리 3개, `debug_info` 미스트립 | 없음 |

### 배점이 말하는 우선순위

2025년 1과제(30점 만점) 주요항목 배점:

| 항목 | 배점 | 항목 | 배점 |
|---|---|---|---|
| Continuous Delivery | 4.5 | Logging | 3.0 |
| Container | 4.0 | Load Balancing | 3.0 |
| Application | 3.0 | Security | 2.75 |
| Continuous Integration | 2.5 | Secret management | 2.0 |
| RDBMS | 2.0 | Network Configuration | 1.5 |
| Transit Gateway | 1.5 | Container Registry | 0.25 |

**CD(4.5) + CI(2.5) = 7점.** 1과제 배점 1위 묶음인데 사이트에 해당 내용이 없다.
Network Configuration 은 1.5점뿐이다 — 지금 사이트가 가장 두껍게 다루는 축이다.

2025년 3과제(40점 만점): 비정상 요청 처리 4 / 고가용성 12 / 성능 효율성 12 / 비용 최적화 12.
**전부 스코어보드 측정형**이고 항목이 임계값 사다리다(예: `user API 로드 처리 >= 90.0%` 0.5점,
`>= 87.5%` 0.5점 …). 구축 점수가 아니라 운영 점수다.

### 3과제 전제 충돌

현 `part-5` 는 `skills-2026/task-3`(EKS 기반 예상 풀이)를 따른다. 2025 시행문제는 명시한다 —
컨테이너 오케스트레이션은 **ECS 를 사용하고 EKS 를 사용할 수 없다**, 컴퓨팅은 **c5.large 만**,
**Lambda 는 리전 무관 생성 시 감점**. 2024 는 EC2 t3.micro 직접 배포였다.

한편 EKS 기반 3과제도 2026 과제에서 출제된 적이 있다. 따라서 **어느 한쪽으로 고르지 않고
둘 다 준비한다.** ECS 경로를 실기출 근거로 새로 쓰고, 기존 EKS 경로를 나란히 유지한다.

## 설계

### 원칙

1. **실기출이 1차 근거다.** `skills-2026` 은 구현 참고로 내린다. 인용할 때 어느 해 어느 과제인지
   문서에 밝힌다.
2. **배점 순으로 깊이를 준다.** CD·CI·Container 가 Network Configuration 보다 두꺼워야 한다.
3. **자가채점을 실습에 붙인다.** 실기출 채점 스크립트를 각 실습 끝의 접이식 블록에 넣어,
   구축 후 붙여넣어 통과를 확인하게 한다.
4. **기존 구조를 흔들지 않는다.** 사이드바는 디렉터리 자동생성이고 `sidebar.order` 로 정렬한다.
   기존 번호를 다시 매기지 않고 새 항목을 뒤에 붙인다.

### 산출물

#### A. 기출 근거 페이지 (신규 1장)

`src/content/docs/reference/past-exams.mdx` — 문서 유형 `reference`.

2024·2025 두 해의 과제별 요구사항, 주요항목 배점, 채점 스크립트가 실제로 실행하는 명령을
대조표로 싣는다. "두 해 다 나온 축 / 한 해만 나온 축"을 구분한다. 모든 신규·증보 문서가
이 페이지를 근거로 링크한다.

#### B. 선수 학습 언어 3장 (신규, `start/`, order 16~18)

| 파일 | 제목 | 내용 |
|---|---|---|
| `start/python-basics.mdx` | Python·boto3 기초 | 문법 최소 → 람다 3개 해부(`set-07/task-1` 조회, `set-02/task-1` GSI Query, `set-02/task-2 module-1` CSV 파이프라인) → 2025 2과제 Macie 마스킹 람다 유형 → 변형 과제 5개 |
| `start/go-app-basics.mdx` | Go·Gin 앱 읽기 | Gin 핸들러·라우팅·`os.Getenv`·`database/sql` 예시 소스 → 제공 바이너리에서 라우트·환경변수·헬스 경로 역추적 → 크래시 로그 읽기 |
| `start/mysql-basics.mdx` | MySQL 기초 | 타입·`SELECT`/`WHERE`/`JOIN` → 인덱스와 `EXPLAIN` → 덤프 적재 → 0.2초 SLO 와 인덱스의 관계 |

Go 는 **문법 최소 + 바이너리 동작 읽기**다. 대회는 컴파일된 Gin 바이너리만 주고 수정을 금지한다.
2025 바이너리는 `debug_info` 가 남아 있어 심볼을 읽을 수 있다.

#### C. 결손 축 신규 모듈 (PART 4 확장, 5개)

각 모듈은 기존 규약대로 `index.mdx` + `theory.mdx` + `lab.mdx` 셋을 갖는다.

| 모듈 | 근거 | 다루는 것 |
|---|---|---|
| `part-4/27-network-firewall` | 2025 1과제 4번·2과제 4번 | 방화벽 서브넷 배치, Stateless/Stateful 2단, Suricata 룰 문법, FLOW 로깅, 라우팅 우회 검증 |
| `part-4/28-cicd-pipeline` | 2024 2과제 CICD, 2025 1과제 11번·2과제 1번 | CodeCommit/Build/Deploy/Pipeline 4종 + GitHub Actions + `buildspec.yaml` + OAuth 자격증명 |
| `part-4/29-gitops-rollouts` | 2025 1과제 12번, 2과제 1번 | ArgoCD 설치·노출, Argo Rollouts BlueGreen, `/health` prePromotion, External Secrets + IRSA, 드리프트 자동 복구 |
| `part-4/30-stepfunctions-apigw` | 2025 2과제 5번 | Step Functions 상태 머신, API Gateway AWS 서비스 프록시(Lambda 없이 DynamoDB 직결), 매핑 템플릿으로 403 분기 |
| `part-4/31-macie-masking` | 2025 2과제 2번 | Macie 분류 작업, S3 이벤트 → Lambda 마스킹, 정규식 6종(이름·이메일·전화·SSN·카드·UUID) |

#### D. 기존 모듈 증보 (6장)

| 대상 | 추가 |
|---|---|
| `part-0/02-network-basics/theory.mdx` | Transit Gateway 가 푸는 문제(VPC 피어링 한계), TGW 라우팅 테이블·연결, VPC Flow Logs 커스텀 포맷 필드 |
| `part-0/03-dns-http-tls/theory.mdx` | 상태 검사 경로가 하는 일, HTTP 상태코드 403/404 를 무엇이 결정하나 |
| `part-1/07-kms-s3-cloudfront/theory.mdx` | CloudFront 심화 — 오리진 2개 분기, 캐시 정책 대 오리진 요청 정책, 쿼리스트링 전달, HTTP→HTTPS 리다이렉션, Lambda@Edge 와 CloudFront Functions 구분, presigned URL |
| `part-1/08-container-lambda-dynamodb/theory.mdx` | DynamoDB 심화 — 접근 패턴에서 키 설계로 가는 절차, GSI 선택 기준, 온디맨드 대 프로비저닝, 2024 `order`·2025 `product` 테이블 설계 사례 |
| `part-4/17-streaming/lab.mdx` 외 WAF 관련 | WAF SQLi 룰 직접 작성 실습(취약 Flask 앱 → 관리형 룰 → 커스텀 룰 → 403 확인) |
| `part-2` EKS 계열 | Calico NetworkPolicy, addon/app 노드그룹 분리와 taint, assume-role 기반 kubectl RBAC |

#### E. 3과제 이중화 (PART 5)

- `part-5/21-task3-deploy` · `22-task3-tuning` 은 유지하되 **EKS 경로**임을 명시한다.
- `part-5/32-task3-ecs` 신설 — 2025 실기출 기준. ECS on EC2(c5.large), 단일 엔드포인트,
  비정상 요청 403 / 미정의 경로 404, 비용 ratio 최적화, 스코어보드 임계값 사다리 대응.
- 두 경로의 공통부(SLO 측정, 인덱스 설계, 부하 대응)는 한 곳에 두고 양쪽에서 링크한다.

#### F. 자가채점 블록

각 신규·증보 실습 끝에 접이식 블록을 둔다. 형식은 `docs-style.md` 의 `<details class="build-step">`
규약을 따르되 실행 명령·기대 출력·안 나올 때 볼 곳 셋으로 제한한다. 원본 스크립트 전문은
`reference/past-exams.mdx` 에 두고 실습에서는 해당 항목만 발췌한다.

## 사이드바

`start` 와 `part-4`·`part-5` 는 디렉터리 자동생성이다. 신규 파일에 `sidebar.order` 를 이어서
부여하면 `astro.config.mjs` 수정 없이 붙는다. 모듈 번호는 27~32 로 이어 붙여 기존 01~26 을
건드리지 않는다.

## 검증

1. `npm run build` 가 통과한다 — `starlight-links-validator` 가 깨진 내부 링크를 잡는다.
2. 신규 `.mdx` 추가 후 dev 서버를 재시작한다(콘텐츠 컬렉션 갱신).
3. 인용한 채점 스크립트 명령이 원본과 문자 단위로 같은지 대조한다.
4. 각 신규 문서의 `> 문서 유형:` 줄이 Diátaxis 규약과 맞는지 확인한다.

## 범위 밖

- 국제대회(WorldSkills) 대응 재편. 이번 목표는 전국대회다.
- `skills-2026` 저장소 자체의 수정.
- 실제 AWS 리소스를 띄워 실습을 실행 검증하는 일 — 비용이 발생하고 사용자 계정이 필요하다.
