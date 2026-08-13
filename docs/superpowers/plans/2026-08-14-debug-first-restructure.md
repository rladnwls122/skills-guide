# 디버깅 중심 개편 — 1~2단계 구현 계획 (형식 기준본)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 문서 유형 규칙을 고치고 `build-step` 접이식 스타일을 만든 뒤, 모듈 01 의 `theory.mdx` 와 `lab.mdx` 를 새 계약의 형식 기준본으로 완성한다.

**Architecture:** `theory.mdx` 는 explanation 을 유지한 채 각 개념 절 끝에 접힌 `<details class="build-step">` 를 붙여, 열고 따라오면 set-02 기준본이 완성되게 한다. `lab.mdx` 는 이미 변동 이행 골격(0~5절)으로 재작성돼 있으므로 되돌리지 않고, 0절을 theory 재현 스크립트로 바꾸고 선택이던 배포를 필수로 올린 뒤 오독 복구·장애 진단 절을 잇는다.

**Tech Stack:** Astro Starlight, MDX, Terraform, AWS CLI.

**Spec:** `docs/superpowers/specs/2026-08-14-debug-first-restructure-design.md`

## Global Constraints

- 커밋 메시지는 한국어로 쓰고, 무엇을 왜 바꿨는지를 본문에 남긴다.
- 콘텐츠 파일은 CRLF 다. 스크립트로 `.mdx` 를 다루면 `\r` 을 먼저 지운다.
- `.mdx` 를 새로 추가하면 dev 서버를 재시작한다. 콘텐츠 컬렉션이 갱신되지 않아 404 가 난다. 이 계획은 새 `.mdx` 를 만들지 않으므로 해당 없다.
- Starlight 가 frontmatter 의 `title` 을 렌더한다. 본문에 H1 을 쓰지 않는다.
- 산문에서 사이트 문서를 파일명으로 지칭하지 않는다. 절대 경로 링크(`/reference/troubleshooting/`)를 쓴다.
- 셸 명령은 PowerShell·bash 두 탭으로 준다. `<Tabs syncKey="shell">` + `<TabItem label="PowerShell">` / `<TabItem label="Bash (Linux/CloudShell)">`.
- 소요 시간·리소스 개수는 실측값만 쓴다. 재보지 않은 수치는 쓰지 않는다.
- 기준본 세트는 set-02, 변동 타깃은 set-07 이다. 작업 디렉터리는 `~/set07-lab` 하나로 통일한다 — theory 가 만들고 lab 이 이어 쓴다.
- 접이식 블록 안은 셋으로 제한한다: 실행 명령, 기대 출력, 기대와 다를 때 볼 곳 한 줄. 진단 절차를 쓰지 않는다.

---

### Task 1: 규칙 갱신과 `build-step` 스타일

**Files:**
- Modify: `src/content/docs/reference/style.mdx:33-40` (이 레포 매핑 표)
- Modify: `.claude/rules/docs-style.md` (첫 번째 불릿)
- Create: `src/styles/build-step.css`
- Modify: `astro.config.mjs:125` (`customCss` 배열)

**Interfaces:**
- Produces: `.build-step` CSS 클래스. Task 2·3 이 `<details class="build-step">` 로 쓴다.

- [ ] **Step 1: `style.mdx` 의 매핑 표에 접이식 예외를 넣는다**

`src/content/docs/reference/style.mdx` 의 33~40행 표에서 `theory.mdx` 행과 `lab.mdx` 행을 고치고, 표 아래에 예외 문단을 붙인다.

