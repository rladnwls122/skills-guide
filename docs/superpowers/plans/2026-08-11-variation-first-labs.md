# 변동 대응 실습 전환 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PART-1·2·4 의 `lab.mdx` 12편을 "완성된 과제 재현"에서 "변동된 요구를 읽고 기존 구성을 고치는 훈련"으로 재작성한다.

**Architecture:** 각 모듈의 `lab.mdx` 는 기준 세트(대부분 set-02)의 구성이 이미 서 있다고 전제하고, 다른 후보 세트의 스펙 차이를 변동 과제지로 제시한 뒤 학습자가 직접 이행하게 한다. 기초 구축 절차는 정답지 레포 런북 링크로 대체한다. 통과 판정은 배포 없이 `grep` 잔존 검사와 `terraform plan` 으로 한다.

**Tech Stack:** Astro Starlight (`@astrojs/starlight` 0.41), MDX, `starlight-links-validator`, Node(mise 고정). 근거 자료는 레포 밖 `~/skills-2026`.

## Global Constraints

- **대상 12편**: `part-1/01-terraform-vpc` · `part-1/02-kms-s3-cloudfront` · `part-1/03-container-lambda-dynamodb` · `part-2/04-eksctl-cluster` · `part-2/05-k8s-workloads-alb` · `part-2/06-observability` · `part-2/07-full-deploy-set02` · `part-4/09-serverless-event` · `part-4/10-scaling-logging-streaming` · `part-4/11-documentdb` · `part-4/12-vpc-lattice` · `part-4/13-cdn-function` 의 `lab.mdx`.
- **`theory.mdx` 는 어떤 태스크에서도 수정하지 않는다.** 원리와 채점 관점은 그대로 유효하다.
- **새 `.mdx` 파일을 만들지 않는다.** 기존 파일 재작성만 하므로 `npm run dev` 재시작이 필요 없다. 만약 파일을 추가하게 되면 `npx astro dev stop` 후 재시작해야 404 가 나지 않는다.
- **콘텐츠는 CRLF 다.** 스크립트로 `.mdx` 를 파싱하면 `\r` 부터 지운다.
- **frontmatter·import 다음 본문 첫 줄에 `> 문서 유형: tutorial` 을 둔다.** 12편 전부 `tutorial` 을 유지한다.
- **본문에 H1 을 쓰지 않는다.** Starlight 가 frontmatter 의 `title` 을 제목으로 렌더한다.
- **명령 블록은 `<Tabs syncKey="shell">` 로 PowerShell·Bash 두 탭을 준다.** 기존 lab 의 방식을 그대로 따른다.
- **사이트 문서 참조는 절대 경로 링크로 쓴다** (`/part-1/01-terraform-vpc/theory/`). 산문 속 파일명은 링크 검증기가 잡지 못한다.
- **홑물결 취소선이 꺼져 있다.** `D4~7` 같은 범위 표기를 그대로 써도 된다.
- **정답지 경로는 `~/skills-2026`**, 원격은 `https://github.com/ishs-cloud-computing/skills-2026`. 학습자는 Day 0 에서 홈 디렉터리 아래에 클론한다.
- **set-05 는 정답의 근거가 아니라 변동 소재로만 쓴다.** 모듈 10·12 의 해당 절에 이 문장을 그대로 넣는다 — "후보 밖 세트에서 가져온 변동 소재다. 이 스펙 자체가 출제된다는 뜻이 아니라 추가 모듈이 이런 모양으로 온다는 뜻이다."
- **커밋 메시지는 한국어**로 쓰고 본문에 무엇을 왜 바꿨는지 남긴다.
- **각 태스크의 "변동 사실" 표를 정답지 코드로 대조한 뒤에 쓴다.** 표는 과제지 산문에서 뽑은 것이고, **산문 한 줄만 읽고 추론한 항목이 실제로 틀린 적이 있다.** Task 1 의 "NAT 삭제"가 그랬다 — 과제지 66행만 보고 판단했는데 68행이 정반대를 말하고 정답 코드에도 NAT 3개가 있었다. 어긋나면 **실측을 따르고 보고서에 남긴다.** 표를 그대로 믿고 쓰지 않는다.
- **`grep` 잔존 패턴은 양쪽으로 검증한다.** 기준본 코드에서 여러 건이 잡히고 타깃 정답 코드에서 0건이 나와야 쓸 수 있는 패턴이다. 한쪽만 확인하면 학습자가 영원히 통과하지 못하는 기준을 준다.
- **검증 명령은 `npm run build`** 다. `starlight-links-validator` 가 빌드에 물려 있어 끊긴 링크를 여기서 잡는다. mise 셸 통합이 없으면 `mise exec -- npm run build`.

### 공통 골격 — 12편이 모두 따르는 `lab.mdx` 구조

모든 모듈 태스크가 이 골격을 쓴다. 절 제목과 순서를 바꾸지 않는다.

```markdown
---
title: NN. <주제> — 변동 이행 실습
description: "<기준 세트> 구성을 <타깃 세트> 요구로 이행하고 grep·plan 으로 판정하는 실습."
sidebar:
  order: 3
---

import { Tabs, TabItem, Steps } from '@astrojs/starlight/components';

> 문서 유형: tutorial

원리와 채점 관점은 [NN 이론 — <제목>](/part-X/NN-slug/theory/)에 있다.

**방식**: <기준 세트> 구성이 서 있는 상태에서 시작한다. 아래 변동 과제지를 읽고 **절차 안내 없이 직접** 고친 뒤, 통과 기준으로 스스로 판정한다. 막히면 실전 참조를 연다.

## 실습 목표

- [ ] <변동 항목 1>을 반영한다
- [ ] <변동 항목 2>를 반영한다
- [ ] 옛 값 `grep` 잔존 0건을 만든다
- [ ] `terraform plan` 의 리소스 개수·이름이 변동 스펙과 일치한다

선행 지식과 목표는 [모듈 개요](/part-X/NN-slug/)에.

:::note[실전 참조 — 막히면 여는 곳]
<모듈별로 다시 씀. 기존 lab 의 같은 블록을 변동 주제에 맞게 갱신한다>
- 찾는 법 자체가 막히면 [실전 문서 검색 가이드](/reference/search-guide/)
:::

## 0. 기준본 세우기

<기준 세트> 구성이 필요하다. 절차는 정답지 레포 런북에 있다 — [<경로>](https://github.com/ishs-cloud-computing/skills-2026/blob/main/<경로>).

<선 상태 확인 명령 한 블록>

:::tip[코드만 있어도 된다]
이 실습의 통과 기준은 `plan` 까지다. 배포하지 않고 정답지 코드를 작업 사본으로 복사한 상태에서 시작해도 3절까지 전부 판정된다.
:::

## 1. 변동 과제지

<타깃 세트> 요구다. **정답 코드를 먼저 열지 않는다.**

<차이표 — 항목 / 기준본 / 변동>

<표로 안 담기는 제약은 산문 2~4문장>

## 2. 이행 (타이머 NN분)

타이머를 걸고 시작한다. 아래는 절차가 아니라 **놓치기 쉬운 자리 목록**이다.

<숨는 곳 체크리스트 — 모듈별>

## 3. 통과 기준

<Steps>
1. **잔존 검사** — <옛 값 목록>에 대해 `grep` 이 0건
2. **`terraform validate` + `plan`** — <기대 리소스 개수·이름>
3. **채점 항목 대응표** — <타깃 세트 mark.md> 를 열고 표를 직접 채운다
</Steps>

<대응표 빈 표 + <details> 안에 정답>

## 4. 복기

<타깃 세트 정답 경로>와 diff 한다. 놓친 것을 세 갈래로 분류한다 — 값만 바뀐 것 / 구조가 바뀐 것 / 새로 생긴 요구.

## 5. 배포 확인 (선택)

여유가 있을 때만. <타깃 세트 mark.sh 또는 검증 명령>.

<비용 경고 — NAT·EKS 가 걸리는 모듈만>
```

---

### Task 1: 모듈 01 재작성 — 형식 기준본

**Files:**
- Modify: `src/content/docs/part-1/01-terraform-vpc/lab.mdx` (419줄, 전면 재작성)

**Interfaces:**
- Consumes: 없음. 첫 태스크다.
- Produces: 12편이 따를 확정 골격. 이후 태스크는 이 파일을 형식 참조로 연다.

**변동 사실 (실측 완료 — 다시 조사하지 않아도 된다):**

| 항목 | set-02 (기준본) | set-07 (변동 타깃) |
|---|---|---|
| VPC CIDR | `172.16.0.0/16` | `10.97.0.0/16` |
| VPC 이름 | `wskorea26-*` 접두어 | `unicorn-vpc` |
| AZ | 2개 (c, d) | **3개 (a, b, c)** |
| 서브넷 수 | 4개 (pub 2 + priv 2) | **6개 (pub 3 + priv 3)** |
| 서브넷 이름 | `wskorea26-pub-subnet-c` 식으로 전부 나열 | `unicorn-subnet-{pub,priv}-{a,b,c}` — **중괄호를 선수가 전개** |
| 서브넷 CIDR | 표로 지급 (`172.16.1.0/24`, `172.16.201.0/24` …) | **규칙만 지급** — 마스크 24bit, Zero Subnet 허용, "Public 이 0·1·2번째, Private 이 10·11·12번째" |
| NAT | 2개 + EIP 2개 | **AZ 별 3개** — `unicorn-nat-{a,b,c}`. 라우팅 테이블도 `unicorn-rt-priv-{a,b,c}` 로 분리 |
| VPC Endpoint | 없음 | **신설** — "App 서브넷은 이미지 다운로드·로그/메트릭 export 시 외부 인터넷을 경유하지 않아야 한다". S3 Gateway + ECR api·dkr + Logs Interface |
| Flow Log | 없음 | **신설** |
| 채점용 접근 | — | Private Subnet 에 `unicorn-mark` 이름의 CloudShell VPC Environment |

