# 이론 문서 사실 검증 리포트

> **반영 완료(2026-08-02)** — 36건 전부 수정했다. 보류했던 §6 의 2건도 재검토 후 반영했다. 내역과 함께 손댄 추가 파일은 §8 에 정리했다. `npm run build` 통과, 내부 링크 검증 통과.


작성일 2026-08-02. 6개 에이전트가 도메인별로 분담해 `theory.mdx` 17개와 `start/` 기초 문서를 읽고, 각 주장을 AWS·Kubernetes·Terraform·Karpenter·KEDA 공식 문서와 대조했다.

- **범위** — `src/content/docs/**/theory.mdx` 전체 + `src/content/docs/start/*.mdx`. 총 약 9,100줄
- **제외** — `start/loadbalancer-basics.mdx` (요청에 따라 리뷰 대상에서 제외), `lab.mdx`·`index.mdx`·`reference/`
- **기준** — 문체·용어·한국어 문법은 보지 않았다. 사실관계만 본다. 공식 문서로 확인되지 않은 것은 보고하지 않았고, 판정이 갈린 2건은 맨 아래 "미결" 로 따로 뺐다
- **결과** — 36건. HIGH 3, MEDIUM 19, LOW 14

심각도 정의:

| | 뜻 |
|---|---|
| HIGH | 그대로 따르면 과제 풀이가 깨진다. 퀴즈 정답 키가 틀린 경우 포함 |
| MEDIUM | 결론은 살아 있으나 근거·수치·메커니즘이 틀렸다. 응용하면 깨진다 |
| LOW | 부정확하지만 실전 영향은 작다 |

---

## 1. HIGH — 먼저 고쳐야 할 3건

### 1-1. `start/k8s-basics.mdx:151, 159, 273, 275, 280` — 최근 커밋에서 고친 오류가 그대로 남아 있다

> `Ingress로 만든 ALB는 이름을 지정할 수 없어서 "ALB 이름 채점"을 통과 못 한다.` (159)
> `Ingress가 만드는 ALB는 이름을 지정할 수 없어 "ALB 이름 채점"을 통과할 수 없다.` (273, **퀴즈 정답으로 표시됨**)

AWS Load Balancer Controller 는 `alb.ingress.kubernetes.io/load-balancer-name` 애노테이션으로 ALB 이름을 지정할 수 있다(32자 이내). Ingress 로 **정할 수 없는 것은 타깃그룹 이름**이고, 컨트롤러가 `k8s-…` 형태로 자동 생성한다.

커밋 `143f351`·`a664cc6` 이 `loadbalancer-basics.mdx` 에서 바로 이 오류를 정정했는데 `k8s-basics.mdx` 는 갱신되지 않았다. `part-2/05-k8s-workloads-alb/theory.mdx:81`("ALB 이름은 … 애노테이션으로 맞출 수 있지만, 타깃그룹 이름은 지정할 수 없다") 과 정면으로 모순된다.

출처: https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/ingress/annotations/

### 1-2. `start/s3-basics.mdx:60, 204-208` — 퍼블릭 정책은 "저장되고 무시" 가 아니라 저장이 거부된다

> `BPA가 켜져 있으면 버킷 정책에 "Principal": "*" 를 써도 퍼블릭 접근은 성립하지 않는다. 정책이 틀린 것이 아니라 평가 이전 단계에서 잘린다 — 콘솔에 "퍼블릭 액세스 차단됨" 배지만 뜨고 정책 편집기는 아무 오류도 내지 않으므로 원인을 찾기 어렵다.` (60)

BPA 4개를 모두 켠 상태(본 문서와 part-1 모듈 02 가 요구하는 구성)에서는 `BlockPublicPolicy=true` 가 **`PutBucketPolicy` 호출 자체를 거부**한다. AWS 원문: *"Setting this option to `TRUE` for a bucket causes Amazon S3 to reject calls to `PutBucketPolicy` if the specified bucket policy allows public access."* 조건 없는 `Principal: "*"` 는 AWS 가 드는 "퍼블릭 정책" 의 대표 예시다. 저장은 AccessDenied 로 실패하고 콘솔에도 오류가 뜬다.

204행 퀴즈는 "정책은 저장되지만 퍼블릭 읽기는 차단된다" 를 정답으로, "정책 저장 자체가 거부되어 오류가 발생한다" 를 오답으로 표시하고 있다. **정답 키가 뒤집혀 있다.** "저장되고 무시" 동작은 `BlockPublicPolicy` 가 꺼져 있거나 이미 붙어 있던 정책에 `RestrictPublicBuckets` 가 작용할 때만 해당한다.

출처: https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html

### 1-3. `part-4/09-serverless-event/theory.mdx:87` — 퀴즈 빈칸 정답이 Python 이 내지 않는 값

> `처리 Lambda에서 평균을 sum/count로, 즉 파이썬 float로 계산했다. 483/5의 결과는 [[96.60000000000001]] 이 되어 기대값 96.6과 어긋난다.`

CPython 에서 `483/5` 는 정확히 `96.6` 이다. `repr(483/5) == '96.6'`, `483/5 == 96.6` 은 `True`. 양쪽 피연산자가 정확한 정수라서 IEEE-754 나눗셈이 한 번만 반올림되고, 그 결과가 `float('96.6')` 과 같은 double 이다. 실제 점수 리스트 `[100,95,88,100,100]` 로도 확인했다.

Decimal 을 써야 한다는 **결론은 유효하다.** 다만 진짜 이유는 boto3 가 float 를 거부하는 것이다 — `TypeError: Float types are not supported. Use Decimal types instead.` 부동소수점 논거는 근거가 없으니 걷어내고 boto3 제약으로 갈아끼워야 한다.

출처: https://docs.python.org/3/tutorial/floatingpoint.html

---

