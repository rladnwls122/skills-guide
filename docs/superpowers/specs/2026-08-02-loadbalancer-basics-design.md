# 선수 학습 문서 신설 — 로드밸런서 기초

- 날짜: 2026-08-02
- 대상 파일: `src/content/docs/start/loadbalancer-basics.mdx` (신설)
- 연쇄 수정: `start/eks-basics.mdx`, `start/index.mdx`, `part-2/05-k8s-workloads-alb/index.mdx`

## 왜 만드나

레포 전체가 ALB·타깃그룹·리스너·Ingress·TargetGroupBinding 을 계속 쓰는데, 그 용어를
정의하는 곳이 없다. 등장 횟수는 ALB 277, Service 196, Ingress 45, Target Group 35,
TargetGroupBinding 35, Listener 28, NLB 11 이다.

이미 있는 서술은 셋뿐이고 전부 부분적이다.

| 위치 | 다루는 것 | 빠진 것 |
|---|---|---|
| `start/k8s-basics.mdx` §2-3 | Service 타입 4종 표, CoreDNS | Ingress 는 "개념만 알아두면 됨" 한 줄 |
| `start/eks-basics.mdx` §트래픽이 들어오는 경로 | 사용자→ALB→Service→Pod 도식, LBC 가 ALB 를 만든다, instance/ip 2줄 | ALB 내부 구조, 헬스체크 |
| `part-2/05 theory` §3·4 | LBC + TargetGroupBinding, 리스너 규칙 실측 | 선행 개념 없이 바로 채점 패턴부터 |

빠진 것 다섯:

1. ALB 내부 구조 — 리스너·규칙·타깃그룹·타깃의 계층 관계
2. 헬스체크 — 경로·간격·임계, 상태값, unhealthy 원인 추적
3. `target_type` instance vs ip 를 ALB 관점에서
4. ALB vs NLB
5. Ingress 를 쓰면 무엇이 자동 생성되는가 — TGB 로 우회하는 이유의 전제

`part-4/12` Lattice 문서는 Service Network→Service→Listener→Target Group 4계층을 풀어
놓았는데 정작 같은 어휘를 쓰는 ALB 쪽이 비어 있다.

## 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| 독자 | 선수 학습용 — `start/*` 계열 | 학습 순서에 편입해야 PART-2 진입 전에 읽힌다 |
| 수준 | **ALB 를 처음 접하는 독자** | 개념 문서가 채점 문맥부터 시작하면 진입이 막힌다 |
| 범위 | ALB 중심, NLB 는 대비 표 한 절 | 후보 세트 1과제가 전부 ALB |
| 기존 중복 | 새 문서가 정본, `eks-basics` 는 도식 + 링크로 축약 | 한 개념 한 곳 원칙과 읽기 흐름의 절충 |
| 실습 | 콘솔 생성 + CLI 조회 + 삭제를 한 실습에서 | 만든 것을 그 자리에서 읽어야 CLI 훈련이 성립 |
| 진입 순서 | 바깥 → 안 | `vpc-basics`·`eks-basics` 와 같은 방식 |

## 문서 구조

유형은 `explanation`. `start/*` 규약을 따른다 — `①~⑦` 번호 절, 심화가 자기 점검 퀴즈보다 앞.

### ① 학습 목표

체크박스 5개. ALB 4계층 설명, 헬스체크 상태 해석, instance/ip 판단, ALB/NLB 구분,
Ingress 와 TargetGroupBinding 중 선택.

### ② 핵심 개념 — 처음 접하는 독자 기준

Terraform·k8s 를 몰라도 2-0~2-4 가 읽혀야 한다.