set-07 과제지 원문 근거: `~/skills-2026/set-07/task-1/task.md` 의 53·57·63·65·66·**68·69**행.

:::danger[NAT 는 없어지지 않는다]
계획 초안은 66행("외부 인터넷을 경유하지 않아야 한다")만 읽고 "NAT 삭제"로 적었다. **틀렸다.** 바로 다음 68행이 "Private 은 AZ별 `unicorn-nat-{a,b,c}` 로 인터넷에 접근하며"라고 명시하고, 정답 코드 `terraform/vpc.tf` 72~83행에 NAT 3개와 EIP 3개가 있다. 66행은 NAT 제거 요구가 아니라 **VPC Endpoint 추가 요구**다.

변동 강도는 오히려 커졌다 — Endpoint 와 Flow Log 는 기준본에 블록 자체가 없는 "새로 생긴 요구"다.
:::

- [ ] **Step 1: 기준 SHA 를 기록하고 현재 파일에서 살릴 것을 추린다**

Run: `git rev-parse HEAD` — 이 값을 Task 16 Step 4 에서 쓴다. 계획 문서 하단에 적어 둔다.

`src/content/docs/part-1/01-terraform-vpc/lab.mdx` 를 읽고 아래 셋만 남긴다. 나머지 절차 본문은 버린다.

- `:::note[실전 참조 — 막히면 여는 곳]` 블록 (Terraform Registry 링크 4개, `terraform providers schema -json`, `aws ec2 describe-* help`) — 변동 주제에 맞게 갱신해 재사용
- `:::danger[NAT 는 켜 둔 시간만큼 청구된다]` 경고 — 5절 선택 배포에서 재사용
- 정답지 경로·`~` 전개 주의 산문 — 0절로 압축

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

Global Constraints 의 공통 골격을 그대로 채운다. 모듈 01 고유 값:

- `title`: `01. Terraform 문법 + VPC — 변동 이행 실습`
- 기준본 런북 링크: `set-02/task-1/README.md`
- 타이머: **30분**
- 1절 차이표: 위 "변동 사실" 표를 그대로 옮긴다
- 1절 산문에 넣을 제약 — 서브넷 마스크는 24bit 고정이고 Zero Subnet 을 허용한다. CIDR 을 표로 주지 않으므로 `10.97.0.0/24`·`10.97.1.0/24`·`10.97.2.0/24` 와 `10.97.10.0/24`·`10.97.11.0/24`·`10.97.12.0/24` 를 직접 계산해야 한다. NAT 는 AZ 당 하나씩 3개로 늘고 라우팅 테이블도 AZ 별로 갈린다. 그 위에 VPC Endpoint 와 Flow Log 가 새 요구로 붙는다.
- 2절 숨는 곳 체크리스트 — **아래는 초안이다. 정답지 코드로 각 항목이 사실인지 확인하고 틀린 것은 고친다.**
  ```
  - CIDR·AZ 목록이 실제로 어느 파일에 있는지 — `terraform.tfvars` 인지 `variables.tf` 의 map 인지
  - `subnets` map — 4개에서 6개로. 키 이름이 AZ 를 담고 있다
  - `vpc.tf` 의 `for_each` 대상 — RTB 개수가 자동 확장되는지 손으로 늘려야 하는지
  - NAT·EIP 리소스와 그것을 참조하는 `aws_route` — 개수가 2에서 3으로
  - VPC Endpoint 와 Flow Log 는 기준본에 블록이 아예 없다. 새로 써야 한다
  - `outputs.tf` 의 서브넷 ID 출력 — 개수가 바뀐다
  - 뒤 모듈이 읽는 `.env.ps1` / `.env.sh` 생성 블록
  ```
- 3절 통과 기준:
  1. 잔존 `grep` — **패턴을 양쪽으로 검증한다.** 기준본에서 여러 건이 잡히고 정답 코드에서 0건이 나오는 패턴이어야 한다. `wskorea26` 단독처럼 모듈 밖 이름까지 잡는 패턴은 0건이 원리적으로 불가능하므로 쓰지 않는다
  2. `terraform plan` 이 `aws_subnet` 6개, `aws_route_table` 4개(public 1 + private 3), `aws_nat_gateway` 3개, `aws_vpc_endpoint` 4개, `aws_flow_log` 1개를 낸다
  3. 대응표는 `~/skills-2026/set-07/task-1/mark.md` 의 VPC 절 항목으로 채운다
- 4절 diff 대상: `~/skills-2026/set-07/task-1/terraform/`
- 5절: 기준본 set-02 의 NAT 2개와 set-07 의 NAT 3개·Interface Endpoint·EKS 가 모두 시간당 과금이다. `:::danger` 로 그 취지의 경고를 남기고 "이 모듈만 따로 배포할 필요는 없다"고 적는다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공. `starlight-links-validator` 경고 0건. 새로 건 링크(`/reference/search-guide/`, `/part-1/01-terraform-vpc/theory/`, GitHub 외부 링크)가 전부 해석돼야 한다.

- [ ] **Step 4: 옛 절차가 남지 않았는지 확인한다**

Run: `grep -nE "mkdir my-vpc-lab|terraform apply|백지" src/content/docs/part-1/01-terraform-vpc/lab.mdx`
Expected: 0건 또는 5절(선택 배포) 안에서만 나온다. 0절~3절에 `terraform apply` 가 있으면 골격을 어긴 것이다.

- [ ] **Step 5: 커밋**

```bash
git add src/content/docs/part-1/01-terraform-vpc/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 01 실습을 set-02 재현에서 set-07 이행으로 바꾼다

VPC 를 백지에서 다시 쓰는 훈련은 대회 당일에 쓸 일이 없다. 과제지가 30%
범위에서 바뀐 채로 나오므로 필요한 것은 바뀐 요구를 읽고 기존 코드를
고치는 능력이다.

set-07 은 CIDR 을 표가 아니라 규칙으로 주고 AZ 를 3개로 늘리며 프라이빗
서브넷의 인터넷 경유를 금지한다 — NAT 를 걷어내야 한다. sed 치환으로
풀리지 않아 변동 훈련의 기준본으로 적합하다.

기초 구축 절차는 정답지 레포 런북 링크로 대체했다.
EOF
```

---

### Task 2: 형식 검토 게이트

**Files:** 없음. 사람이 읽는 단계다.

- [ ] **Step 1: 렌더된 결과를 확인한다**

Run: `npm run dev` — 이미 떠 있으면 재시작하지 않는다. 떠 있는지 먼저 확인하고, 종료가 필요하면 `npx astro dev stop`.
브라우저에서 `/part-1/01-terraform-vpc/lab/` 를 연다.

확인할 것: 절 6개가 순서대로 있는가 / 2절에 명령 절차가 없는가 / 차이표가 가로 스크롤 없이 읽히는가 / `<details>` 정답이 접혀 있는가.

- [ ] **Step 2: 사용자에게 형식 승인을 받는다**

12편을 다 쓴 뒤 형식이 틀렸다는 것을 발견하면 되돌리는 비용이 크다. **승인 없이 Task 3 으로 넘어가지 않는다.**

승인되면 공통 골격을 확정으로 취급한다. 수정 요청이 오면 Task 1 로 돌아가 골격을 고치고 Global Constraints 의 골격 블록도 함께 갱신한다.

---

### Task 3: 모듈 04 재작성 — 런북형에서도 골격이 되는지 검증

**Files:**
- Modify: `src/content/docs/part-2/04-eksctl-cluster/lab.mdx`

**Interfaces:**
- Consumes: Task 1 이 확정한 공통 골격.
- Produces: 런북형 lab(명령 나열이 본문의 대부분)에도 골격이 맞는다는 확인. 맞지 않으면 Task 2 로 되돌린다.

**변동 사실 (실측 완료):**

| 항목 | set-02 (기준본) | set-07 (변동 타깃) |
|---|---|---|
| Control Plane 접근 | Private 환경 구성 | **외부에서 접근 불가** — endpoint public access 완전 차단 |
| Control Plane 로그 | 모든 로그 CloudWatch Logs | 모든 로그 수집 + **로그도 Platform CMK 로 암호화** |
| Secrets 암호화 | KMS 로 Secret 리소스 암호화 | Etcd Secrets + **모든 노드의 EBS 볼륨** 을 Platform CMK 로 |
| CMK 구성 | 용도별 키 (`wskorea26-*-key`) | **3키 분리** — `unicorn-kms-app`(Secrets Manager·DynamoDB) / `unicorn-kms-data`(S3·ECR) / `unicorn-kms-platform`(EKS 봉투암호화·EBS·Log). **90일 자동 교체**, Platform 키는 WAF 로그 때문에 **`us-east-1` 다중 리전 키** |
| 노드 배치 | ManagedNodegroup | **모든 노드가 Private subnet 에서만** |
| 노드 시간대 | 지정 없음 | **KST** |

원문 근거: `~/skills-2026/set-07/task-1/task.md` 73~81행(KMS), 113행(EKS).