```mdx
| 파일 | 유형 | 담는 것 | 금지 |
|---|---|---|---|
| 모듈 `theory.mdx` | explanation (+접이식 실행 블록, 끝의 퀴즈) | 원리·왜·채점 관점 | 산문 본문의 절차(단계별 실행 지시) |
| 모듈 `lab.mdx` (PART-1~4) | tutorial (검증 절차는 how-to 성격) | 변동 이행·배포·복구·진단 | 개념 설명 — theory 링크로 대체 |
| `part-N/console-deploy.mdx` | how-to | 콘솔 경로·drift 판단 | 개념 설명 |
| PART-5~6 `lab.mdx` | how-to | 훈련 절차·판정 기준 | 개념 설명 |
| 모듈 `index.mdx` | 개요 | 목표/소요/비용/경로 | 내용 서술 |
| `reference/*.mdx` | reference | 조회용 표·명령·매핑 | 설명·훈련 지침 |
| `start/*.mdx` | explanation | 선수 지식 요약+퀴즈 | — |

#### theory 의 접이식 실행 블록 — 유형 혼합 금지의 유일한 예외

theory 는 개념 절 끝에 `<details class="build-step">` 를 하나 붙일 수 있다. 읽는 사람이 그 절의
리소스를 눈으로 보게 하는 장치이고, 절마다 열고 따라오면 기준본 인프라가 완성된다.

예외가 성립하는 조건은 둘이다.

- **기본 상태가 접힘이다.** 블록을 열지 않는 사람에게 그 문서는 그대로 explanation 이다.
  `open` 속성을 붙이지 않는다.
- **블록 안이 셋으로 제한된다.** 실행 명령, 기대 출력, 기대와 다를 때 볼 곳 한 줄. 진단
  절차와 원인 분석은 `lab.mdx` 소관이다.

과금이 붙는 리소스를 띄우는 블록은 첫 줄에 과금 사실과 예상 비용을 적는다. 그리고 그 문서
끝에 띄운 것을 지우는 정리 절을 둔다.
```

- [ ] **Step 2: `.claude/rules/docs-style.md` 의 첫 불릿을 고친다**

기존:

```markdown
- 한 문서에 Diátaxis 유형을 섞지 않는다. `theory` = explanation, `lab` = tutorial(PART-5 는 how-to), `index` = 개요, `reference/*` = reference, `start/*` = explanation.
```

바꾼 뒤:

```markdown
- 한 문서에 Diátaxis 유형을 섞지 않는다. `theory` = explanation, `lab` = tutorial(PART-5~6 은 how-to), `part-N/console-deploy` = how-to, `index` = 개요, `reference/*` = reference, `start/*` = explanation.
- **유일한 예외 — theory 의 접이식 실행 블록.** 개념 절 끝에 `<details class="build-step">` 를 붙여 그 절의 리소스를 띄우게 할 수 있다. 조건은 둘이다: 기본 상태가 접힘일 것(`open` 금지), 블록 안이 실행 명령·기대 출력·안 나올 때 볼 곳 한 줄 셋으로 제한될 것. 과금 리소스를 띄우면 블록 첫 줄에 비용을 적고 문서 끝에 정리 절을 둔다. 근거는 `style.mdx` A 절.
```

- [ ] **Step 3: `src/styles/build-step.css` 를 만든다**

`diagram-note.css` 와 다른 모양이어야 한다. `diagram-note` 는 도식에 붙어 위쪽 테두리가 없지만, `build-step` 은 문단 흐름 안에 독립해 서고 실행 블록임을 알리는 왼쪽 강조선을 갖는다.

```css
/* 개념 절 끝에 붙는 접이식 실행 블록 (`<details class="build-step">`).
 *
 * theory 는 explanation 이라 산문에 절차를 쓰지 않는다. 이 블록만 예외다 —
 * 기본이 접힘이라 열지 않는 사람에게는 문서가 그대로 설명으로 읽힌다.
 * 근거는 reference/style.mdx 의 A 절.
 *
 * diagram-note 와 구분되는 것: 도식에 붙지 않고 문단 흐름 안에 독립해 서며,
 * 실행 블록임을 알리는 왼쪽 강조선을 갖는다. */

.build-step {
	margin: 1rem 0 1.5rem;
	border: 1px solid var(--sl-color-hairline, var(--sl-color-gray-5));
	border-left: 3px solid var(--sl-color-accent);
	border-radius: 0.5rem;
	background: var(--sl-color-bg-sidebar, var(--sl-color-gray-6));
	font-size: var(--sl-text-sm);
}

.build-step > summary {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.6rem 0.9rem;
	color: var(--sl-color-white);
	font-weight: 600;
	cursor: pointer;
	list-style: none;
	user-select: none;
}

.build-step > summary::-webkit-details-marker {
	display: none;
}

/* 삼각형은 직접 그린다 — 기본 마커는 브라우저마다 위치가 다르다. */
.build-step > summary::before {
	content: '';
	width: 0;
	height: 0;
	border-left: 0.35rem solid currentColor;
	border-top: 0.28rem solid transparent;
	border-bottom: 0.28rem solid transparent;
	transition: transform 0.15s ease;
}

.build-step[open] > summary::before {
	transform: rotate(90deg);
}

.build-step > summary:hover {
	color: var(--sl-color-accent-high);
}

.build-step > :not(summary) {
	margin: 0 0 0.75rem;
	padding: 0 0.9rem;
	line-height: 1.7;
}

.build-step > :not(summary):first-of-type {
	margin-top: 0.15rem;
}

/* 탭·코드블록은 자체 여백을 갖는다. 이중 패딩을 막는다. */
.build-step .expressive-code,
.build-step starlight-tabs {
	padding: 0 0.9rem;
	margin-bottom: 0.75rem;
}

@media (max-width: 50rem) {
	.build-step > summary {
		padding: 0.6rem 0.7rem;
	}

	.build-step > :not(summary),
	.build-step .expressive-code,
	.build-step starlight-tabs {
		padding: 0 0.7rem;
	}
}
```

- [ ] **Step 4: `astro.config.mjs` 의 `customCss` 에 등록한다**

`'./src/styles/diagram-note.css',` 바로 아래 줄에 넣는다. 순서가 의미를 갖는 배열이므로 형제 옆에 둔다.

```javascript
      './src/styles/diagram-note.css',
      './src/styles/build-step.css',
      './src/styles/mobile.css',
```

- [ ] **Step 5: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공. `starlight-links-validator` 경고 0건. CSS 파일 추가만으로는 링크가 안 바뀌므로 이 단계에서 새 경고가 나오면 `style.mdx` 편집이 링크를 깨뜨린 것이다.

mise 셸 통합이 없으면 `mise exec -- npm run build` 로 돌린다.

- [ ] **Step 6: 커밋**

```bash
git add src/content/docs/reference/style.mdx .claude/rules/docs-style.md src/styles/build-step.css astro.config.mjs
git commit -F - <<'EOF'
docs: theory 의 접이식 실행 블록을 유형 혼합 금지의 예외로 명시한다

theory 가 explanation 이라 절차를 못 써서, 읽는 사람이 개념을 눈으로
확인하지 못한 채 다음 절로 넘어갔다. 개념 절 끝에 접힌 실행 블록을
허용하되 조건을 둘로 묶는다 — 기본이 접힘일 것, 안이 실행·기대 출력·
안 나올 때 볼 곳 셋으로 제한될 것. 열지 않는 사람에게는 문서가 그대로
설명으로 남는다.