| 절 | 내용 |
|---|---|
| 2-0 | 로드밸런서가 왜 있나. 서버 1대는 죽으면 끝이고, 늘려도 사용자가 어디로 갈지 모른다. 앞에 한 대를 세워 나눠 준다. 3문장 + 도식 |
| 2-1 | ALB 4계층. 서버 2대에 HTTP 를 나눠 주는 최소 구성으로 리스너·규칙·타깃그룹·타깃을 하나씩 도입. 규칙은 priority 오름차순 평가, 첫 매치에서 종료, 아무것도 안 걸리면 기본 액션 |
| 2-2 | 헬스체크. "죽은 서버로 안 보내려면 살았는지 계속 물어야 한다"에서 출발. 경로·간격·임계 → 상태 4종(`initial`·`healthy`·`unhealthy`·`draining`) 표 |
| 2-3 | 타깃이 무엇이 되나. EC2 인스턴스 / IP / Lambda. `target_type` instance 와 ip 의 차이를 여기서 도입 |
| 2-4 | ALB vs NLB 대비 표. L7/L4, 헤더·경로 라우팅 유무, 고정 IP |

### ③ 대회에서 어떻게 쓰이나

개념이 선 뒤에 채점 문맥을 붙인다. 근거는 `part-2/05 theory` §4 실측이다.

- CloudFront→ALB 오리진, 리스너 기본 액션 `fixed-response 403` 으로 미경유 차단
- `X-Origin-Verify` 헤더 검증 규칙 2개, mark 7-2 가 `describe-rules` 출력 줄 수를 본다
- Lambda 타깃 3종 세트 — `aws_lb_target_group`(`target_type="lambda"`) + `aws_lambda_permission` + `aws_lb_target_group_attachment`. permission 없이 attach 하면 실패
- 이름 정확 일치 채점

이 절부터 `vpc-basics` 의 서브넷·보안 그룹을 전제한다. 문서 상단에 명시한다.

### ④ 미니 실습 — 콘솔 30분

과금 경고를 절 머리에 둔다. ALB 는 시간당 과금이고 30분이면 센트 단위지만 삭제하지
않으면 계속 붙는다. 단가는 "약"으로 표기한다.

1. Lambda 함수 하나 생성 (`return {"statusCode":200,"body":"ok"}`). EC2 없이 타깃을 만들기 위함
2. 콘솔에서 TG 생성(타깃 유형 Lambda), ALB 생성(리스너 :80, 기본 액션은 그 TG)
3. `curl http://<ALB-DNS>/` → 200 확인
4. 규칙 추가 — 경로 `/admin` 은 `fixed-response 403`. priority 로 평가 순서를 체감
5. CLI 읽기 훈련 — `describe-load-balancers` / `describe-target-groups` / `describe-rules` / `describe-target-health`. mark 스크립트가 뽑는 필드(`LoadBalancerName`, `HttpHeaderConfig.Values[]`, `TargetHealth.State`)를 짚는다
6. unhealthy 재현 — Lambda 를 500 반환으로 바꿔 `describe-target-health` 가 `unhealthy` 로 넘어가는 것을 보고, 되돌려 `healthy` 복귀 확인
7. 삭제 — ALB → TG → Lambda 순, 확인 명령까지

### ⑤ 심화 — 자동으로 만들 것인가, 이미 있는 것에 붙일 것인가

k8s 를 모르는 독자를 위해 용어를 첫 등장에서 한 줄씩 붙인다. 컨트롤러는 클러스터 안에서
상태를 지켜보다 AWS API 를 대신 부르는 프로그램이고, Ingress 는 HTTP 라우팅 규칙을 적는
k8s 객체다. 깊은 설명은 `k8s-basics`·`eks-basics` 링크로 넘긴다.