- [ ] **Step 1: 현재 파일에서 살릴 것을 추린다**

`실전 참조` 블록과 `7. 변형 셀프 체크` 의 질문 소재를 확인한다. 셀프 체크의 1번(클러스터 이름 변경 시 고칠 곳 — `eksctl/cluster.yaml` 의 `metadata.name` 한 곳, `terraform/variables.tf` 의 `cluster_name` 은 아무도 참조하지 않는 죽은 변수)은 **2절 숨는 곳 체크리스트로 흡수한다.** 지면 문제 형태로는 남기지 않는다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `04. eksctl 클러스터 — 변동 이행 실습`
- 기준본 런북 링크: `set-02/task-1/README.md`
- 타이머: **30분**
- 1절: 위 변동 사실 표
- 2절 숨는 곳 체크리스트:
  ```
  - `eksctl/cluster.yaml` 의 `metadata.name` — terraform 의 `cluster_name` 변수는 죽어 있다. 여기만 고쳐야 한다
  - `cluster.yaml` 의 `privateCluster` · `endpointPublicAccess` · `secretsEncryption.keyARN`
  - 노드그룹의 `privateNetworking` 과 `volumeEncrypted` · `volumeKmsKeyID` — EBS 암호화는 노드그룹 설정이다
  - `cloudWatch.clusterLogging.enableTypes` 와 로그 그룹의 KMS 키 — 로그 그룹 암호화는 eksctl 이 안 해 준다
  - KMS 키가 1개에서 3개로 늘면 `kms.tf` 의 리소스와 그것을 참조하는 모든 `kms_key_id` 인자
  - 다중 리전 키는 provider alias 가 필요하다 — `versions.tf` 의 `provider "aws" { alias = "us_east_1" }`
  - 노드 시간대는 `overrideBootstrapCommand` 또는 userdata 다
  - `aws eks update-kubeconfig --name` 과 LBC helm 의 `--set clusterName`
  ```
- 3절 통과 기준:
  1. `grep -rn "wskorea26-cluster" .` 0건
  2. `terraform plan` 이 `aws_kms_key` 3개(이 중 1개는 `multi_region = true`), `aws_kms_alias` 3개를 낸다. `eksctl create cluster --dry-run -f eksctl/cluster.yaml` 이 통과한다
  3. 대응표는 `~/skills-2026/set-07/task-1/mark.md` 의 KMS·EKS 절
- 4절 diff 대상: `~/skills-2026/set-07/task-1/eksctl/cluster.yaml` 과 `terraform/kms.tf`
- 5절: 클러스터 생성은 20분 이상 걸리고 fully-private 는 접근 자체가 어렵다. 배포는 모듈 07 에서 한 번에 하는 것을 권한다고 적는다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 골격 적합성을 판단한다**

런북형 lab 에서 명령을 다 걷어냈을 때 2절이 비어 보이지 않는지 본다. 숨는 곳 체크리스트가 8줄 이상이면 충분하다. 3줄 이하로 나오는 모듈이 있으면 골격을 다시 논의해야 한다 — 그 경우 Task 2 로 돌아간다.

- [ ] **Step 5: 커밋**

```bash
git add src/content/docs/part-2/04-eksctl-cluster/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 04 실습을 set-07 클러스터 요구로 이행하는 훈련으로 바꾼다

set-07 은 Control Plane 외부 접근을 완전히 막고 CMK 를 용도별 3개로
쪼개며 그중 하나를 us-east-1 다중 리전 키로 요구한다. EBS 와 로그 그룹
암호화까지 걸려 eksctl 설정과 terraform 양쪽을 함께 고쳐야 한다.

명령 나열을 걷어내고 숨는 곳 체크리스트로 대체했다. 죽은 변수
(terraform 의 cluster_name)를 짚는 기존 셀프 체크 질문은 체크리스트로
흡수했다.
EOF
```

---

### Task 4: 모듈 05 재작성

**Files:**
- Modify: `src/content/docs/part-2/05-k8s-workloads-alb/lab.mdx`

**Interfaces:**
- Consumes: 공통 골격. 모듈 04 가 만든 클러스터 전제.
- Produces: 없음.

**변동 사실 (실측 완료):**

| 항목 | set-02 (기준본) | set-07 (변동 타깃) |
|---|---|---|
| ALB 노출 | 인터넷 ALB. CloudFront custom header `wskorea26-cf` 로 직접 호출 403 | **Internal ALB** — CloudFront 를 거치지 않는 모든 내부망 요청까지 거절 |
| CloudFront 연결 | 도메인 오리진 + custom header | **VPC Origin** 으로 `unicorn-alb` 연결. 인터넷 노출 없이 도달 |
| 라우팅 | `/book` 경로를 대상별로 | **GET 은 Lambda, POST 와 `GET /health` 는 Book App** |
| S3 오리진 | OAI/OAC | **OAC 전용**, 버킷 정책은 해당 Distribution ARN 만 허용 |
| 배포 이름 | `wskorea26-*` | `unicorn-svc-cf` · `unicorn-alb` |

원문 근거: `~/skills-2026/set-07/task-1/task.md` 17~23행, 155행, 162행.

- [ ] **Step 1: 현재 파일에서 살릴 것을 추린다**

`실전 참조` 블록(helm values, `kubectl explain targetgroupbinding.spec`, `aws elbv2 describe-rules help`)을 유지한다. `8. 변형 셀프 체크` 의 1번(오리진 검증 헤더 값 — `variables.tf` 의 `origin_verify_value` 한 곳, `cloudfront.tf` 와 `alb.tf` 리스너 규칙 둘이 참조)은 2절 체크리스트로 흡수한다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `05. k8s 워크로드와 ALB — 변동 이행 실습`
- 타이머: **25분**
- 1절 산문에 넣을 핵심 — custom header 방식이 통째로 사라진다. VPC Origin 은 ALB 를 internal 로 두고 CloudFront 가 VPC 안으로 직접 들어오는 구조라 헤더 검증 리스너 규칙이 필요 없어진다. **지우지 않고 남기면 CloudFront 가 헤더를 안 보내 전부 403 이 된다.**
- 2절 숨는 곳 체크리스트:
  ```
  - `alb.tf` 의 `internal` 인자와 서브넷 목록 — public 에서 private 으로
  - `alb.tf` 의 헤더 검증 리스너 규칙 — 삭제 대상이다. 남기면 전부 403
  - `variables.tf` 의 `origin_verify_value` 와 그것을 참조하는 두 곳
  - `cloudfront.tf` 의 오리진 블록 — 도메인 오리진에서 `aws_cloudfront_vpc_origin` 으로
  - 리스너 규칙의 조건 — 경로 기반에서 HTTP 메서드 기반으로. `GET /health` 예외가 따로 걸린다
  - `k8s/app/` 의 TargetGroupBinding 이 가리키는 TG ARN
  - S3 버킷 정책의 Principal — OAI 면 OAC 로 바꾸고 Distribution ARN 조건을 건다
  ```
- 3절 통과 기준:
  1. `grep -rn -E "wskorea26-cf|wskorea26-book-alb" .` 0건
  2. `terraform plan` 에 `aws_cloudfront_vpc_origin` 1개, ALB 의 `internal = true`, 헤더 검증 규칙 0개
  3. 대응표는 `~/skills-2026/set-07/task-1/mark.md` 의 ALB·CloudFront 절
- 4절 diff 대상: `~/skills-2026/set-07/task-1/terraform/alb.tf` · `cloudfront.tf`

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-2/05-k8s-workloads-alb/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 05 실습을 internal ALB + VPC Origin 이행으로 바꾼다

set-07 은 ALB 를 internal 로 두고 CloudFront VPC Origin 으로 연결한다.
custom header 검증 방식이 통째로 사라지는 변동이라, 지우지 않고 남기면
CloudFront 가 헤더를 보내지 않아 전부 403 이 된다. 값 치환이 아니라
구조를 읽어야 푸는 문제다.

라우팅 조건도 경로 기반에서 HTTP 메서드 기반으로 바뀐다.
EOF
```

---

### Task 5: 모듈 02 재작성

**Files:**
- Modify: `src/content/docs/part-1/02-kms-s3-cloudfront/lab.mdx`

**변동 사실 (실측 완료):**

set-03 이 주 타깃이고 set-07 을 보조로 쓴다.

| 항목 | set-02 (기준본) | set-03 (변동 타깃) |
|---|---|---|
| CMK 정책 | 관행적으로 root 신뢰 | **root 와 `"kms:*"` 정책 금지** (과제지 34행). 채점 스크립트가 키 정책에 `:root"` 또는 `kms:*` 가 있으면 `grep` 한 줄로 FAIL |
| CMK 개수 | 용도별 | 용도별 5개 — `wsc2026-db-kms` · `wsc2026-ecr-kms` · `wsc2026-eks-kms` · `wsc2026-bucket-kms` · `wsc2026-function-kms` |
| S3 이름 | `wskorea26-*-<비번호>` | `wsc2026-static-<임의의 영문 4자리>-<비번호>-bucket` |
| S3 암호화 | SSE-KMS | SSE-KMS + **버킷 키 활성화**, 객체까지 |
| WAF | **없음** | **신설** — `wsc2026-waf`, SQLi·XSS 룰셋 + Rate Limiting(1분간 특정 IP 200건 이상 차단) |
| 캐시 정책 | — | **S3 는 캐싱 활성화, ALB 와 Lambda 는 비활성화.** 채점이 관리형 정책 ID 를 하드코딩해 비교하므로 동작이 같은 커스텀 정책을 만들면 FAIL |