blockquote 로는 실행 블록임이 드러나지 않아 build-step 클래스와 왼쪽
강조선을 준다. diagram-note 와 달리 도식에 붙지 않고 문단 흐름 안에
독립해 선다.
EOF
```

---

### Task 2: 모듈 01 theory — 접이식 실행 블록과 정리 절

**Files:**
- Modify: `src/content/docs/part-1/01-terraform-vpc/theory.mdx`

**Interfaces:**
- Consumes: Task 1 의 `.build-step` 클래스.
- Produces: `~/set07-lab` 작업 디렉터리에 set-02 기준본이 선 상태. Task 3 의 `lab.mdx` 0절이 이 결과를 전제한다.

**설계 근거 — 왜 절마다 띄우는 대상이 다른가**

1~4절은 HCL 문법 절이라 띄울 리소스가 없다. 대신 `terraform console` 과 `plan` 으로 값과 확장 결과를 즉시 본다. 과금이 0 이다. 5절에서 처음 `apply` 하고, 6절이 그 산출물로 `.env` 를 만든다. 과금 경고는 5절 블록에만 붙는다.

spec 13절이 남긴 "theory 가 정답 코드를 어디까지 보여주나"는 여기서 정한다. **theory 가 다루는 것은 기준본 set-02 이고, lab 이 감추는 것은 타깃 set-07 이다.** 서로 다른 세트라 theory 가 set-02 코드를 통째로 복사시켜도 이행 훈련은 헐거워지지 않는다.

- [ ] **Step 1: 문서 앞머리에 학습 경로 안내를 넣는다**

`> 문서 유형: explanation` 아래, 첫 절이 시작하기 전에 넣는다.

```mdx
:::tip[읽으면서 띄운다]
각 절 끝에 **지금 띄우기** 블록이 접혀 있다. 열고 따라오면 절마다 set-02 기준본이 한 조각씩 쌓여, 6절에서 완성된다. 블록을 열지 않고 읽어도 문서는 그대로 이어진다.