## 2. 여러 파일에 퍼진 오류

같은 주장이 복수 파일에 복사되어 있다. 한 곳만 고치면 모순이 생긴다.

### 2-1. float `96.60000000000001` — 4곳

| 경로 | 심각도 |
|---|---|
| `part-4/09-serverless-event/theory.mdx:87` | HIGH (퀴즈 정답) |
| `part-4/09-serverless-event/theory.mdx:53` | MEDIUM (note) |
| `part-4/09-serverless-event/theory.mdx:91` | MEDIUM (퀴즈 해설 (a)) |
| `part-1/03-container-lambda-dynamodb/theory.mdx:183` | MEDIUM |
| `part-1/03-container-lambda-dynamodb/theory.mdx:393` | MEDIUM (퀴즈) |

09:91 의 해설 (b)("boto3 가 float 를 거부한다")는 맞다. 그쪽만 남기면 된다.

### 2-2. ALB Lambda 통합 응답 필수 필드 — 2파일 4곳

> `statusCode/statusDescription/isBase64Encoded/headers/body 형식으로 응답해야 한다` (`part-1/03:200`)
> `반환 객체에 statusCode / statusDescription / body 가 모두 있어야 한다.` (`part-6/16:70`)

AWS 가 명시하는 필수 항목은 **Base64 인코딩 여부(`isBase64Encoded`)·상태 코드(`statusCode`)·헤더(`headers`)** 셋이다. *"You can omit the body."* — `body` 는 생략 가능하고 `statusDescription` 은 필수 목록에 없다(예시 페이로드에만 등장하며, 없으면 ALB 가 사유 문구를 채운다).

`part-6/16:63, 70` 은 필수가 아닌 두 필드를 필수라 하고 실제 필수인 두 필드를 빠뜨렸다 — 이쪽이 더 심하다(MEDIUM). `part-1/03:200, 287, 389` 는 넣어도 무해하므로 LOW.

출처: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/lambda-functions.html

### 2-3. KMS lockout safety check — 2파일 4곳

| 경로 | 심각도 |
|---|---|
| `start/kms-basics.mdx:111` | MEDIUM |
| `start/kms-basics.mdx:274` (퀴즈 해설) | MEDIUM |
| `part-1/02-kms-s3-cloudfront/theory.mdx:114` | MEDIUM |
| `part-1/02-kms-s3-cloudfront/theory.mdx:493` (퀴즈 정답) | MEDIUM |

> `AWS KMS는 키 정책을 갱신할 때 "이 정책을 적용하면 앞으로 이 키를 관리할 주체가 없어지는가"를 자동으로 검사한다. kms:PutKeyPolicy 나 kms:Create* 같은 핵심 관리 액션이 빠져 있으면 …`

검사 조건은 더 좁고 더 엄격하다. AWS 원문: *"The key policy must allow the calling principal to make a subsequent `PutKeyPolicy` request on the KMS key."*

- 대상 액션은 `kms:PutKeyPolicy` 하나뿐이다. `kms:Create*` 는 무관하다(키 정책에서 `kms:Create*` 는 `CreateAlias`/`CreateGrant` 만 덮고, `kms:CreateKey` 는 IAM 정책 전용)
- "유효한 관리 주체가 남는가" 가 아니라 **호출한 그 신원**에게 허용돼야 한다. 다른 관리자 ARN 에 줘도 실패한다

root 없이 배포하는 패턴에서 실무적으로 중요하다 — 관리 statement 에 들어가야 하는 것은 배포자 신원이다.

출처: https://docs.aws.amazon.com/kms/latest/APIReference/API_PutKeyPolicy.html

---

## 3. 2025~2026년 변경으로 낡은 서술

AWS 가 최근 기능을 내놓으면서 전제가 무너진 것들. 대회 환경 판단에 직접 영향이 있다.

### 3-1. `part-2/07-full-deploy-set02/theory.mdx:65, 210` | MEDIUM

> `ALB는 경로 재작성이 불가능하므로 CloudFront Function이 유일한 해법이고`

2025-10-15 부터 ALB 가 **URL·Host 헤더 재작성**을 정식 지원한다. 정규식 기반으로 타깃 전달 전 요청 URL 을 고치며, 전 상용 리전·추가 비용 없음. `POST /book → /v1/book` 은 오늘 ALB 리스너 규칙만으로 된다. CloudFront Function 도 여전히 유효한 해법이지만 "유일" 은 아니고, ALB 제약 서술이 낡았다.

출처: https://aws.amazon.com/about-aws/whats-new/2025/10/application-load-balancer-url-header-rewrite/

### 3-2. `part-3/08-private-eks-iam/theory.mdx:63, 254, 261` | MEDIUM

2026-07-27 EKS 가 클러스터 OIDC 디스커버리·JWKS 엔드포인트용 PrivateLink `com.amazonaws.<region>.oidc-eks` 를 출시했다. 출시 목적이 정확히 *"ensure correct DNS resolution when the EKS management VPC endpoint is enabled with private DNS"* 다. 즉 `eks` 엔드포인트 + private DNS 와 IRSA 는 더 이상 배타적이지 않다. 현재 문서는 "이 둘은 만들지 않는다 / fully private 여도 NAT 경유로 충분" 만 해법으로 제시한다.

출처: https://aws.amazon.com/about-aws/whats-new/2026/07/amazon-eks-oidc-endpoint-privatelink/

### 3-3. `part-1/03-container-lambda-dynamodb/theory.mdx:18, 296, 306` | MEDIUM

> `ECR Basic 스캔(Clair)이 아예 스캔하지 못한다`