set-07 보조 — WAF 는 `us-east-1` Web ACL, 기본 동작 Allow, 차단 시 응답이 `HTTP 403` 과 본문 `Request blocked by Unicorn WAF` 여야 한다(커스텀 응답).

원문 근거: `~/skills-2026/set-03/task-1/task.md` 34·102·106·107·141·144행, `~/skills-2026/set-07/task-1/task.md` 164~170행.

- [ ] **Step 1: 현재 파일에서 살릴 것을 추린다**

`실전 참조` 블록을 유지하고 KMS 키 정책·WAF 관련 문서 링크를 더한다. `변형 셀프 체크` 1번(비번호 변경 — `terraform.tfvars` 의 `player_number` 한 곳, 버킷 이름은 `data.tf` 의 `local.bucket_name` 이 조립)은 2절 체크리스트로 흡수한다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `02. KMS·S3·CloudFront — 변동 이행 실습`
- 타이머: **35분** (WAF 신설이 있어 다른 모듈보다 길다)
- 1절 산문 핵심 — **편의로 넓게 준 권한이 감점이 아니라 항목 전체를 0점 처리한다.** set-03 채점은 판정형이라 `if` 조건 하나가 그 항목의 전부다. 키 정책에서 root 를 빼면 키를 만든 주체가 스스로 키를 관리할 수 없게 되므로, 어떤 Principal 에 어떤 액션을 주어야 하는지 다시 설계해야 한다.
- 2절 숨는 곳 체크리스트:
  ```
  - `kms.tf` 의 키 정책 JSON — `Principal.AWS` 의 `:root` 와 `Action: "kms:*"` 둘 다
  - 키가 5개로 늘면 각 리소스의 `kms_key_id` 인자가 서로 다른 키를 가리킨다
  - `data.tf` 의 `local.bucket_name` 조립식 — 영문 4자리가 새로 들어간다
  - `s3.tf` 의 `bucket_key_enabled`
  - `cloudfront.tf` 의 캐시 정책 — 관리형 정책 ID 여야 한다. 커스텀 정책은 FAIL
  - WAF 는 새 파일이다. CloudFront 연결이면 `us-east-1` provider alias 가 필요하다
  - WAF 커스텀 응답 본문은 base64 가 아니라 평문 문자열 인자다
  ```
- 3절 통과 기준:
  1. `grep -rn -E '":root"|kms:\*' *.tf *.json` 0건
  2. `terraform plan` 이 `aws_kms_key` 5개, `aws_wafv2_web_acl` 1개, `aws_s3_bucket_server_side_encryption_configuration` 에 `bucket_key_enabled = true`
  3. 대응표는 `~/skills-2026/set-03/task-1/mark.md` 의 KMS·S3·CloudFront·WAF 절. 판정형 스크립트라 `~/skills-2026/set-03/task-1/mark.sh` 의 `check_kms()` 함수를 직접 읽는다
- 4절 diff 대상: `~/skills-2026/set-03/task-1/terraform/`
- 5절: WAF·CloudFront 는 배포 비용이 낮고 반영에 시간이 걸린다. 배포한다면 `mark.sh` 를 돌려 판정형 출력을 직접 본다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-1/02-kms-s3-cloudfront/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 02 실습을 set-03 의 root-less KMS·WAF 이행으로 바꾼다

set-03 은 CMK 정책에서 root 와 kms:* 를 금지하고 채점 스크립트가 grep
한 줄로 FAIL 을 낸다. 편의로 넓게 준 권한이 감점이 아니라 항목 전체를
날리는 구조라, 키 정책을 처음부터 다시 설계해야 하는 변동이다.

WAF 는 set-02 에 없다가 새로 생기는 요구다. CloudFront 연결이면 리전이
us-east-1 이어야 하고, 캐시 정책은 관리형 ID 를 그대로 써야 한다 —
동작이 같은 커스텀 정책을 만들면 FAIL 이다.
EOF
```

---

### Task 6: 모듈 03 재작성

**Files:**
- Modify: `src/content/docs/part-1/03-container-lambda-dynamodb/lab.mdx`

**변동 사실 (실측 완료 — 스펙의 "미확인" 항목이 이 조사로 해소됐다):**

| 항목 | set-02 (기준본) | set-03 (변동 타깃) |
|---|---|---|
| ECR 태그 | `stable` 태그 사용 | **같은 태그 재업로드 허용하되 `v1.0.0`·`v1.0.1` 등 v1 태그만 예외** (immutability with exclusion). 최종적으로 `v1.0.0` 외 이미지가 남아 있으면 안 된다 |
| ECR 암호화 | 암호화 | **KMS CMK** `wsc2026-ecr-kms` |
| DynamoDB 과금 | 지정 없음 | **`PAY_PER_REQUEST`** |
| DynamoDB 백업 | 삭제방지 + KMS | 삭제방지 + KMS + **PITR 최장 기간** |
| DynamoDB 인덱스 | GSI `concert_name-created_at-index` | **`booking_id` 기반 GSI** |
| DynamoDB 권한 | Lambda 최소 권한 | **테이블 수준 분리** — EKS Pod 는 삽입만, Lambda 는 조회만 |
| Pod 인증 | IRSA | **Pod Identity** |
| Lambda 런타임 | Python 3.14 | **Python 3.12** |
| Lambda 이름 | `wskorea26-book-lambda` | `wsc2026-book-get-function` |
| Lambda 호출 경로 | **ALB 타깃** (ALB 이벤트 포맷) | **Lambda Function URL** 을 CloudFront 오리진으로. 이벤트 포맷이 다르다 |
| Lambda 암호화 | — | 코드와 **환경 변수를 전송 중·저장 중 모두 CMK** 로 |

원문 근거: `~/skills-2026/set-03/task-1/task.md` 52·60·62·63·91·109~117행.

- [ ] **Step 1: 현재 파일에서 살릴 것을 추린다**

`실전 참조` 블록 유지. `변형 셀프 체크` 1번(GSI 이름이 두 곳 — `dynamodb.tf` 의 `global_secondary_index.name` 과 `lambda.tf` 의 `INDEX_NAME` 리터럴. 한쪽만 고치면 Query 가 `ValidationException`)은 2절 체크리스트로 흡수한다. 이 함정은 GSI 가 통째로 바뀌는 이번 변동에서 더 크게 걸린다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `03. 컨테이너·Lambda·DynamoDB — 변동 이행 실습`
- 타이머: **35분**
- 1절 산문 핵심 — **이벤트 포맷이 바뀌는 것이 이 변동의 진짜 어려움이다.** ALB 타깃 Lambda 는 `event["queryStringParameters"]` 와 `statusCode`·`headers`·`body` 를 쓰는 ALB 포맷이고, Function URL 은 API Gateway v2 payload 포맷이다. 함수 이름과 런타임만 바꾸고 핸들러 본문을 그대로 두면 호출은 되는데 응답이 깨진다.
- 2절 숨는 곳 체크리스트:
  ```
  - `dynamodb.tf` 의 `billing_mode` · `point_in_time_recovery` · GSI 블록
  - GSI 이름은 두 곳이다 — `dynamodb.tf` 와 `lambda.tf` 의 `INDEX_NAME` 환경 변수 리터럴
  - `lambda/index.py` 의 이벤트 파싱 — ALB 포맷과 Function URL 포맷이 다르다
  - `lambda.tf` 의 `runtime` · `function_name` · `kms_key_arn` · `environment`
  - Function URL 리소스와 그것을 CloudFront 오리진으로 잇는 `cloudfront.tf`
  - ALB 의 Lambda 타깃 그룹과 리스너 규칙 — 삭제 대상이다
  - `ecr.tf` 의 `image_tag_mutability` 와 lifecycle policy JSON
  - IAM 정책 두 벌 — Pod 는 PutItem, Lambda 는 Query 만
  - Pod Identity 로 바꾸면 IRSA 용 OIDC 신뢰 정책과 ServiceAccount 애노테이션이 죽는다
  ```
- 3절 통과 기준:
  1. `grep -rn -E "wskorea26-book-lambda|python3\.14|concert_name-created_at-index" .` 0건
  2. `terraform plan` 이 `aws_lambda_function_url` 1개, `aws_lb_target_group` 중 Lambda 타입 0개, `aws_dynamodb_table` 의 `billing_mode = "PAY_PER_REQUEST"`
  3. 대응표는 `~/skills-2026/set-03/task-1/mark.md` 의 ECR·DynamoDB·Lambda 절
- 4절 diff 대상: `~/skills-2026/set-03/task-1/terraform/`

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-1/03-container-lambda-dynamodb/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 03 실습을 set-03 의 Function URL·Pod Identity 이행으로 바꾼다

조사 전에는 이 모듈의 변동 짝이 얕을 것으로 봤는데 실측해 보니 가장
깊다. Lambda 가 ALB 타깃에서 Function URL 로 바뀌면서 이벤트 포맷이
달라진다 — 이름과 런타임만 고치면 호출은 되고 응답이 깨진다.

DynamoDB 는 과금 모드·PITR·GSI 키가 모두 바뀌고 권한이 테이블 수준에서
Pod 삽입과 Lambda 조회로 갈린다. ECR 은 태그 예외 규칙이 붙는다.
EOF
```

---

### Task 7: 모듈 06 재작성

**Files:**
- Modify: `src/content/docs/part-2/06-observability/lab.mdx`

**변동 사실 (실측 완료):**