| 절 | 내용 |
|---|---|
| 5-1 | 문제 상황. ALB 를 사람이 콘솔에서 만들면 앱을 새로 띄울 때마다 손이 간다. 자동화 방법이 둘이고 만드는 주체가 다르다 |
| 5-2 | 길 A — 선언하면 알아서 만든다(Ingress). 컨트롤러가 ALB·리스너·규칙·타깃그룹을 통째로 만든다. 대신 이름을 지정할 수 없다 |
| 5-3 | 길 B — 내가 만들고 등록만 맡긴다(TargetGroupBinding). ALB·TG 는 Terraform 으로 이름을 박아 만들고, 바뀌는 타깃 목록만 컨트롤러가 채운다 |
| 5-4 | 왜 대회는 B 인가. 채점이 `wskorea26-book-alb` 같은 이름을 문자열로 대조한다. A 는 이름을 못 정하니 그 항목이 0점이다 |
| 5-5 | 판단 표 — 이름 제약 유무, 리소스 소유 주체, 바뀌는 것 |

### ⑥ 자기 점검 퀴즈

4문항. 규칙 priority 평가 순서 / unhealthy 원인 추적(probe 경로 불일치) / instance 와 ip
선택 / Ingress 로는 할 수 없는 것.

### ⑦ 다음 단계

PART-2 모듈 05 로 잇는다.

## 근거 출처

새로 지어내는 사실 없이 레포에 흩어진 실측을 모은다.

| 내용 | 출처 |
|---|---|
| 리스너·규칙·TG 계층, priority 평가, 기본 액션 403 | `part-2/05 theory` §4 도식 |
| Lambda 타깃 3종 세트 | `part-2/05 theory` §4 |
| `target_type=ip`, health_check path `/health`, readinessProbe 정렬 | `part-2/05 theory` §3·4 |
| `interval 10s × healthy_threshold 2` ≈ 20~30초 | `part-5/14 theory` §스케일 사슬 |
| draining, `deregistration_delay`, preStop 정렬 | `part-5/14 lab` 튜닝 노브 표 |
| probe 경로 오타 → TG unhealthy → ALB 5xx | `part-6/16 lab` 고장 주입 ① |
| instance vs ip, VPC CNI, Fargate 는 ip 만 | `start/eks-basics` |
| ALB vs NLB | **레포 근거 없음.** AWS 공식 문서 기준 일반 사실만 쓰고, 후보 세트 실측이 아님을 문서에 명시 |

## 연쇄 수정

| 파일 | 변경 |
|---|---|
| `start/eks-basics.mdx` | §트래픽이 들어오는 경로에서 도식과 Service 타입 표만 남긴다. ALB 내부·instance/ip 상세·Ingress 진단 3단계는 새 문서로 링크. EKS 고유(서브넷 태그 `kubernetes.io/role/elb`, VPC CNI 가 ip 모드를 가능케 하는 이유)는 유지 |
| `start/index.mdx` | CardGrid 카드 1장, 자가진단 항목 1개 추가 |
| `part-2/05-k8s-workloads-alb/index.mdx` | "선행 지식"에 새 문서 링크 추가 |

## 표기 규약

`src/content/docs/reference/style.mdx` 를 따른다.

- 본문 첫 줄에 `> 문서 유형: explanation`
- H1 을 쓰지 않는다. frontmatter `title` 이 제목이다
- 도식은 `<br/>` 줄바꿈, AWS 노드는 아이콘 셰이프(`logos:aws-elb` 등), k8s 리소스는 `k8s:*`
- 방향성 표현·비유·마케팅 형용사 금지. 순차 절차는 번호 목록

## 검증

- `npm run build` — 78+1 페이지, 내부 링크 전량 유효
- `npm run check:icons` — 목록에 없는 아이콘이 있으면 빌드는 통과하고 노드만 조용히 깨진다
- 새 `.mdx` 를 추가하면 콘텐츠 컬렉션이 갱신되지 않아 404 가 난다. dev 서버는 `npx astro dev stop` 후 재시작

## 범위 밖

- NLB 를 대등하게 다루는 것
- VPC Lattice 와의 어휘 대응 — `part-4/12` 가 이미 다룬다
- CLB
- ECS 의 ALB 연동 — `reference/ecs-fallback.mdx` 가 다룬다