ECR 기본 스캔은 더 이상 Clair 를 쓰지 않는다. 현재 문서: *"Amazon ECR basic scanning uses AWS native technology … sourcing more than 50 data feeds … NVD and MITRE."* **결론(scratch 이미지는 기본 스캔 불가, `UNSUPPORTED_IMAGE`)은 그대로 맞다.** 엔진 이름만 낡았다. 3곳 모두 `(Clair)` 를 떼면 된다.

출처: https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning-basic.html

---

## 4. 파일별 상세

### `start/vpc-basics.mdx` — 4건

| 위치 | 심각도 | 내용 |
|---|---|---|
| 118, 254 | MEDIUM | local 보다 구체적인 경로의 대상 제한 |
| 120, 258 | MEDIUM | local 경로 교체 가능 여부 |
| 127 | LOW | TGW CIDR 중복 시 동작 |
| 104 | LOW | 기본 보안 그룹 인바운드 |

**118, 254** — `10.0.5.0/24 → Transit GW` 예시가 실제로 만들 수 없는 라우팅 테이블이다. VPC CIDR 안쪽으로 local 보다 구체적인 경로를 넣으려면 두 조건을 만족해야 한다: 목적지가 서브넷 CIDR 전체와 일치할 것, 그리고 *"The target must be a NAT gateway, network interface, or Gateway Load Balancer endpoint."* Transit Gateway 는 허용 대상이 아니다. 최장 접두사 일치라는 **가르치려는 요점 자체는 맞으니** 대상만 NAT GW 나 ENI 로 바꾸면 된다.

**120, 258** — `local 경로는 … 지우거나 덮어쓸 수 없다` 는 절반만 맞다. 삭제는 불가하지만 **대상 교체는 지원되는 동작**이고 복원도 된다: `aws ec2 replace-route --destination-cidr-block 10.0.0.0/16 --network-interface-id eni-…`, 복원은 `--local-target`. 교체 가능한 대상은 ENI·NAT GW·GWLB 엔드포인트. 258행이 "불가능한 설계" 라고 못 박은 것이 바로 AWS 가 문서화한 미들박스 검사 패턴이다.

**127** — `양쪽 다 CIDR이 겹치면 연결할 수 없다`. 피어링은 연결 자체가 거부되지만 TGW 는 **어태치먼트가 성공하고 경로 전파만 막힌다**: *"If you attach a VPC … the routes for the newly attached VPC aren't propagated to the transit gateway route table."* 실무 결론(겹치면 안 통한다)은 살아 있다. 같은 뉘앙스가 `part-4/12-vpc-lattice/theory.mdx:45` 표에도 있다.

**104** — SG vs NACL 표의 기본값 행. NACL 칸이 "기본 NACL" 이라고 명시하니 SG 칸도 기본 보안 그룹으로 읽힌다. VPC 기본 보안 그룹은 **자기 자신을 소스로 하는 전체 허용 인바운드 규칙을 갖고 나온다.** "인바운드 전부 거부" 는 직접 만든 SG 에만 해당한다.