| 항목 | set-02 (기준본) | set-03 (변동 타깃) |
|---|---|---|
| 채점 방식 | **수동** — 요구가 서술적이고 도구 선택이 자유 | **판정형·실시간** — 스크립트가 `kubectl run` 으로 이상 파드 6개를 심고 180초 뒤 Grafana 알림 5개가 Firing 인지 본다 |
| 스택 | 자유 | **고정** — Prometheus + Alertmanager + Node Exporter(DaemonSet) + Fluent Bit(DaemonSet) + Grafana |
| 메트릭 보존 | 지정 없음 | **7일** |
| 로그 수집 | Pod 로그를 CloudWatch Logs 로 | **health 로그 제외**, 실제 API 요청 로그만. 파싱해 구조화 |
| Grafana 노출 | ALB, HTTP 80 | **Service 타입 LB** |
| Grafana 인증 | `skills-<비번호>-admin` / `$korea26!!` | admin 비밀번호 `Skills$#$@!` |
| 대시보드 | 메트릭 패널 나열 | 이름 `wsc2026-grafana-dashboard`. **상단에 노드그룹·네임스페이스 필터**, 임계치 색상 — CPU 80% 이상 빨강 / 60~80% 노랑 / 60% 미만 초록, **Pod 재시작 1회 이상이면 경고색** |
| 알림 | 없음 | Prometheus Alert 표대로 (`~/skills-2026/set-03/task-1/task.md` 167~176행) |

- [ ] **Step 1: 현재 파일에서 살릴 것을 추린다**

`실전 참조` 블록과 알람·Firing 검사 관련 서술을 확인한다. 이 모듈은 이미 알람 6종과 `log_to_metrics` 파이프라인을 다루고 있으므로 **내용 손실이 없도록 주의한다** — 기존 본문에서 개념 설명에 해당하는 부분이 있으면 `theory.mdx` 로 옮기지 말고(theory 는 수정 금지) 1절 산문에 녹인다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `06. 관측성 — 변동 이행 실습`
- 타이머: **40분** (12편 중 가장 길다. 대시보드 JSON 을 손대야 한다)
- 1절 산문 핵심 — **"패널이 보이면 통과"가 아니다.** 채점자가 주입한 이상을 실제로 잡아내야 한다. 알림 규칙이 없거나 임계치가 어긋나면 파드를 심어도 Firing 이 안 뜬다.
- 2절 숨는 곳 체크리스트:
  ```
  - kube-prometheus-stack values 의 `retention` · `nodeExporter.enabled` · `alertmanager.enabled`
  - Grafana dashboard JSON 의 패널 임계치 `steps` 배열 — 색상 경계값 세 개
  - dashboard JSON 의 `templating.list` — 노드그룹·네임스페이스 변수 두 개
  - Grafana Service 의 `type` — ALB 방식이면 TargetGroupBinding 이 딸려 있다. LB 로 바꾸면 그쪽이 죽는다
  - Fluent Bit ConfigMap 의 필터 — health 경로 제외 규칙과 파서
  - Prometheus Rule CRD 의 알림 이름과 표현식
  - Grafana admin 비밀번호가 Secret 인지 values 리터럴인지
  ```
- 3절 통과 기준:
  1. `grep -rn -E "skills-.*-admin|\\\$korea26" .` 0건
  2. 배포 없이 판정할 것 — dashboard JSON 이 유효한 JSON 이고(`jq . < dashboard.json`) `templating.list` 에 변수 2개, 임계치 `steps` 에 경계 3개가 있다. `helm template` 이 통과한다
  3. 대응표는 `~/skills-2026/set-03/task-1/mark.md` 의 관측성 절과 `mark.sh` 의 11-1 항목
- 4절 diff 대상: `~/skills-2026/set-03/task-1/k8s/monitoring/`
- 5절: 이 모듈은 **선택 배포의 가치가 가장 크다.** Firing 검사는 실제로 파드를 심어 봐야 확인된다. 절차를 적는다 — `kubectl run` 으로 이상 파드를 만들고 180초 뒤 Alertmanager 를 조회한다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-2/06-observability/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 06 실습을 set-03 의 판정형 관측성 이행으로 바꾼다

set-02 는 관측성을 수동 채점하고 도구 선택이 자유롭지만 set-03 은 스택을
고정하고 실시간으로 판정한다. 채점 스크립트가 이상 파드 6개를 심고
180초 뒤 알림 5개가 Firing 인지 본다 — 패널이 보이는 것으로는 점수가
나오지 않는다.

대시보드 JSON 의 임계치 색상 경계와 템플릿 변수, Fluent Bit 의 health
제외 필터가 전부 채점 대상이라 손댈 자리가 코드 밖에 있다.
EOF
```

---

### Task 8: 모듈 07 재작성 — 종합 이행

**Files:**
- Modify: `src/content/docs/part-2/07-full-deploy-set02/lab.mdx`

**Interfaces:**
- Consumes: 모듈 01~06 의 변동 이행 결과. 이 모듈만 **개별 모듈이 아니라 1과제 전체**를 대상으로 한다.
- Produces: 없음.

이 모듈은 짝이 하나가 아니라 **1과제 전체를 set-02 에서 set-07 로 이행**하는 종합 훈련이다. 모듈 01·04·05 의 변동이 합쳐지고, 여기에만 있는 요구가 더 붙는다.

**모듈 07 에만 있는 추가 변동 (실측 완료):**

- **IAM Assume Role 제약** — 동일 계정 Principal 이 **External ID 와 함께** Assume 했을 때만 사용 가능. External ID 가 없거나 틀리면 거부. 최대 세션 1시간. 권한은 DynamoDB 조회 + VPC·EKS Describe 로 한정하고 **와일드카드 액션·리소스 금지** (`~/skills-2026/set-07/task-1/task.md` 177행)
- **채점 환경** — Private Subnet 에 `unicorn-mark` 이름의 CloudShell VPC Environment 를 만들어야 하고, 그 셸에서 모든 리소스에 접근이 가능해야 한다 (57행)
- **중괄호 전개 규칙** — 과제지가 `unicorn-subnet-pub-{a,b,c}` 로 축약 표기하고 선수가 전개한다 (53행)
- **다이어그램 불일치 주의** — 다이어그램의 서브넷 개수가 실제 지시와 다를 수 있다 (56행)

- [ ] **Step 1: 현재 파일 구조를 확인한다**

현재 `07-full-deploy-set02/lab.mdx` 는 `①~⑩` 번호 절의 완주 런북이다. 이 순서(Terraform → 이미지 → 클러스터 → LBC → 앱 → 모니터링 → Fluent Bit → 검증 시드 → 채점 → 정리)를 **2절 숨는 곳 체크리스트의 뼈대로 재사용한다.** 순서 자체가 이행 시 놓치는 자리를 알려 주기 때문이다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `07. 1과제 종합 — set-02 에서 set-07 로 이행`
- `description`: 폴더명이 `07-full-deploy-set02` 라 URL 은 그대로 두고 제목만 바꾼다. **폴더명을 바꾸면 사이드바·로드맵·`reference/links` 의 링크가 전부 깨진다.**
- 타이머: **90분** (종합이라 다른 모듈보다 길다)
- 0절: set-02 1과제 전체가 서 있어야 한다. 런북은 `set-02/task-1/README.md`
- 1절: 모듈 01·04·05 의 차이표를 요약해 옮기고, 위 "모듈 07 에만 있는 추가 변동" 4항목을 더한다
- 2절 체크리스트는 완주 10단계 순서를 따른다. 각 단계마다 "이 단계에서 set-07 때문에 바뀌는 것"을 한 줄씩
- 3절 통과 기준:
  1. `grep -rn -E "172\.16|wskorea26" .` 0건
  2. `terraform plan` 전체가 통과하고 `eksctl create cluster --dry-run` 이 통과
  3. 대응표는 `~/skills-2026/set-07/task-1/mark.md` **전체**. 이 모듈만 전 항목을 대상으로 한다
- 4절 diff 대상: `~/skills-2026/set-07/task-1/` 전체
- 5절: 이 모듈이 **실제 배포를 권하는 유일한 모듈**이다. 1과제 전체를 한 번은 세워 봐야 한다. `:::danger` 로 비용 경고와 당일 destroy 를 남긴다

- [ ] **Step 3: 링크가 깨지지 않았는지 확인한다**

Run: `npm run build`
Expected: 성공. 이 파일을 가리키는 인바운드 링크가 여러 곳에 있으므로 경고가 뜨면 폴더명이나 앵커를 건드린 것이다.

Run: `grep -rn "07-full-deploy-set02" src/content/docs --include=*.mdx | wc -l`
Expected: 재작성 전과 같은 건수. 줄었으면 다른 문서의 링크를 깨뜨린 것이다.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-2/07-full-deploy-set02/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 07 을 1과제 전체를 set-07 로 이행하는 종합 훈련으로 바꾼다

모듈 01·04·05 의 변동이 여기서 합쳐진다. 여기에만 있는 요구도 있다 —
External ID 를 요구하는 Assume Role, 와일드카드 금지, Private Subnet 의
CloudShell VPC Environment, 중괄호 축약 표기 전개다.

완주 런북 10단계의 순서는 버리지 않고 숨는 곳 체크리스트의 뼈대로
재사용했다. 그 순서 자체가 이행에서 빠뜨리는 자리를 알려 준다.
폴더명은 인바운드 링크 때문에 그대로 뒀다.
EOF
```

---

### Task 9: 모듈 09 재작성 — Cloud Event Handling