1~4절은 `terraform console` 과 `plan` 으로 값만 확인한다 — **과금 0원**이다. 실제 생성은 5절부터이고 그 블록에 비용을 적어 두었다. 끝나면 문서 맨 아래 [정리](#정리--이-문서에서-띄운-것-지우기)를 반드시 돌린다.
:::
```

- [ ] **Step 2: 1절 끝에 작업 사본과 `init` 블록을 붙인다**

`## 1. provider / versions` 절 본문 끝, `## 2.` 헤딩 바로 앞에 넣는다.

````mdx
<details class="build-step">
<summary>지금 띄우기 — 작업 사본과 provider 내려받기</summary>

정답지를 아직 안 받았다면 [Day 0 §4 저장소 클론](/start/#4-저장소-클론)을 먼저 한다. 정답지를 직접 고치지 않도록 작업 사본을 뜬다. 이 디렉터리는 [01 실습](/part-1/01-terraform-vpc/lab/)이 그대로 이어 쓴다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  Copy-Item -Recurse $HOME\skills-2026\set-02\task-1\terraform $HOME\set07-lab
  cd ~\set07-lab
  terraform init
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  cp -r ~/skills-2026/set-02/task-1/terraform ~/set07-lab
  cd ~/set07-lab
  terraform init
  ```
  </TabItem>
</Tabs>

기대: `Terraform has been successfully initialized!` 와 함께 `Installing hashicorp/aws v...` 줄이 나온다. 그 버전이 `versions.tf` 의 `required_providers` 범위 안이다.

`Unable to locate credentials` 나 `ExpiredToken` 이면 [awscli-basics](/start/awscli-basics/)의 `aws configure` 를 다시 밟는다.

</details>
````

- [ ] **Step 3: 2절 끝에 `terraform console` 로 변수·locals 를 찍는 블록을 붙인다**

`## 2. variable / tfvars / locals` 절 끝에 넣는다.

````mdx
<details class="build-step">
<summary>지금 띄우기 — 변수와 locals 값 확인</summary>

`terraform console` 은 아무것도 만들지 않고 값만 평가한다. 위에서 읽은 변수·locals 가 실제로 무엇이 되는지 본다.

```bash
terraform console
```

프롬프트가 뜨면 한 줄씩 넣는다.

```hcl
var.vpc_cidr
var.subnets
local.public_subnet_keys
```

기대: `var.vpc_cidr` 이 `"172.16.0.0/16"`, `var.subnets` 가 키 4개짜리 map, `local.public_subnet_keys` 가 퍼블릭 서브넷 키 2개짜리 tuple 로 나온다. `exit` 로 빠져나온다.

`local.public_subnet_keys` 가 빈 tuple 이면 `subnets` map 의 `tier` 값이 `public` 이 아닌 것이다.

</details>
````

- [ ] **Step 4: 3절 끝에 data source 조회 블록을 붙인다**

`## 3. data source / aws_iam_policy_document` 절 끝에 넣는다.

````mdx
<details class="build-step">
<summary>지금 띄우기 — data source 가 실제로 무엇을 받아오나</summary>

data source 는 리소스를 만들지 않고 **읽는다**. console 이 이것을 즉시 평가한다.

```bash
terraform console
```

```hcl
data.aws_caller_identity.current.account_id
```

기대: 지금 자격증명의 12자리 계정 ID 가 문자열로 나온다. `aws sts get-caller-identity --query Account --output text` 의 출력과 같아야 한다.

`NoCredentialProviders` 가 나오면 코드가 아니라 자격증명 문제다 — [awscli-basics](/start/awscli-basics/).

</details>
````

- [ ] **Step 5: 4절 끝에 `for_each` 확장을 세는 블록을 붙인다**

`## 4. for_each` 절 끝에 넣는다.

````mdx
<details class="build-step">
<summary>지금 띄우기 — `for_each` 가 몇 개로 펼쳐지나</summary>

`plan` 은 만들지 않고 계획만 낸다. `for_each` 한 블록이 리소스 몇 개가 되는지 여기서 센다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  terraform plan -no-color |
    Select-String -Pattern '^  # aws_subnet\.' |
    Measure-Object | Select-Object -ExpandProperty Count
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  terraform plan -no-color | grep -c '^  # aws_subnet\.'
  ```
  </TabItem>
</Tabs>

기대: `4`. `subnets` map 의 키 개수와 같다. 계획 전체는 `Plan: 20 to add` 로 끝난다 — VPC 1 + IGW 1 + 서브넷 4 + EIP 2 + NAT 2 + RTB 3 + route 3 + association 4 다.

수가 다르면 `subnets` map 을 먼저 센다. `toset()` 없이 list 에 `for_each` 를 걸면 계획 자체가 실패한다.

</details>
````

- [ ] **Step 6: 5절 끝에 실제 `apply` 블록을 붙인다 — 비용 경고 포함**

`## 5. VPC 아키텍처 (set-02 :badge[실측]{variant=note})` 절 끝에 넣는다.

````mdx
<details class="build-step">
<summary>지금 띄우기 — VPC 를 실제로 만든다 (과금 시작)</summary>

:::danger[여기서 비용이 붙는다]
NAT 게이트웨이 2개와 Elastic IP 2개가 **시간당 과금**된다. 서울 리전 NAT 는 개당 시간당 약 0.059 USD 로, 두 개를 하루 8시간 켜 두면 약 1 USD 다. 데이터 처리 요금은 별도다. 이 문서를 끝내면 맨 아래 [정리](#정리--이-문서에서-띄운-것-지우기)를 반드시 돌린다.
:::

```bash
terraform apply
```

기대: `Apply complete! Resources: 20 added.` NAT 생성 때문에 2~3분 걸린다.

실제로 섰는지는 AWS 쪽에 물어서 확인한다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  aws ec2 describe-vpcs --filters "Name=tag:Name,Values=wskorea26-vpc" --query 'Vpcs[].CidrBlock' --output text
  aws ec2 describe-nat-gateways --query 'NatGateways[?State==`available`].Tags[?Key==`Name`].Value' --output text
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  aws ec2 describe-vpcs --filters "Name=tag:Name,Values=wskorea26-vpc" --query 'Vpcs[].CidrBlock' --output text
  aws ec2 describe-nat-gateways --query 'NatGateways[?State==`available`].Tags[?Key==`Name`].Value' --output text
  ```
  </TabItem>
</Tabs>

기대: 첫 명령이 `172.16.0.0/16`, 둘째가 `book-ngw-c` 와 `book-ngw-d`.

`apply` 가 중간에 멈춰도 만든 것을 지우지 않는다. state 에 기록된 것은 건너뛰므로 `terraform apply` 를 그대로 다시 돌리면 나머지만 만든다.

</details>
````

- [ ] **Step 7: 6절 끝에 output 과 `.env` 블록을 붙인다**

`## 6. output → .env 영속화` 절 끝에 넣는다.

````mdx
<details class="build-step">
<summary>지금 띄우기 — output 을 꺼내 `.env` 로 굳힌다</summary>

`output` 은 apply 가 끝난 뒤에만 값이 있다. 5절을 마친 상태에서 실행한다.

```bash
terraform output
terraform output -json private_subnet_ids
```

기대: `vpc_id` · `public_subnet_ids` · `private_subnet_ids` · `account_id` 네 개가 나오고, 두 번째 명령이 서브넷 이름을 키로 갖는 JSON 객체를 낸다.

`No outputs found` 면 apply 를 안 했거나 다른 디렉터리에 있는 것이다. `terraform output` 은 state 를 읽지 코드를 읽지 않는다.

</details>
````

- [ ] **Step 8: 정리 절을 퀴즈 앞에 넣는다**

`## 자기 점검 퀴즈` 헤딩 바로 앞에 넣는다. 규칙상 심화 내용이 퀴즈보다 앞이다.

````mdx
## 정리 — 이 문서에서 띄운 것 지우기

5절에서 `apply` 를 했다면 창을 닫기 전에 반드시 돌린다. NAT 게이트웨이와 Elastic IP 는 쓰지 않아도 시간당 과금된다.

```bash
terraform destroy
```

기대: `Destroy complete! Resources: 20 destroyed.`

Elastic IP 는 NAT 가 사라져도 계정에 남아 요금이 붙는 일이 있다. 한 번 더 확인한다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  aws ec2 describe-addresses --query 'Addresses[].PublicIp' --output text
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  aws ec2 describe-addresses --query 'Addresses[].PublicIp' --output text
  ```
  </TabItem>
</Tabs>

기대: 빈 출력.

:::note[실습을 이어서 할 거라면]
[01 실습](/part-1/01-terraform-vpc/lab/)은 이 코드를 그대로 이어 쓴다. 바로 이어서 한다면 `destroy` 는 실습을 마친 뒤에 한 번만 돌린다. 코드는 `~/set07-lab` 에 남으므로 지웠어도 다음 날 `terraform apply` 로 다시 세우면 된다.
:::

계정 전체에 남은 것은 [잔존 리소스 점검](/reference/cleanup-check/)이 훑는다.
````

- [ ] **Step 9: import 문을 확인한다**

`theory.mdx` 상단 import 는 이미 `import { Tabs, TabItem } from '@astrojs/starlight/components';` 를 갖고 있다. `<details>` 는 소문자 HTML 이라 import 가 필요 없다. Step 2~8 이 `Tabs`·`TabItem` 외의 컴포넌트를 쓰지 않았는지 확인하고, 안 쓰는 import 를 새로 넣지 않는다.

- [ ] **Step 10: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공. `starlight-links-validator` 경고 0건. 새로 넣은 링크는 `/start/#4-저장소-클론` · `/start/awscli-basics/` · `/part-1/01-terraform-vpc/lab/` · `/reference/cleanup-check/` 넷과 문서 안 앵커 `#정리--이-문서에서-띄운-것-지우기` 다.

앵커가 경고에 걸리면 헤딩의 실제 slug 를 확인해 링크를 맞춘다. Starlight 는 `## 정리 — 이 문서에서 띄운 것 지우기` 의 em dash 를 제거하고 공백을 하이픈으로 바꾸므로 연속 하이픈이 생긴다.

- [ ] **Step 11: 브라우저로 접이식 모양을 확인한다**

`npm run dev` 는 데몬화된다. 이미 떠 있는지 먼저 확인하고, 아니면 띄운다. 종료는 `npx astro dev stop`.

`/part-1/01-terraform-vpc/theory/` 를 열어 확인한다.

- 블록 여섯 개가 전부 **접힌 채로** 그려진다
- summary 왼쪽 삼각형이 열 때 90도 돈다
- 블록 안 `<Tabs>` 가 좌우로 삐져나오지 않는다
- 라이트·다크 양쪽에서 왼쪽 강조선과 글자가 읽힌다

- [ ] **Step 12: 커밋**

```bash
git add src/content/docs/part-1/01-terraform-vpc/theory.mdx
git commit -F - <<'EOF'
docs: 01 이론에 절마다 접이식 실행 블록과 정리 절을 넣는다

문법 절을 읽어도 그 문법이 무엇을 만드는지 보지 못한 채 다음 절로
넘어갔다. 절 끝마다 접힌 실행 블록을 붙여, 열고 따라오면 set-02
기준본이 한 조각씩 쌓이게 한다.

1~4절은 terraform console 과 plan 으로 값만 확인해 과금이 0 이고,
실제 생성은 5절부터다. 비용 경고를 그 블록에 붙이고 문서 끝에 정리
절을 뒀다 — 지금까지 destroy 는 실습에만 있어 이론만 따라 한 사람이
NAT 를 남겼다.

작업 디렉터리를 실습과 같은 ~/set07-lab 으로 맞춰 실습 0절이 이
결과를 그대로 이어받는다.
EOF
```

---

### Task 3: 모듈 01 lab — 0절 교체, 배포 필수화, 복구·진단 절 신설

**Files:**
- Modify: `src/content/docs/part-1/01-terraform-vpc/lab.mdx:36-69` (0절), `:232-243` (5절과 끝)

**Interfaces:**
- Consumes: Task 2 가 만든 `~/set07-lab` 의 set-02 기준본.

**되돌리지 않는다.** 1~4절(변동 과제지·이행·통과 기준·복기)은 `f577318` 이 쓴 그대로 둔다. 고치는 것은 0절과 5절뿐이다.

- [ ] **Step 1: 0절을 theory 재현 스크립트로 바꾼다**

36~69행을 통째로 아래로 교체한다. 레포 런북 링크가 아니라 사이트 안에서 서게 한다.

````mdx
## 0. 기준본 세우기

set-02 의 1과제 Terraform 구성이 선 상태에서 시작한다.

[01 이론](/part-1/01-terraform-vpc/theory/)의 **지금 띄우기** 블록을 절마다 따라왔다면 `~/set07-lab` 이 이미 서 있다. 그대로 2절로 간다.

아직이라면 아래를 한 덩어리로 돌린다. 이론 블록 여섯 개를 합친 것이다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  Copy-Item -Recurse $HOME\skills-2026\set-02\task-1\terraform $HOME\set07-lab
  cd ~\set07-lab
  terraform version              # >= 1.6
  aws sts get-caller-identity    # 자격증명 확인
  terraform init
  terraform apply
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  cp -r ~/skills-2026/set-02/task-1/terraform ~/set07-lab
  cd ~/set07-lab
  terraform version              # >= 1.6
  aws sts get-caller-identity    # 자격증명 확인
  terraform init
  terraform apply
  ```
  </TabItem>
</Tabs>

기대: `Apply complete! Resources: 20 added.` NAT 생성으로 2~3분 걸린다.

`Unable to locate credentials` 나 `ExpiredToken` 이 나오면 코드를 고치기 전에 자격증명부터 잡는다 — [awscli-basics](/start/awscli-basics/)의 `aws configure` 절차를 다시 밟는다.

:::danger[여기서 과금이 시작된다]
NAT 게이트웨이 2개와 Elastic IP 2개가 시간당 과금된다. 5·6절이 배포된 상태를 전제하므로 이 실습은 배포까지 간다. 끝나면 7절 정리를 반드시 돌린다.

시간이 없어 3절까지만 할 거라면 `terraform apply` 를 빼고 `init` 까지만 한다 — 3절의 `grep` 과 `plan` 판정은 배포 없이도 전부 된다. 대신 5·6절은 못 한다.
:::

정답지를 아직 안 받았다면 [Day 0 §4 저장소 클론](/start/#4-저장소-클론)을 먼저 한다. 저장소는 **홈 디렉터리 아래**에 받는다 — 이 가이드의 경로는 전부 클론 루트 `~/skills-2026` 기준이다. PowerShell 에서 `cd` 는 `~` 를 직접 처리하지만, `Copy-Item`·`git` 처럼 외부 프로그램에 경로를 **인자로** 넘길 때는 `$HOME` 을 쓴다. 리눅스·CloudShell 은 `~` 가 인자 자리에서도 풀린다.
````

- [ ] **Step 2: 실습 목표 체크박스에 배포 이후 항목을 더한다**

18~24행의 `## 실습 목표` 목록 끝에 두 줄을 붙인다.

```mdx
- [ ] 이행본을 `apply` 하고, 이름 접두어를 잘못 읽었을 때 무엇이 in-place 로 고쳐지고 무엇이 재생성인지 `plan` 출력으로 판정한다
- [ ] 라우트 테이블 연결이 끊긴 상태에서 증상만 보고 원인을 좁힌다
```

- [ ] **Step 3: 5절 제목에서 "선택" 을 떼고 필수 배포 절로 바꾼다**

232~240행을 교체한다.

````mdx
## 5. 배포와 채점 확인

이행한 코드를 실제로 올린다. 6·7절이 배포된 상태를 전제한다.

```bash
terraform apply
```

기대: `Apply complete!` 기준본에서 이행본으로 가는 것이라 전량 신규 생성이 아니다. 서브넷 4개는 CIDR 이 바뀌어 **재생성**되고, VPC 는 CIDR 이 바뀌므로 VPC 부터 통째로 다시 만들어진다. `plan` 출력의 `# forces replacement` 줄이 어디에 붙는지 apply 전에 먼저 읽는다 — 6절이 이것을 다룬다.

배포했다면 [set-07 채점 스크립트](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-07/task-1/mark.sh)를 CloudShell VPC Environment `unicorn-mark` 에서 실행해 1-1-A ~ 1-3-A 를 확인한다.
````

- [ ] **Step 4: 6절 — 과제지 오독 복구를 신설한다**

Step 3 의 5절 뒤에 붙인다. 소재는 2절 "놓치기 쉬운 자리 목록"에서 뽑았다. 지어낸 것이 아니라 set-02→set-07 이행에서 실제로 놓치는 자리다.

````mdx
## 6. 과제지 오독 복구

이행을 마치고 apply 까지 했는데 과제지를 다시 읽어 보니 값이 다르다. 대회 당일 가장 자주 오는 순간이다. 이때 물어야 할 것은 하나다 — **고쳐서 살리나, 부수고 다시 만드나, 몇 분 걸리나.**

판정 축은 넷이다. 아래 세 상황을 각각 어디에 넣을지 먼저 답하고 실행한다.

| 판정 | 무엇으로 아나 | 비용 |
|---|---|---|
| in-place | `plan` 에 `~ update in-place` | 초 |
| 재생성, 의존 없음 | `plan` 에 `-/+ destroy and then create` + `# forces replacement` | 분 |
| 재생성, 의존 딸림 | 위와 같되 다른 리소스가 함께 `-/+` 로 끌려온다 | 십분 |
| 전면 재생성 | 최상위 리소스가 `forces replacement` — 하위가 전부 따라온다 | 20분 이상 |

### 6-1. 이름 접두어를 잘못 읽었다

**상황.** 라우트 테이블 이름을 `unicorn-rt-priv` 가 아니라 `unicorn-rtb-priv` 로 만들어 apply 했다. mark 1-2-A 가 `Name` 태그로 필터링하므로 조회 자체가 빈다.

**판정.** 고쳐서 `plan` 을 낸다.

```bash
terraform plan
```

기대: `~ update in-place` 로 `tags.Name` 한 줄만 바뀐다. `forces replacement` 는 나오지 않는다. 라우트 테이블의 `Name` 태그는 식별자가 아니라 태그이기 때문이다.

**복구.** `terraform apply` 로 끝난다. 수 초다.

**교훈.** 이름이 태그로만 쓰이는 리소스는 언제든 고칠 수 있다. 라우트 테이블·서브넷·VPC·NAT 의 `Name` 이 전부 여기 해당한다. 급할 때 뒤로 미뤄도 되는 종류다.

### 6-2. CIDR 을 잘못 계산했다

**상황.** Zero Subnet 허용을 못 읽고 Public 을 `10.97.1.0/24`·`10.97.2.0/24`·`10.97.3.0/24` 로 1번부터 세어 apply 했다. 과제지는 0번부터다.

**판정.** 올바른 CIDR 로 고치고 `plan` 을 낸다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  terraform plan -no-color | Select-String -Pattern 'forces replacement|# aws_' | Select-Object -First 20
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  terraform plan -no-color | grep -E 'forces replacement|# aws_' | head -20
  ```
  </TabItem>
</Tabs>

기대: `cidr_block` 줄 옆에 `# forces replacement` 가 붙고, 해당 `aws_subnet` 세 개가 `-/+` 로 잡힌다. 서브넷 CIDR 은 변경 불가 속성이다.

**파급.** 서브넷만 지워지지 않는다. `aws_route_table_association` 이 그 서브넷을 참조하므로 함께 재생성되고, 퍼블릭 서브넷을 지목하는 `aws_nat_gateway` 와 그 EIP 도 끌려온다. `plan` 출력에서 `-/+` 가 붙은 리소스를 전부 센다.

**복구.** `terraform apply`. NAT 재생성이 있어 2~3분 걸린다.

**교훈.** 재생성이지만 VPC 는 살아 있다. 위 표의 "재생성, 의존 딸림" 이다. 아프지만 당일에 감당할 수 있다.

### 6-3. VPC CIDR 자체를 잘못 읽었다

**상황.** `10.97.0.0/16` 을 `10.79.0.0/16` 으로 뒤집어 읽고 apply 했다.

**판정.**

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  terraform plan -no-color | Select-String -Pattern 'Plan: |forces replacement'
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  terraform plan -no-color | grep -E 'Plan: |forces replacement'
  ```
  </TabItem>
</Tabs>

기대: `aws_vpc.this` 의 `cidr_block` 에 `forces replacement` 가 붙고, `Plan:` 줄의 destroy 수가 지금 떠 있는 리소스 전량과 같다. VPC 가 재생성되면 그 안의 모든 것이 따라 죽는다.

**복구.** `terraform apply` 로 되지만 NAT 3개를 새로 만드느라 오래 걸린다. 뒤 모듈이 이 VPC 를 쓰고 있다면 EKS 클러스터까지 전부 다시다.

**교훈.** 위 표의 "전면 재생성"이다. **VPC CIDR·리전·클러스터 이름은 만들기 전에 두 번 확인한다.** 이 셋은 틀리면 되돌리는 데 드는 시간이 처음부터 다시 만드는 시간과 같다. 과제지를 받으면 이 셋부터 tfvars 에 적고 시작한다.
````

- [ ] **Step 5: 7절 — 장애 진단을 신설한다**

````mdx
## 7. 장애 진단

정상으로 선 상태에서 일부러 고장을 내고 증상만 보고 좁혀 간다. **주입 명령과 복구 명령이 짝으로 있다** — 주입만 하고 덮어 두지 않는다.

### 7-1. 프라이빗 서브넷에서 외부로 나가지 못한다

**주입.** 프라이빗 라우트 테이블 하나에서 기본 라우트를 지운다. `<rtb-id>` 는 아래 첫 명령이 알려준다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  aws ec2 describe-route-tables --filters "Name=tag:Name,Values=unicorn-rt-priv-a" --query 'RouteTables[].RouteTableId' --output text
  aws ec2 delete-route --route-table-id <rtb-id> --destination-cidr-block 0.0.0.0/0
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  aws ec2 describe-route-tables --filters "Name=tag:Name,Values=unicorn-rt-priv-a" --query 'RouteTables[].RouteTableId' --output text
  aws ec2 delete-route --route-table-id <rtb-id> --destination-cidr-block 0.0.0.0/0
  ```
  </TabItem>
</Tabs>

**증상.** 그 서브넷에 뜨는 파드가 이미지를 못 받아 `ImagePullBackOff` 가 되거나, EC2 가 `yum`·`apt` 에서 멈춘다. PART-2 로 넘어가면 이 증상으로 먼저 만난다.

**좁히는 순서.** 위에서 아래로, 한 계층씩만 확인한다.

1. **어느 서브넷인가** — 문제 자원의 서브넷 ID 를 먼저 확정한다. 다른 AZ 는 멀쩡하다는 사실이 첫 단서다
2. **그 서브넷에 붙은 라우트 테이블** — `aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=<subnet-id>"`
3. **그 테이블의 기본 라우트** — 출력의 `Routes` 에 `DestinationCidrBlock: 0.0.0.0/0` 항목이 있는지. 없으면 여기가 원인이다
4. 있는데도 안 나가면 그때 NAT 상태와 보안 그룹으로 내려간다

이 순서를 건너뛰고 보안 그룹부터 보는 것이 가장 흔한 시간 낭비다. **라우팅이 없으면 보안 그룹은 볼 필요가 없다.**

**복구.** Terraform 이 실제 상태와 코드의 차이를 알아서 메운다.

```bash
terraform plan
terraform apply
```

기대: `plan` 이 `aws_route.private_nat["..."]` 하나를 `+ create` 로 잡는다. 콘솔·CLI 로 지운 것을 코드가 되돌리는 이 동작이 drift 복구다.

증상별 처방 목록은 [트러블슈팅](/reference/troubleshooting/)에 있다.

### 7-2. 서브넷 태그가 사라져 로드밸런서가 안 붙는다

**주입.** 퍼블릭 서브넷에서 디스커버리 태그를 지운다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  aws ec2 describe-subnets --filters "Name=tag:Name,Values=unicorn-subnet-pub-a" --query 'Subnets[].SubnetId' --output text
  aws ec2 delete-tags --resources <subnet-id> --tags Key=kubernetes.io/role/elb
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  aws ec2 describe-subnets --filters "Name=tag:Name,Values=unicorn-subnet-pub-a" --query 'Subnets[].SubnetId' --output text
  aws ec2 delete-tags --resources <subnet-id> --tags Key=kubernetes.io/role/elb
  ```
  </TabItem>
</Tabs>

**증상.** PART-2 에서 `Ingress` 를 만들어도 ALB 가 안 생기고, AWS Load Balancer Controller 로그에 서브넷을 못 찾는다는 줄이 남는다. 여기서는 태그 조회로 먼저 본다.

**좁히는 순서.**

1. **태그가 실제로 있나** — `aws ec2 describe-subnets --filters "Name=tag-key,Values=kubernetes.io/role/elb" --query 'Subnets[].Tags[?Key==\`Name\`].Value' --output text`
2. 기대는 퍼블릭 서브넷 3개 전부. 하나라도 빠지면 그 AZ 에 로드밸런서가 못 선다
3. 코드에 태그가 있는데 실제에 없으면 콘솔에서 지워진 것이다. 코드에도 없으면 애초에 안 쓴 것이다 — 이쪽이면 6절 오독 복구 문제로 넘어간다

**복구.**

```bash
terraform apply
```

기대: `~ update in-place` 로 `tags` 한 줄만 되돌아온다.

**교훈.** 태그는 in-place 라 복구가 싸다. 그런데 없으면 **다른 서비스가 조용히 실패한다.** 실패 지점과 원인 지점이 멀어서 좌하가 어렵다. PART-2 에서 ALB 가 안 생기면 여기부터 본다.
````

- [ ] **Step 6: 기존 끝맺음을 7절 뒤 정리 절로 바꾼다**

기존 236~242행의 `:::danger[이 모듈만 따로 배포할 필요는 없다]` 블록과 마지막 문단을 지우고 아래로 교체한다. 배포가 필수가 됐으므로 "배포할 필요 없다"는 서술은 더 이상 맞지 않는다.

````mdx
## 8. 정리

창을 닫기 전에 반드시 돌린다. NAT 게이트웨이 3개와 Elastic IP 3개, Interface Endpoint 3종(AZ 3개면 ENI 9개)이 전부 시간당 과금이다.

```bash
terraform destroy
```

기대: `Destroy complete!`

Elastic IP 는 NAT 가 사라져도 계정에 남는 일이 있다. 한 번 더 확인한다.

<Tabs syncKey="shell">
  <TabItem label="PowerShell">
  ```powershell
  aws ec2 describe-addresses --query 'Addresses[].PublicIp' --output text
  ```
  </TabItem>
  <TabItem label="Bash (Linux/CloudShell)">
  ```bash
  aws ec2 describe-addresses --query 'Addresses[].PublicIp' --output text
  ```
  </TabItem>
</Tabs>

기대: 빈 출력. 코드는 `~/set07-lab` 에 남으므로 다음 날 `terraform apply` 로 다시 세운다.

막히면 [트러블슈팅](/reference/troubleshooting/), 계정 전체 점검은 [잔존 리소스 점검](/reference/cleanup-check/)이다.
````

- [ ] **Step 7: `variation-drill` 링크가 살아 있는지 확인한다**

Run: `grep -n "variation-drill\|troubleshooting\|cleanup-check" src/content/docs/part-1/01-terraform-vpc/lab.mdx`
Expected: `/reference/troubleshooting/` 과 `/reference/cleanup-check/` 이 8절에 한 번씩. 중복 링크가 남았으면 지운다.

- [ ] **Step 8: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공. `starlight-links-validator` 경고 0건.

- [ ] **Step 9: 브라우저로 확인한다**

`/part-1/01-terraform-vpc/lab/` 을 열어 0절부터 8절까지 번호가 이어지는지, 표와 탭이 안 깨지는지 본다.

- [ ] **Step 10: 커밋**

```bash
git add src/content/docs/part-1/01-terraform-vpc/lab.mdx
git commit -F - <<'EOF'
docs: 01 실습을 배포 뒤 오독 복구와 장애 진단까지 잇는다

이행과 plan 까지만 하면 대회 당일 시간을 잡아먹는 구간을 지나친다.
이미 만들어 놓고 과제지를 잘못 읽은 것을 발견했을 때 고쳐서 살릴지
부수고 다시 만들지 판단하는 것, 그리고 떠 있는 인프라의 증상에서
원인을 좁히는 것이 그 구간이다.

0절이 레포 런북으로 넘기던 기준본 세우기를 이론 재현 스크립트로
바꿔 사이트 안에서 선다. 선택이던 배포를 필수로 올리고, 6절에
plan 의 forces replacement 로 판정하는 오독 복구 3건, 7절에 주입과
복구가 짝인 장애 진단 2건을 넣었다.

6-3 의 VPC CIDR 오독이 이 절의 핵심이다 — 되돌리는 시간이 처음부터
다시 만드는 시간과 같은 값이 무엇인지 몸으로 알게 한다.

1~4절은 f577318 이 쓴 변동 이행 골격 그대로 둔다.
EOF
```

---

## 형식 검토 게이트

Task 3 까지 끝나면 **멈춘다.** 나머지 12개 모듈로 확산하기 전에 사용자에게 형식을 확인받는다.

확인받을 것.

1. 접이식 블록의 밀도 — 절마다 하나가 맞나, 아니면 실제 리소스를 만드는 절에만 두나
2. 1~4절이 `console`·`plan` 으로 값만 보는 구성이 다른 모듈에도 되나 — 04 eksctl 처럼 `plan` 이 없는 모듈은 대체 확인 수단이 필요하다
3. 6절 오독 복구를 모듈당 3건으로 유지할지
4. 7절 장애 진단의 주입 명령을 CLI 로 할지 Terraform 코드 수정으로 할지 — CLI 주입은 drift 를 만들어 복구가 `terraform apply` 하나로 끝나는 장점이 있다
5. `lab.mdx` 가 8절까지 늘어난 분량이 감당되나

승인 뒤 spec 10절 4단계(모듈 04·05)로 간다.