출처: [서브넷 라우팅 테이블](https://docs.aws.amazon.com/vpc/latest/userguide/subnet-route-tables.html), [local 경로 대상 교체](https://docs.aws.amazon.com/vpc/latest/userguide/replace-local-route-target.html), [TGW VPC 어태치먼트](https://docs.aws.amazon.com/vpc/latest/tgw/tgw-vpc-attachments.html), [기본 보안 그룹](https://docs.aws.amazon.com/vpc/latest/userguide/default-security-group.html)

### `start/iam-basics.mdx` — 2건

**60, 205, 217 | MEDIUM** — `두 정책 다 통과해야 AssumeRole이 성립한다: 신뢰 정책(문지기) + 호출자의 sts:AssumeRole 권한` / `한쪽만 있으면 실패한다`.

**교차 계정에서만 참이다.** 신뢰 정책은 리소스 기반 정책이라, 같은 계정 안에서 신뢰 정책이 호출자 IAM 사용자 ARN(또는 세션 ARN)을 직접 지정하면 호출자 신원 정책에 `sts:AssumeRole` 이 없어도 성립한다: *"If a resource-based policy grants permission directly to the IAM user or the session principal that is making the request, then an implicit deny in an identity-based policy … does not impact the final decision."* 신원 정책이 필요한 것은 신뢰 정책이 계정 주체(`:root`)만 지정한 경우다. **같은 파일 142행이 이미 올바르게 서술하고 있어 자기모순이다.**

**240-241 | MEDIUM** — 퀴즈 오답 해설 `ConfigMap은 정상 생성된다. 문제는 그 안에 root 신원만 매핑되어…`.

클러스터 생성 주체는 **`aws-auth` ConfigMap 에 기록되지 않는다.** EKS 가 컨트롤 플레인에서 암묵적으로 `system:masters` 를 부여한다: *"This principal doesn't appear in any visible configuration … This access cannot be removed and is not managed through the aws-auth ConfigMap."* 게다가 현재 클러스터 기본 인증 모드는 `API_AND_CONFIG_MAP` 이라 생성자는 부트스트랩 **액세스 엔트리**를 받는다. "신원 하나로 통일하라" 는 교훈은 유효하나 메커니즘 설명이 틀렸고, 생성자가 나중에 액세스 엔트리로 다른 IAM 사용자를 추가할 수 있다.

출처: [정책 평가 로직](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html), [K8s 액세스 부여](https://docs.aws.amazon.com/eks/latest/userguide/grant-k8s-access.html)

### `start/kms-basics.mdx` — 2건

lockout safety check 는 §2-3 참조.

**203-210 | LOW** — 예제가 깨져 있다. 암호화 단계는 `--query CiphertextBlob --output text` 로 base64 텍스트를 `cipher.b64` 에 쓰는데, 복호화 단계는 `--ciphertext-blob fileb://cipher.bin` 을 읽는다. 파일명이 다르고, 애초에 base64 파일에 `fileb://` 를 쓰면 실패한다. `base64 -d` 를 거치거나 `file://` 로 base64 문자열을 넘겨야 한다.

### `start/s3-basics.mdx` — 2건

BPA 는 §1-2 참조.

**137, 139, 239 | LOW** — OAI vs OAC 표.

> `| 서명 방식 | 특수 IAM 신원, SigV2 기반 | SigV4 서명, 서비스 주체 |`
> `| 지원 요청 | GET·HEAD 위주 | PUT·POST 등 전 메서드 |`
> `OAI는 SigV2 기반의 특수 IAM 신원이라 SSE-KMS 원본을 지원하지 않는다` (239)

AWS 는 OAI 를 SigV2 기반이라고 규정한 적이 없고, SigV4 전용 리전에서 OAI 가 동작한다고 문서화한다: *"`DELETE`, `GET`, `HEAD`, `OPTIONS`, and `PATCH` requests are supported without qualifications. `POST` requests are not supported."* OAI 의 실제 공백은 옵트인 리전 / 2023년 1월 이후 출범 리전, SSE-KMS, 동적 요청이지 서명 버전이 아니다. 반대편도 부정확하다 — OAC 의 동적 요청 지원은 `PUT`·`DELETE` 로 문서화돼 있지 "전 메서드" 가 아니다. **결론(SSE-KMS 면 OAC)은 맞고 근거만 틀렸다.**

출처: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html

### `start/eks-basics.mdx` — 1건

**133 | MEDIUM** — `노드당 파드 상한은 대략 (ENI 수 × ENI당 IP 수 - 1) 이다. t3.medium 은 ENI 3개 × IP 6개로 17개 남짓이고`.

AMI 기본 계산식은 `(ENI 수 × (ENI당 IP 수 − 1)) + 2` 다. *"The `+ 2` accounts for the Amazon VPC CNI and `kube-proxy` running on every node, which don't consume a Pod IP address."* 두 식은 ENI 가 정확히 3개일 때만 같은 값을 낸다 — 그래서 t3.medium 17 은 맞게 나오지만 다른 인스턴스로 옮기면 어긋난다(m5.4xlarge: 8×(30−1)+2 = 234, 8×30−1 = 239 가 아니다). **t3.medium 수치는 그대로 두고 식만 고치면 된다.**

출처: https://docs.aws.amazon.com/eks/latest/userguide/choosing-instance-type.html

### `start/k8s-basics.mdx` — 1건

§1-1 참조. 이 파일에서 다른 오류는 없다.

### `start/shell-basics.mdx` — 2건

**125 | MEDIUM** — `PowerShell 7에서도 curl 별칭은 그대로 살아 있다`.

**PowerShell Core 6.0 에서 `curl`·`wget` 별칭이 제거됐다.** PowerShell 7 에서 `curl` 은 진짜 `C:\Windows\System32\curl.exe` 로 해석된다. 별칭은 Windows PowerShell 5.1 에만 있다. 이 문서는 54행·133행에서 PS7 을 요구하면서 정작 5.1 전용 함정을 PS7 에도 적용되는 것처럼 가르친다. 52행·130행도 "5.1 한정" 단서가 필요하고, **125행은 단서 문제가 아니라 명백히 거짓이다.**

**79 | LOW** — `grep -n "contest" vpc.tf # 3곳 바뀌었는지 확인`. 71-76행 heredoc 이 만드는 파일에 `skills` 는 2곳(`"skills_vpc"`, `Name = "skills-vpc"`)뿐이다. 실행 확인 결과 `grep -on "skills"` 는 `1:skills`, `3:skills` 두 줄을 낸다. 주석의 3 을 2 로 고쳐야 한다. 검색어(`contest` vs `skills`)도 앞 단계 파일과 어긋난다.

출처: https://learn.microsoft.com/powershell/scripting/whats-new/differences-from-windows-powershell

### `start/hcl-basics.mdx` — 1건

**148 | MEDIUM** — 미니 실습 5단계의 `> var_is_public = true`.

`terraform console` 은 **식만 평가한다.** 변수 대입 문법이 없어서 이 줄을 그대로 치면 첫 줄부터 실패한다: `Error: Extra characters after expression / An expression was successfully parsed, but extra characters were found after it.` (Terraform v1.15.8 로 실행 확인.) 같은 문서의 나머지 console 예제 7개(`toset`, `for` 리스트·맵, `merge`, `lookup`, `jsonencode`, `regex`, 삼항, 보간)는 문서에 적힌 출력을 그대로 낸다.

출처: https://developer.hashicorp.com/terraform/cli/commands/console

### `start/autoscaling-basics.mdx` — 1건

**145 | LOW** — `consolidationPolicy` 설명에 `WhenEmpty`·`WhenEmptyOrUnderutilized` 둘만 있다. 현재 Karpenter(`karpenter.sh/v1`)는 **세 값**을 받는다 — `Balanced`(비용 절감이 중단 비용을 정당화할 때만 통합) 가 빠졌다. 적힌 두 개의 설명 자체는 맞다.

출처: https://karpenter.sh/docs/concepts/nodepools/

### `part-2/05-k8s-workloads-alb/theory.mdx` — 1건

**46, 259 | LOW** — `이후 SIGTERM, 최대 45초(terminationGracePeriodSeconds) 내 종료.` 를 `sleep 15` → `SIGTERM` 다음 단계로 나열한다.

**유예 기간 카운트다운은 preStop 훅보다 먼저 시작하고 preStop + 컨테이너 종료를 함께 덮는다**: *"The Pod's termination grace period countdown begins before the `PreStop` hook is executed… This grace period applies to the total time it takes for both the `PreStop` hook to execute and for the Container to stop normally."* `sleep 15` + 45초 유예면 SIGTERM 이후 남는 시간은 약 30초다. 순차 나열이 15 + 45 = 60초로 읽힌다. 같은 파일 261행의 규칙(`preStop sleep < terminationGracePeriodSeconds`)과 ALB 등록 해제 논거는 맞다 — **예산 산술만 어긋난다.**

출처: https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/

### `part-2/06-observability/theory.mdx` — 1건

**196 | LOW** — `알람은 PrometheusRule(PromQL)로 평가된다. Grafana datasource는 대시보드 조회용이지 Prometheus 룰의 입력이 아니다.`

뒷문장은 맞지만 "Grafana datasource 는 대시보드 조회용" 은 범주적으로 틀렸다. Grafana 관리형 알림 규칙은 CloudWatch·CloudWatch Logs Insights 를 포함해 어떤 데이터소스든 질의할 수 있다. **PrometheusRule 로 채점하는 과제에서 그 선택지가 오답인 것은 변함없으므로 정답 키는 유지**되고, 근거 문장만 과하다.

### `part-2/07-full-deploy-set02/theory.mdx` — 2건

ALB 경로 재작성은 §3-1 참조.

**147, 244, 246, 250, 252 | MEDIUM** — `VPC CloudShell은 인터넷이 없어 alpine 못 받으므로 불가`.

AWS 문서는 이 토폴로지에 대해 정반대로 말한다: *"VPC environments created in public subnets … will not have access to public internet, but private subnets configured with Network Address Translation (NAT) have access to public internet."* set-02 채점 환경은 `wskorea26-priv-subnet-d` 에 있고, `skills-2026/set-02/task-1/terraform/vpc.tf:80-91` 이 모든 프라이빗 서브넷에 `0.0.0.0/0` → NAT 게이트웨이 기본 경로를 준다. **그 VPC CloudShell 은 egress 가 있다.**

실제 VPC CloudShell 제약은 업로드/다운로드 UI 없음, `$HOME` 비영속, 20~30분 타임아웃이고 문서 다른 곳에는 이게 올바르게 적혀 있다. 실무 조언(표준 CloudShell 에서 빌드)은 무해하지만 **가르치는 이유와 퀴즈 논거 전체가 틀렸다.** 이 오류는 `set-02/task-1/README.md:103` 에서 상속된 것으로 보인다 — 원본도 같이 봐야 한다.

출처: https://docs.aws.amazon.com/cloudshell/latest/userguide/using-cshell-in-vpc.html

### `part-3/08-private-eks-iam/theory.mdx` — 3건

`oidc-eks` PrivateLink 는 §3-2 참조.

**63, 254, 261 | MEDIUM** — `eks / eks-auth Interface Endpoint를 private_dns_enabled로 만들면 PHZ가 OIDC/eks-auth 도메인 해석을 가로채 Pod Identity/IRSA가 깨진다`.

`eks` 쪽은 맞다(엔드포인트의 프라이빗 호스팅 존이 `eks.<region>.amazonaws.com` 을 잡으면서 `oidc.eks.<region>.amazonaws.com` 해석을 가린다). **`eks-auth` 쪽은 정반대다.** AWS 는 아웃바운드 인터넷이 없을 때 Pod Identity 에 `com.amazonaws.<region>.eks-auth` 를 **필수**로 문서화한다: *"Pods configured with EKS Pod Identity acquire credentials from the EKS Auth API. If there is no outbound internet access, you must create and use a VPC endpoint for the EKS Auth API."* 이 엔드포인트의 프라이빗 DNS 이름은 `eks-auth.<region>.api.aws` 라서 OIDC 도메인과 겹치지 않는다 — 가로챌 수가 없다.

**60, 261 | MEDIUM** — `"인터넷 미경유" 요구 시 s3/ecr.api/ecr.dkr 필수`.

그 셋은 **이미지 pull 만** 덮는다. 실제로 인터넷 없는 EKS 데이터 플레인에는 추가로 `sts`(IRSA 의 `AssumeRoleWithWebIdentity`), `oidc-eks`(IRSA/OIDC), `eks-auth`(Pod Identity), `ec2`(EKS 최적화 AMI 가 EC2 API 로 노드 DNS 이름을 설정), 그리고 워크로드별로 `logs`·`elasticloadbalancing`·`autoscaling`·`kms` 등이 필요하다. 261행대로 NAT 없는 클러스터를 구성하면 **IRSA 와 Pod Identity 가 죽는다.** (NAT 를 유지하는 set-03 설계에서는 무해하다.)

출처: https://docs.aws.amazon.com/eks/latest/userguide/private-clusters.html

### `part-4/09-serverless-event/theory.mdx`

§1-3, §2-1 참조. 그 외 사실 오류 없음. (기술 오류는 아니지만 §③ 번호 목록이 1 → 2 → note → 4 → 5 로 3번이 빠져 있다.)

### `part-1/03-container-lambda-dynamodb/theory.mdx`

§2-1(float), §2-2(ALB 응답), §3-3(ECR Clair) 참조.

확인 결과 **맞으므로 건드리지 말 것**: `alpine:3.24.1` 실재(3.24.0 2026-06-09, 3.24.1 2026-06-13 릴리스), Terraform `global_secondary_index { key_schema { … } }` 는 현행 문법이고 오히려 `hash_key`/`range_key` 가 deprecated, `attribute` 는 키 속성만 선언, `Decimal("483")/Decimal("5")` = 정확히 `96.6`, SSE-KMS 테이블 Query 에 `kms:Decrypt` 필요, ALB 가 쿼리 파라미터를 URL 디코딩하지 않는다는 서술.

### `part-4/11-documentdb/theory.mdx` — 1건

**60 | LOW** — `TLS도 선택이 아니라 기본이다. DocumentDB는 TLS 연결을 요구하고`.

기본값이지 강제가 아니다: *"By default, encryption in transit is enabled for newly created Amazon DocumentDB clusters. It can optionally be disabled when the cluster is created, or at a later time."* `tls` 클러스터 파라미터(`disabled,enabled,fips-140-3,tls1.2+,tls1.3+`)로 제어하며, 기본이 아닌 클러스터 파라미터 그룹과 인스턴스 재부팅이 필요하다. 실무 조언(`global-bundle.pem` 챙기기)에는 영향 없다.

출처: https://docs.aws.amazon.com/documentdb/latest/developerguide/security.encryption.ssl.html

### `part-4/10-scaling-logging-streaming/theory.mdx` — 1건

**50, 94 | LOW** — `HPA behavior scaleDown.stabilizationWindowSeconds: 15 + policies: Percent 100/15s(기본 300초 → 15초)가 한 쌍`.

`300 → 15` 는 **`stabilizationWindowSeconds` 에만 해당한다.** `scaleDown.policies` 기본값은 이미 `type: Percent, value: 100, periodSeconds: 15` 이고 300초 기본값은 어디에도 없다. 현재 표기는 괄호가 `Percent 100/15s` 에 붙어서, 그 정책을 쓰는 게 300초 기본에서 바꾸는 것처럼 읽힌다.

출처: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/#default-behavior

### `part-5/14-task3-load-ops/theory.mdx` — 2건

**106 | MEDIUM** — `1. metrics-server 스크레이프 + HPA 평가 주기 — 최대 15초`.

둘은 **직렬로 쌓이는 별개 주기**이고, upstream metrics-server 의 `--metric-resolution` 기본값은 15초가 아니라 **60초**다: *"Default 60 seconds, can be changed using `metric-resolution` flag. We are not recommending setting values below 15s…"* 흔히 설정하는 `--metric-resolution=15s` 를 쓰더라도 최악 탐지 시간은 메트릭 노후 + HPA 싱크로 약 30초다. 이 절이 계산하는 리드타임 사슬의 첫 고리를 과소평가하고 있다.

**117, 152-162 | LOW** — `T+60분에 트래픽이 스텝으로 들어오므로 스케일아웃은 즉시·공격적으로` 주석이 붙은 `scaleUp` 블록(`stabilizationWindowSeconds: 0`, `Percent 100/15s`, `Pods 4/15s`, `selectPolicy: Max`).

그 블록은 **Kubernetes `scaleUp` 기본값과 완전히 동일하다.** 명시해도 무해하지만 "공격적" 튜닝이 아니고 `behavior.scaleUp` 을 생략한 것 대비 속도 이득이 0이다. 이 매니페스트에서 실제 튜닝은 `scaleDown.stabilizationWindowSeconds: 120`(기본 300)과 `Percent 50/30s`(기본 `Percent 100/15s`) 뿐이다.

출처: [metrics-server FAQ](https://github.com/kubernetes-sigs/metrics-server/blob/master/FAQ.md), [HPA 기본 동작](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/#default-behavior)

### `part-6/16-break-fix/theory.mdx` — 1건

§2-2 참조. 부수 사항: 36행이 사이트 문서를 옛 파일명 `troubleshooting.md의 각 항목은` 으로 참조한다. 절대 링크 `/reference/troubleshooting/` 이어야 한다(프로젝트 링크 규칙).

---

## 5. 사실 오류가 없는 파일

아래는 검증 대상 주장을 모두 확인했고 오류를 찾지 못했다.

| 파일 | 확인한 주요 항목 |
|---|---|
| `part-1/01-terraform-vpc/theory.mdx` | `~> 6.54` 제약 해석, `default_tags` 병합, `aws_iam_policy_document`/`source_policy_documents`, `for_each` 가 리스트를 거부하고 `toset()` 이 해법인 점, `substr(v.az, -1, 1)` 음수 오프셋, `terraform output -raw` 단일 문자열 제약과 `-json <name>` 래퍼 차이 |
| `part-2/04-eksctl-cluster/theory.mdx` | `accessConfig.authenticationMode`, `autoModeConfig`, `disableDefaultAddons`, `privateCluster`, `secretsEncryption.keyARN`, `clusterLogging` 5종, `withOIDC`/`podIdentityAssociations`, `overrideBootstrapCommand`, `instanceName`, eksctl 이 metrics-server 를 기본 애드온으로 설치, 애드온 버전 생략 시 기본 버전 해석, `pods.eks.amazonaws.com` 신뢰 주체 |
| `part-4/13-cdn-function/theory.mdx` | CloudFront Functions vs Lambda@Edge 비교표 전 행. 값이 바뀐 항목까지 현행과 일치(뷰어 트리거 30초, 50MB), KVS 지원 여부, `connection-request` 가 mTLS 전용 네 번째 트리거인 점 |
| `part-6/15-mutation-drill/theory.mdx` | 대회 진행·`grep`/`sed` 방법론. 검증 가능한 AWS/K8s 주장 없음 |
| `part-6/17-mock-exam/theory.mdx` | 시험 운영 전략. 구체 수치가 세트 내부 값이라 대조 대상 아님 |
| `start/serverless-basics.mdx` | Lambda 비동기 재시도 2회(총 3회), ESM 폴링 모델과 실행 역할 권한, EventBridge 패턴 매칭 규칙(명명된 필드만 검사, 배열 OR, 중첩 일치, `anything-but`), 리소스 기반 정책 필요, Step Functions Standard/Express 차이, SQS 가시성 타임아웃·롱 폴링·FIFO 특성 |
| `start/docker-basics.mdx` | `RUN` vs `ENTRYPOINT`/`CMD` 시점, 레지스트리 한정 태그 없이 push 실패, `aws ecr get-login-password` 구문, `alpine:3.20`·`python:3.12-slim` 실재, 스캔 결과가 pull 을 막지 않는 점 |

부분 확인으로 맞다고 판정한 항목은 각 파일 절에 함께 적었다 — 고치지 말아야 할 것들이다.

---

## 6. 미결이었던 2건 — 이후 해소, 반영 완료

처음에는 판정이 갈려 보류했으나, 재검토 결과 **양쪽 다 현재 서술이 근거가 부족한 쪽**으로 결론이 났다. 둘 다 수정했다.

- **`max_connections`** — 계산식은 소개하되 `DBInstanceClassMemory` 가 예약 메모리를 뺀 값이라는 점을 명시하고, "85가 맞다"는 단정을 제거했다. 실제 값은 `SELECT @@max_connections;` 로 확인하도록 안내한다. 결론(소형 인스턴스는 연결 수가 빠듯하니 프록시로 끊는다)은 유지.
- **KEDA webhook** — 근거를 찾지 못한 "admission webhook 이 경고를 낸다" 문장만 걷어냈다. `minReplicaCount ≥ 1` 에서 1→N 을 HPA sync 주기가 담당하고 `pollingInterval` 의 효과는 주로 scale-to-zero 에서 나타난다는 핵심 동작 설명은 그대로 둔다. 같은 문장이 복사돼 있던 `part-4/10 lab.mdx:60` 과 본문 2곳도 함께 고쳤다.

아래는 보류 당시의 판단 근거다.

**`part-5/14-task3-load-ops/theory.mdx:271`** — `| db.t3.micro의 max_connections는 약 60 | 약 85 (MySQL 기본식은 메모리에서 파생) |`. `85` 는 `{DBInstanceClassMemory/12582880}` 을 1 GiB 전체에 그대로 대입한 값이고 서드파티 표 다수가 이 값을 싣는다. 그러나 AWS 는 `DBInstanceClassMemory` 가 작은 클래스에서 OS/RDS 예약분을 **차감**한다고 명시하고, db.t3.micro MySQL 실측 보고는 60~66 이 많다. 표가 정정하려는 "흔한 주장" 쪽이 오히려 맞을 수 있다. db.t3.micro 에서 `SHOW VARIABLES LIKE 'max_connections'` 로 확인이 필요하다. 결론("프록시로 끊는 것이 답")은 어느 쪽이든 유지된다.

**`part-4/10-scaling-logging-streaming/theory.mdx:50, 178, 186`** — `KEDA 2.20 webhook이 경고를 낸다`(`minReplicaCount ≥ 1` 일 때 `pollingInterval` 관련). **실질 주장은 맞다** — HPA 가 kube-controller-manager 싱크 주기로 1→N 을 담당하고 KEDA `pollingInterval` 은 0↔1 활성화만 관장한다. 다만 그 조합에 대해 admission webhook 이 경고를 낸다는 기록을 찾지 못했다(KEDA admission webhook 문서의 검증 목록에 없음). 동작 서술은 안전하고 "webhook 경고" 세부만 미확인이다.

---

## 7. 정리 — 착수 순서 제안

1. **§1 HIGH 3건** — 퀴즈 정답이 틀린 두 건(`s3-basics:204`, `09:87`)과 최근 커밋이 놓친 `k8s-basics` 5곳
2. **§2 교차 파일 오류 3묶음** — 한 곳만 고치면 문서 간 모순이 생기므로 묶어서 처리
3. **§3 최신화 3건** — ALB 경로 재작성, `oidc-eks` PrivateLink, ECR 스캔 엔진. 대회 판단 자체가 바뀌는 항목
4. 나머지 MEDIUM, 그다음 LOW
5. `part-2/07` 의 VPC CloudShell 오류는 `skills-2026/set-02/task-1/README.md:103` 에서 상속됐다. 원본도 함께 고칠지 판단 필요

---

## 8. 반영 내역 (2026-08-02)

미결 2건(§6)을 제외한 34건을 모두 반영했다. 수정하면서 **검증 범위 밖의 파일에도 같은 오류가 복사돼 있는 것**이 드러나 함께 고쳤다 — 이론만 고치면 실습·레퍼런스와 모순이 남기 때문이다.

### 검증 범위 안 (theory·start)

| 파일 | 반영 |
|---|---|
| `start/k8s-basics.mdx` | ALB/타깃그룹 이름 서술 5곳 정정. 퀴즈 정답·오답 근거·해설 재작성, 오답 하나를 "둘 다 못 정한다"로 교체해 실제 오개념을 짚게 함 |
| `start/s3-basics.mdx` | BPA 를 쓰기 시점(`BlockPublicPolicy`)·요청 시점(`RestrictPublicBuckets`) 둘로 분리 서술. 퀴즈 정답 키 교정. OAI/OAC 표에서 SigV2 근거 제거하고 실제 제약(옵트인 리전·`POST` 미지원·동적 요청 범위)으로 교체 |
| `part-4/09-serverless-event/theory.mdx` | 퀴즈를 `[[TypeError]]` 빈칸으로 재작성하고 "float 로도 `96.6` 이 맞다"를 명시. note 정정. `③` 목록 번호 누락(3번) 수정 |
| `part-1/03-container-lambda-dynamodb/theory.mdx` | float 서술 2곳, ECR 스캔 엔진 3곳(`(Clair)` 제거 + `UNSUPPORTED_IMAGE` 명시), ALB 응답 필수 필드 3곳 |
| `start/kms-basics.mdx` | lockout safety check 를 "호출 신원 본인의 후속 `PutKeyPolicy`" 로 정정(본문·퀴즈·증상표). `cipher.b64` → `fileb://cipher.bin` 예제에 `base64 -d` 추가 |
| `part-1/02-kms-s3-cloudfront/theory.mdx` | lockout 서술 2곳 + 판단 도식 노드 |
| `part-2/07-full-deploy-set02/theory.mdx` | ALB 경로 재작성 지원(2025-10) 반영하고 CloudFront Function 을 "유일한 해법"이 아니라 선택 근거와 함께 서술. VPC CloudShell 퀴즈를 "인터넷 부재" → "홈 비영속·업로드 불가" 로 재작성하고 NAT 오해를 오답 근거로 편입 |
| `part-3/08-private-eks-iam/theory.mdx` | `eks` 와 `eks-auth` 를 분리(후자는 Pod Identity 필수), `oidc-eks` PrivateLink(2026-07) 추가, 인터넷 미경유 엔드포인트 목록에 `sts`·`oidc-eks`·`eks-auth`·`ec2` 보강. 도식 라벨·퀴즈 전면 개정 |
| `start/vpc-basics.mdx` | local 보다 구체적인 경로의 대상 제한 명시(예시를 Transit GW → NAT GW 로 교체, 퀴즈 포함), local 경로 대상 교체 가능 서술, TGW CIDR 중복 시 동작 구분, 기본 SG 인바운드 단서 |
| `start/iam-basics.mdx` | AssumeRole 이중 평가를 교차 계정 한정으로 정정(본문·증상표·퀴즈 해설), 클러스터 생성자와 `aws-auth` 관계 정정 |
| `start/eks-basics.mdx` | maxPods 공식을 `(ENI × (IP−1)) + 2` 로 교정하고 `+2` 의 의미 명시 |
| `start/shell-basics.mdx` | `curl` 별칭을 PowerShell 5.1 한정으로 한정(퀴즈 문항·오답 근거·해설·상단 함정 목록), `grep` 주석 3곳 → 2곳 |
| `start/hcl-basics.mdx` | `terraform console` 대입문 예제 삭제, "식만 평가한다" 단서 추가 |
| `start/autoscaling-basics.mdx` | `consolidationPolicy` 에 `Balanced` 추가 |
| `part-2/05-k8s-workloads-alb/theory.mdx` | 유예 기간이 preStop 부터 카운트된다는 점과 SIGTERM 이후 실제 몫(약 30초) 명시 |
| `part-2/06-observability/theory.mdx` | Grafana datasource 오답 근거를 "대시보드 전용" → "이 과제의 채점 대상이 PrometheusRule" 로 교정 |
| `part-4/10-scaling-logging-streaming/theory.mdx` | `기본 300 → 15` 가 `stabilizationWindowSeconds` 에만 걸리도록 문장 분리(2곳) |
| `part-4/11-documentdb/theory.mdx` | TLS 를 "요구" → "새 클러스터 기본값(파라미터로 해제 가능)" |
| `part-5/14-task3-load-ops/theory.mdx` | metrics-server 기본 60초·직렬 누적·최악 30초로 교정(본문·도식), `scaleUp` 블록이 기본값과 동일함을 명시하고 실제 튜닝 지점 정리 |
| `part-4/12-vpc-lattice/theory.mdx` | TGW CIDR 중복 행에 "어태치먼트는 되나 경로 미전파" 단서 |
| `part-6/16-break-fix/theory.mdx` | ALB 응답 필수 필드 2곳. 부수로 `troubleshooting.md` 산문 참조를 절대 링크로 교체 |

### 검증 범위 밖이지만 같은 오류라 함께 고친 파일

| 파일 | 반영 |
|---|---|
| `reference/troubleshooting.mdx` | ALB 502 원인의 필수 필드, "숫자가 96.60000000000001" 항목을 `TypeError` 항목으로 교체 |
| `part-1/03-container-lambda-dynamodb/lab.mdx` | 응답 필수 필드, float 함정 행, `statusDescription 누락` 함정 행 |
| `part-1/02-kms-s3-cloudfront/lab.mdx` | lockout 통과 조건을 `kms:Put*` 로 |
| `part-2/07-full-deploy-set02/lab.mdx` | VPC CloudShell 제약 사유 |
| `part-4/09-serverless-event/lab.mdx` | 기대 출력 주석과 함정 목록의 float 서술 |
| `part-6/16-break-fix/lab.mdx` | 드릴 ⑨ 의 주입 결함을 `statusDescription` 제거 → **`statusCode` 제거**로 변경. 기존 결함으로는 502 가 재현되지 않는다 |

### 2차 반영 (§6 해소분 + 구조 정리)

| 파일 | 반영 |
|---|---|
| `part-5/14-task3-load-ops/theory.mdx` | `max_connections` 행을 뒤집었다 — "85" 를 흔한 주장 쪽으로 옮기고, `DBInstanceClassMemory` 가 예약분을 뺀 값이라는 점과 실측 60~66, `SELECT @@max_connections;` 확인법을 실제 쪽에 넣었다 |
| `part-4/10-scaling-logging-streaming/theory.mdx` · `lab.mdx` | "KEDA webhook 경고" 서술 3곳 제거. `minReplicaCount ≥ 1` 에서는 HPA sync 주기가 감지 속도를 정하고 `pollingInterval` 은 scale-to-zero 에서 의미를 갖는다는 서술로 대체 |
| `start/s3-basics.mdx` | ⑤ 심화 중 퀴즈에 없던 주제 4문항 추가(스토리지 클래스 최소 보관·128KB, 버전 관리 버킷 수명 주기, 이벤트 알림 at-least-once, 복제 규칙 이후 객체만). OAC 를 정의 없이 정책부터 보여주던 순서를 고쳐 ③ 정의 → ④ 정책 → ⑤ 구조·OAI 비교로 이었다 |

### 손대지 않은 것

- `skills-2026/set-02/task-1/README.md:103` — 레포 밖 원본. VPC CloudShell 오류의 출처지만 이번 작업 범위 밖이다

### 확인

```
npm run check:icons   # 아이콘 59종 전부 목록에 있음
npm run build         # 79 page(s) built, All internal links are valid
```