**Files:**
- Modify: `src/content/docs/part-4/09-serverless-event/lab.mdx`

**변동 사실 (실측 완료):**

| 항목 | set-02 모듈 3 (기준본) | set-08 모듈 3 (변동 타깃) |
|---|---|---|
| **리전** | **`eu-west-1`** | **`ap-southeast-1`** — 틀리면 그 모듈 0점 |
| 트리거 | 보안 또는 비용 상 위협 발생 시 | **보호 대상 Security Group 에 Inbound 규칙이 추가되면** |
| 동작 | 원래 상태로 복구하거나 관리자에게 알림 | 감지 → 알림 + 원래 상태로 복구 |

원문 근거: `~/skills-2026/set-02/task-2/task.md` 165행, `~/skills-2026/set-08/task-2/task.md` 159행.

- [ ] **Step 1: 두 모듈의 상세 요구를 추출한다**

Run:
```bash
sed -n '/^## .*Event/,/^## /p' ~/skills-2026/set-02/task-2/task.md
sed -n '/^## .*이벤트\|^## .*Event/,/^## /p' ~/skills-2026/set-08/task-2/task.md
```

두 모듈의 리소스 이름·EventBridge 규칙 패턴·Lambda 이름·SNS 주제를 표로 정리한다. Step 2 의 1절 차이표가 이 결과다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `09. Cloud Event Handling — 변동 이행 실습`
- **제목과 `description` 에 리전을 박는다.** 2과제는 모듈마다 리전이 다르고 틀리면 0점이다.
- 타이머: **25분**
- 1절 산문 핵심 — 트리거가 "위협 일반"에서 "SG Inbound 규칙 추가"로 좁혀지면 EventBridge 규칙의 이벤트 패턴이 통째로 바뀐다. CloudTrail 의 `AuthorizeSecurityGroupIngress` 를 잡아야 하고, 원복 로직은 추가된 규칙만 골라 지워야 한다
- 2절 숨는 곳 체크리스트에 반드시 넣을 것:
  ```
  - provider 의 `region` 과 모든 리전 하드코딩 — 이 모듈은 리전이 틀리면 0점이다
  - EventBridge 규칙의 `event_pattern` JSON
  - Lambda 핸들러가 이벤트에서 꺼내는 필드 경로
  - SNS 주제 ARN 과 구독 이메일
  - CloudTrail 이 그 리전에서 켜져 있는지 — 이벤트가 안 오면 규칙이 맞아도 동작하지 않는다
  ```
- 3절 통과 기준: `grep` 으로 옛 리전 문자열 0건 / `terraform plan` 의 리소스 목록 / 대응표는 `~/skills-2026/set-08/task-2/mark.md`
- 5절: 이벤트 자동복구는 **배포해야만 확인되는 변동**이다. 그 사실을 명시하고 검증 절차(SG 에 규칙을 넣고 원복되는지 관찰)를 적는다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-4/09-serverless-event/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 09 실습을 set-02 에서 set-08 이벤트 처리로 이행하게 바꾼다

Cloud Event Handling 은 후보 세트 둘에 같은 유형으로 나오고 조건이
다르다. 리전이 eu-west-1 에서 ap-southeast-1 로 바뀌고, 트리거가 위협
일반에서 SG Inbound 규칙 추가로 좁혀진다.

리전 오류는 그 모듈을 0점 처리하므로 제목과 설명에 리전을 박았다.
EOF
```

---

### Task 10: 모듈 10 재작성 — Scaling·Logging·Streaming

**Files:**
- Modify: `src/content/docs/part-4/10-scaling-logging-streaming/lab.mdx`

**변동 사실 (실측 완료):**

| 유형 | 기준본 | 변동 타깃 | 리전 이동 |
|---|---|---|---|
| Scaling | set-07 모듈 3 — EKS Scaling | **set-08 모듈 4** — SQS Queue 길이로 Worker Pod 를 늘리고 Karpenter 가 노드를 스케일 | 서울 → **`us-west-2`** |
| Scaling(보조) | set-07 모듈 3 | set-05 모듈 1 — EKS Scaling | — |
| Logging | set-07 모듈 4 — Container Logging | set-05 모듈 3 — Container Logging | — |

원문 근거: `~/skills-2026/set-08/task-2/task.md` 198행, `~/skills-2026/set-05/task-2/task.md`.

- [ ] **Step 1: set-08 모듈 4 와 set-05 모듈 1·3 의 상세 요구를 추출한다**

Run:
```bash
sed -n '/SQS Queue 길이/,/^## /p' ~/skills-2026/set-08/task-2/task.md
cat ~/skills-2026/set-08/task-2/module-4-sqs-scaling/README.md
sed -n '/^## .*Container logging/,/^## /p' ~/skills-2026/set-05/task-2/task.md
```

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `10. 스케일링·로깅·스트리밍 — 변동 이행 실습`
- 제목·`description` 에 리전 표기
- 타이머: **30분**
- 1절 산문 핵심 — HPA 는 CPU·메모리 같은 파드 자신의 메트릭으로 늘어나지만 KEDA 는 **큐 길이라는 바깥 신호**로 늘어난다. 스케일 신호의 출처가 바뀌면 지표 수집 경로와 IAM 권한이 함께 바뀐다. Karpenter 는 파드가 스케줄 안 되는 것을 보고 노드를 만들므로 KEDA 뒤에 붙는다
- **set-05 를 쓰는 절에 Global Constraints 의 고정 문장을 그대로 넣는다.**
- 2절 숨는 곳 체크리스트:
  ```
  - provider 의 `region` — 서울에서 us-west-2 로. 이 모듈은 리전이 틀리면 0점이다
  - HPA manifest 는 삭제 대상이다. KEDA ScaledObject 와 함께 두면 둘이 싸운다
  - ScaledObject 의 `triggers[].metadata.queueURL` 과 `queueLength`
  - KEDA 오퍼레이터의 IRSA 또는 Pod Identity — SQS 조회 권한이 필요하다
  - Karpenter NodePool·EC2NodeClass 의 서브넷·SG 셀렉터 태그
  - AMI 셀렉터와 인스턴스 타입 요구
  ```
- 3절 통과 기준: 옛 리전 `grep` 0건 / `kubectl apply --dry-run=client` 통과 / 대응표는 `~/skills-2026/set-08/task-2/mark.md`
- 5절: KEDA 스케일 동작은 **배포해야만 확인된다.** 큐에 메시지를 넣고 파드 수가 오르는지 보는 절차를 적는다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-4/10-scaling-logging-streaming/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 10 실습을 HPA 에서 KEDA·Karpenter 이행으로 바꾼다

스케일링은 후보 세 세트에 모두 나오는데 신호의 출처가 다르다. set-07 은
파드 자신의 메트릭으로 늘리고 set-08 은 SQS 큐 길이로 늘린 뒤 Karpenter
가 노드를 만든다. 리전도 서울에서 us-west-2 로 옮겨 간다.

set-05 를 보조 소재로 쓰되 정답 근거가 아니라 추가 모듈이 어떤 모양으로
오는지 보여 주는 예시임을 문서에 밝혔다.
EOF
```

---

### Task 11: 모듈 11 재작성 — NoSQL 엔진 교체

**Files:**
- Modify: `src/content/docs/part-4/11-documentdb/lab.mdx`

**변동 사실 (실측 완료):**

| 항목 | set-08 모듈 1 (기준본) | set-07 모듈 1 (변동 타깃) |
|---|---|---|
| 엔진 | **DocumentDB** (MongoDB 호환) | **DynamoDB** |
| 리전 | `ap-northeast-2` (서울) | 싱가포르 |
| 접속 | Secret `skills-nosql-docdb-secret`, DB `skills_retail`, 포트 `27017`, TLS 활성화 | IAM 기반. 엔드포인트·자격증명 개념이 없다 |
| 데이터 모델 | 컬렉션 (주문·상품·세션) | 테이블 + GSI |

**이 모듈의 변동은 12편 중 유일하게 엔진 자체가 바뀐다.** 값 치환이 전혀 통하지 않고 데이터 모델부터 다시 잡아야 한다.

원문 근거: `~/skills-2026/set-08/task-2/task.md` 68·81행, `~/skills-2026/set-07/task-2/task.md` 의 module-1.

- [ ] **Step 1: 양쪽 모듈의 상세 요구를 추출한다**

Run:
```bash
sed -n '/DocumentDB(MongoDB 호환)/,/^## /p' ~/skills-2026/set-08/task-2/task.md
sed -n '/NoSQL/,/^## /p' ~/skills-2026/set-07/task-2/task.md
cat ~/skills-2026/set-07/task-2/module-1-nosql/README.md
```

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `11. NoSQL — 엔진 교체 변동 실습`
- 제목·`description` 에 양쪽 리전 표기
- 타이머: **35분**
- 1절 산문 핵심 — DocumentDB 는 VPC 안에 클러스터를 띄우고 자격증명으로 붙는 **관리형 서버**고, DynamoDB 는 엔드포인트가 리전 단위인 **서버리스**다. 서브넷 그룹·보안 그룹·Secrets Manager 가 전부 사라지고 IAM 정책만 남는다. 반대로 컬렉션의 자유로운 문서 구조를 파티션 키·정렬 키로 다시 설계해야 한다
- 2절 숨는 곳 체크리스트:
  ```
  - DocumentDB 클러스터·인스턴스·서브넷 그룹·파라미터 그룹 — 전부 삭제 대상
  - Secrets Manager 시크릿과 그것을 읽는 IAM 정책
  - 애플리케이션의 커넥션 문자열과 TLS CA 번들 — DynamoDB 로 가면 SDK 호출로 바뀐다
  - 보안 그룹의 27017 인바운드
  - 파티션 키·정렬 키 설계 — 컬렉션에 있던 조회 패턴을 GSI 로 옮겨야 한다
  - 리전 하드코딩
  ```
- 3절 통과 기준: `grep -rn -E "27017|docdb|skills_retail" .` 0건 / `terraform plan` 에 `aws_docdb_*` 0개, `aws_dynamodb_table` 1개 이상 / 대응표는 `~/skills-2026/set-07/task-2/mark.md`
- 5절: 접속 확인은 배포해야 된다. DocumentDB 는 VPC 안에서만 붙으므로 검증 경로 자체가 다르다는 것을 적는다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-4/11-documentdb/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 11 실습을 DocumentDB 와 DynamoDB 사이 엔진 교체로 바꾼다

NoSQL 은 후보 세트 둘에 나오는데 엔진이 다르다 — set-08 은 DocumentDB,
set-07 은 DynamoDB 다. 12 편 중 유일하게 값 치환이 전혀 통하지 않고
데이터 모델부터 다시 잡아야 하는 변동이다.

VPC 안의 관리형 서버에서 리전 단위 서버리스로 옮겨 가면 서브넷 그룹과
Secrets Manager 가 통째로 사라지고 IAM 정책만 남는다.
EOF
```

---

### Task 12: 모듈 12 재작성 — VPC Lattice

**Files:**
- Modify: `src/content/docs/part-4/12-vpc-lattice/lab.mdx`

**변동 사실 (실측 완료 — 스펙의 "미확인" 항목이 이 조사로 해소됐다):**

| 항목 | set-08 모듈 2 (기준본) | set-05 모듈 2 (변동 소재) |
|---|---|---|
| **리전** | `ap-northeast-1` (도쿄) | **`ap-southeast-1`** |
| VPC 구성 | Client VPC ↔ Service VPC. **VPC Peering·Transit Gateway 등 직접 연결 금지** | **Hub VPC (`wsc-hub-vpc` `10.0.0.0/16`) ↔ Spoke VPC (`wsc-spoke-vpc` `192.168.0.0/16`)**. Hub 는 public 2개, Spoke 는 public 2 + private 2 |
| 애플리케이션 | EC2 두 대(Client·Service)에 Python 앱 | **`version1.py`·`version2.py` 두 버전**. TCP 8080, `/healthcheck` 로 상태 확인, `/version` 이 `{"version":"v1"}` / `{"version":"v2"}` 반환 |
| 접근 경로 | Client EC2 에서 호출 | **Bastion 구성**이 따로 있다 |

set-05 는 수상 후보가 아니다. Global Constraints 의 고정 문장을 이 모듈 1절에 그대로 넣는다.

- [ ] **Step 1: set-05 Lattice 모듈의 나머지 요구를 추출한다**

Run:
```bash
sed -n '/^## 4. VPC Lattice/,/^## 5\./p' ~/skills-2026/set-05/task-2/task.md
cat ~/skills-2026/set-05/task-2/module-2-vpc-lattice/README.md
```

Bastion 구성과 Target Group 가중치 요구를 확인해 1절 차이표를 완성한다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `12. VPC Lattice — 변동 이행 실습`
- 제목·`description` 에 리전 표기
- 타이머: **30분**
- 1절 산문 핵심 — 두 세트 모두 "직접 네트워킹 없이 VPC 간 통신"이라는 Lattice 의 존재 이유는 같지만, set-05 는 **앱이 두 버전**이라 Target Group 이 둘이고 Listener 규칙에서 버전을 갈라야 한다. 대역도 `10.0.0.0/16` 과 `192.168.0.0/16` 으로 서로 겹치지 않게 잡혀 있다
- 2절 숨는 곳 체크리스트:
  ```
  - provider 의 `region`
  - VPC·서브넷 이름과 CIDR — Client/Service 에서 Hub/Spoke 로. 개수도 4개에서 6개로
  - Lattice Target Group 이 1개에서 2개로. 각각 다른 버전의 EC2 를 가리킨다
  - Listener 규칙 — 버전 분기 조건이 새로 생긴다
  - Service Network 연결(association)은 VPC 마다 걸어야 한다
  - 헬스체크 경로 `/healthcheck` 와 포트 8080
  - Bastion 서브넷 배치와 보안 그룹
  ```
- 3절 통과 기준: 옛 리전·VPC 이름 `grep` 0건 / `terraform plan` 에 `aws_vpclattice_target_group` 2개 / 대응표는 `~/skills-2026/set-05/task-2/mark.md`
- 5절: Lattice 는 배포하지 않으면 경로 검증이 안 된다. Bastion 에서 `/version` 을 호출해 v1·v2 가 갈리는지 보는 절차를 적는다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-4/12-vpc-lattice/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 12 실습을 Hub·Spoke 2버전 Lattice 이행으로 바꾼다

VPC Lattice 는 set-08 과 set-05 양쪽에 나온다. 직접 네트워킹 없이 VPC
간 통신을 만든다는 목적은 같지만 set-05 는 앱이 v1·v2 두 버전이라 Target
Group 이 둘로 갈리고 Listener 에서 버전을 분기해야 한다. VPC 구성도
Client·Service 에서 Hub·Spoke 로, 리전도 도쿄에서 싱가포르로 바뀐다.

set-05 는 수상 후보가 아니므로 정답 근거가 아니라 변동 소재임을 명시했다.
EOF
```

---

### Task 13: 모듈 13 재작성 — CDN Function (짝 없음)

**Files:**
- Modify: `src/content/docs/part-4/13-cdn-function/lab.mdx`

**이 모듈만 변동 짝이 없다.** CDN Function 은 set-07 모듈 2 에만 있다. 스펙의 "지어내지 않는다"는 결정에 대한 유일한 예외이고, 근거가 확실한 축으로만 변동을 만든다.

**허용하는 변동 축 (이 셋만 쓴다):**

1. **리전 이동** — 2과제는 모듈마다 리전이 다르고 틀리면 0점이다. set-07 모듈 2 는 버지니아(`us-east-1`)다. CloudFront Function 은 글로벌이지만 연관 리소스(KVS·로그·오리진)의 리전이 따라 움직인다.
2. **키·이름 치환** — KeyValueStore 키 이름, 쿠키 이름(`x-sp-ab` 등), 헤더 이름. 이것들은 JS 코드 안에 리터럴로 박혀 있어 `sed` 로 안 잡히는 대표 사례다.
3. **분기 조건 변경** — A/B 비율이나 경로 조건. 같은 함수 구조 안에서 판정 로직만 바뀐다.

**금지 — 하지 않을 것:** 함수 종류를 CloudFront Function 에서 Lambda@Edge 로 바꾸는 식의 변동은 만들지 않는다. 근거가 없고 1과제의 "아키텍처 교체 없음" 원칙과도 어긋난다.

- [ ] **Step 1: set-07 모듈 2 의 실제 요구와 JS 코드를 읽는다**

Run:
```bash
sed -n '/CDN Function/,/^## /p' ~/skills-2026/set-07/task-2/task.md
ls ~/skills-2026/set-07/task-2/module-2-cdn-function
grep -rn "x-sp-ab\|KeyValueStore\|kvsHandle" ~/skills-2026/set-07/task-2/module-2-cdn-function
```

리터럴이 실제로 어디에 박혀 있는지 확인해야 2절 체크리스트가 사실이 된다.

- [ ] **Step 2: 공통 골격대로 전면 재작성한다**

- `title`: `13. CDN Function — 변동 이행 실습`
- 1절 첫머리에 이 문장을 넣는다 — **"이 모듈은 후보 세트에 짝이 없다. 아래 변동은 리전·이름·분기 조건이라는 확실한 축으로만 만든 것이고, 실제 출제 스펙이 아니다."**
- 타이머: **20분** (12편 중 가장 짧다)
- 1절 차이표는 Step 1 의 실측 값을 왼쪽에, 치환한 값을 오른쪽에 둔다
- 2절 숨는 곳 체크리스트:
  ```
  - CloudFront Function 의 JS 코드 안 문자열 리터럴 — 쿠키명·헤더명·KVS 키
  - KeyValueStore 리소스의 키 이름과 `terraform` 쪽 참조
  - `aws_cloudfront_function` 의 `code` 가 `file()` 인지 heredoc 인지 — heredoc 이면 grep 이 .tf 에서도 잡힌다
  - 함수 연관(association) 의 이벤트 타입 — viewer-request 와 viewer-response 는 쓸 수 있는 객체가 다르다
  - 관련 리소스의 리전
  ```
- 3절 통과 기준: 옛 리터럴 `grep` 0건 / `terraform plan` 통과 / **대응표 대신** set-07 `mark.md` 의 CDN Function 항목을 읽고 "이 변동이 어느 항목을 건드리나"를 채운다
- 4절: 짝이 없으므로 diff 대상은 **자기 자신의 변경 전 상태**다. `git diff` 로 무엇을 고쳤는지 되짚는다

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-4/13-cdn-function/lab.mdx
git commit -F - <<'EOF'
docs: 모듈 13 실습을 리터럴 치환 중심 변동 훈련으로 바꾼다

CDN Function 은 후보 세트에 짝이 없는 유일한 모듈이다. 변동을 지어내지
않는다는 원칙의 예외라, 리전·이름·분기 조건이라는 확실한 축으로만 만들고
실제 출제 스펙이 아니라는 것을 문서 첫머리에 밝혔다.

함수 종류를 바꾸는 변동은 만들지 않았다 — 근거가 없고 아키텍처 교체가
없다는 확인된 범위와도 어긋난다.

JS 코드 안의 쿠키명·KVS 키는 sed 로 안 잡히는 대표 사례라 훈련 가치가
있다.
EOF
```

---

### Task 14: `index.mdx` 12편의 학습 목표 문장 교체

**Files:**
- Modify: `src/content/docs/part-1/01-terraform-vpc/index.mdx` · `part-1/02-kms-s3-cloudfront/index.mdx` · `part-1/03-container-lambda-dynamodb/index.mdx` · `part-2/04-eksctl-cluster/index.mdx` · `part-2/05-k8s-workloads-alb/index.mdx` · `part-2/06-observability/index.mdx` · `part-2/07-full-deploy-set02/index.mdx` · `part-4/09-serverless-event/index.mdx` · `part-4/10-scaling-logging-streaming/index.mdx` · `part-4/11-documentdb/index.mdx` · `part-4/12-vpc-lattice/index.mdx` · `part-4/13-cdn-function/index.mdx`

**Interfaces:**
- Consumes: Task 1·3~13 이 확정한 각 모듈의 변동 타깃.
- Produces: 없음.

- [ ] **Step 1: 12편의 현재 목표 문장을 모아 본다**

Run: `grep -n -A 8 "학습 목표\|목표" src/content/docs/part-1/*/index.mdx src/content/docs/part-2/*/index.mdx src/content/docs/part-4/*/index.mdx`

- [ ] **Step 2: 실습 관련 목표만 변동 기준으로 고친다**

이론 목표는 건드리지 않는다. 실습을 가리키는 목표만 바꾼다.

바꾸는 방식 — "만들 수 있다"를 "이행할 수 있다"로. 예시:

```
전:  - set-02 VPC 스펙을 변수화된 tf 코드로 직접 작성할 수 있다
후:  - VPC 요구가 set-07 처럼 바뀌었을 때(3AZ · CIDR 규칙 계산 · NAT 제거) 기존 코드를 30분 안에 이행할 수 있다
```

각 모듈의 타이머 값과 변동 항목은 해당 태스크의 "변동 사실" 표에서 가져온다.

- [ ] **Step 3: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/content/docs/part-1/*/index.mdx src/content/docs/part-2/*/index.mdx src/content/docs/part-4/*/index.mdx
git commit -F - <<'EOF'
docs: 모듈 12 편의 학습 목표를 변동 이행 기준으로 고친다

실습이 바뀌었는데 개요의 목표 문장이 "직접 작성할 수 있다"로 남아 있으면
학습자가 무엇을 하러 들어가는지 오해한다. 목표를 타이머와 변동 항목이
드러나는 문장으로 바꿨다.

이론 목표는 손대지 않았다 — theory 는 그대로다.
EOF
```

---

### Task 15: 기존 자산 정리

**Files:**
- Modify: `src/content/docs/part-6/15-mutation-drill/index.mdx` · `part-6/15-mutation-drill/lab.mdx`
- Modify: `src/content/docs/reference/links.mdx`

**Interfaces:**
- Consumes: Task 1·3~13 의 결과. 12편이 다 끝난 뒤에 실행해야 한다.
- Produces: 없음.

`변형 셀프 체크` 절 삭제는 Task 1·3~7 의 재작성 과정에서 이미 이뤄진다(해당 파일을 전면 재작성하므로). 이 태스크는 **그 절이 정말 사라졌는지 확인**하고 나머지 둘을 처리한다.

- [ ] **Step 1: `변형 셀프 체크` 잔존을 확인한다**

Run: `grep -rn "변형 셀프 체크" src/content/docs --include=*.mdx`
Expected: 0건. 남아 있으면 그 파일의 재작성이 덜 된 것이다 — 해당 태스크로 돌아간다.

- [ ] **Step 2: 모듈 15 의 역할을 좁힌다**

`part-6/15-mutation-drill/lab.mdx` 의 **훈련 ①(30분 치환 드릴)** 은 이제 12편이 모듈마다 하는 일과 겹친다. 훈련 ① 을 지우지 말고 **"과제지 전체가 한꺼번에 바뀌는 종합 드릴"로 성격을 좁힌다.**

바꿀 것:
- `준비` 절의 "친구 또는 AI에게 변형 과제지 제작을 의뢰" 를 유지하되, 그 앞에 "모듈별 변동은 각 실습이 다룬다. 여기는 **전 범위가 동시에 바뀌는 상황**을 훈련한다"를 넣는다
- 훈련 ① 의 `숨는 곳 8종 순회 점검` 은 그대로 둔다 — 12편의 체크리스트가 이 목록에서 나왔다
- `index.mdx` 의 `description` 에 종합 드릴이라는 성격을 반영한다
- 12편 중 아무 lab 이나 가리키는 링크를 하나 걸어 "모듈별 변동은 저기"를 알린다

- [ ] **Step 3: `reference/links.mdx` 에 변동 타깃 열을 더한다**

기존 모듈↔정답지 경로 매핑 표에 `변동 타깃` 열을 추가한다. 값은 Task 1·3~13 의 "변동 사실" 표에서 가져온다.

| 모듈 | 변동 타깃 |
|---|---|
| 01 | set-07 task-1 |
| 02 | set-03 task-1 (보조 set-07) |
| 03 | set-03 task-1 |
| 04 | set-07 task-1 |
| 05 | set-07 task-1 |
| 06 | set-03 task-1 |
| 07 | set-07 task-1 (전체) |
| 09 | set-08 task-2 모듈 3 |
| 10 | set-08 task-2 모듈 4 (보조 set-05) |
| 11 | set-07 task-2 모듈 1 |
| 12 | set-05 task-2 모듈 2 |
| 13 | 짝 없음 — 자체 제작 |

`links.mdx` 서두의 "정답지 X" 설명 옆에 set-05 가 변동 소재로만 쓰인다는 한 줄을 넣는다.

- [ ] **Step 4: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, 링크 경고 0건.

- [ ] **Step 5: 커밋**

```bash
git add src/content/docs/part-6/15-mutation-drill/ src/content/docs/reference/links.mdx
git commit -F - <<'EOF'
docs: 모듈 15 를 종합 드릴로 좁히고 링크 표에 변동 타깃을 더한다

모듈별 변동이 12 편의 실습으로 내려갔으므로 모듈 15 의 30분 치환 드릴은
역할이 겹친다. 지우지 않고 "과제지 전 범위가 동시에 바뀌는 상황"으로
성격을 좁혔다 — 숨는 곳 8종 목록은 12 편의 체크리스트가 나온 원본이라
그대로 뒀다.

reference/links 의 모듈 매핑 표에 변동 타깃 열을 더해 어느 세트로
이행하는지 한 곳에서 보이게 했다.
EOF
```

---

### Task 16: 최종 검증

**Files:** 없음.

- [ ] **Step 1: 전체 빌드**

Run: `npm run build`
Expected: 성공. `starlight-links-validator` 경고 0건.

- [ ] **Step 2: 12편이 모두 골격을 지켰는지 확인한다**

Run:
```bash
for f in src/content/docs/part-1/0{1,2,3}-*/lab.mdx src/content/docs/part-2/0{4,5,6,7}-*/lab.mdx src/content/docs/part-4/{09,10,11,12,13}-*/lab.mdx; do
  echo "== $f"; grep -c "^## " "$f"; grep "^## " "$f" | head -8
done
```
Expected: 각 파일이 `## 실습 목표` 로 시작하고 `## 0.` ~ `## 5.` 여섯 절이 순서대로 이어진다 — 총 7개다. 모듈 13 은 4절의 diff 대상이 자기 자신이지만 절 구성은 같다.

- [ ] **Step 3: 문서 유형 표기를 확인한다**

Run: `grep -L "문서 유형: tutorial" src/content/docs/part-1/*/lab.mdx src/content/docs/part-2/*/lab.mdx src/content/docs/part-4/*/lab.mdx`
Expected: 출력 없음. 하나라도 나오면 그 파일에 `> 문서 유형: tutorial` 이 빠졌다.

- [ ] **Step 4: `theory.mdx` 가 안 바뀌었는지 확인한다**

Task 1 을 시작하기 전 커밋 SHA 를 기준으로 삼는다. 이 계획이 만들어진 시점의 HEAD 를 미리 적어 둔다 — Task 1 Step 1 에서 `git rev-parse HEAD` 로 확인한 값이다.

Run: `git diff --name-only <Task 1 시작 전 SHA> -- 'src/content/docs/**/theory.mdx'`
Expected: 출력 없음. 하나라도 나오면 Global Constraints 를 어긴 것이다.

- [ ] **Step 5: 개발 서버로 눈으로 본다**

`npm run dev` — 이미 떠 있으면 재시작하지 않는다. 12편을 브라우저로 훑고 표가 가로 스크롤 없이 읽히는지, `<details>` 정답이 접혀 있는지, 코드 탭이 두 개인지 본다.

- [ ] **Step 6: 사용자에게 결과를 보고한다**

빌드 결과와 12편 목록을 보고한다. 남은 것 — PART-3·5·6 은 이번 범위 밖이고 PART-5(3과제)는 별도 spec 이 필요하다는 것을 다시 알린다.
