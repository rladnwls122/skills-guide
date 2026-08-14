# 디버깅 중심 개편 — 4단계 구현 계획 (모듈 04·05, 런북형 검증)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모듈 01 에서 정한 형식(theory 접이식 + lab 0~8절)이 **런북형 모듈에서도 서는지** 검증한다. 대상은 04 eksctl 클러스터와 05 워크로드·ALB 다.

**Architecture:** 01 은 Terraform 모듈이라 `console`·`plan` 으로 과금 없이 값을 볼 수 있었다. 04·05 는 그 수단이 없고 실제 생성이 20분 + 시간당 과금이다. 그래서 **theory 접이식은 `--dry-run` 계열까지만 하고 실제 생성은 lab 0절이 전담**한다. 0절은 명령을 통째로 옮겨 적지 않고 정답지 런북과 매니페스트의 GitHub 링크를 단다 — 사이트가 런북을 두 벌 갖지 않게 한다.

**Tech Stack:** Astro Starlight, MDX, eksctl, kubectl, Helm, AWS CLI.

**Spec:** `docs/superpowers/specs/2026-08-14-debug-first-restructure-design.md` 10절 4단계
**선행:** `docs/superpowers/plans/2026-08-14-debug-first-restructure.md`(1~3단계, 완료)

## 형식 검토 게이트 결과 (2026-08-14 승인)

| 질문 | 결정 |
|---|---|
| 접이식 블록 밀도 | **띄울 것이 있는 절에만.** "절마다 하나"는 상한이지 의무가 아니다 |
| `plan` 이 없는 모듈의 확인 수단 | **`eksctl create cluster --dry-run`**. 05 는 `kubectl --dry-run=server`·`helm template` |
| 고장 주입 방식 | **CLI·kubectl 주입.** drift 가 생겨 복구가 재적용 한 번으로 끝나는 것까지 같이 가르친다 |
| 04·05 lab 기존 절 | **전면 재작성.** `변형 셀프 체크` 는 spec 9절대로 흡수해 삭제 |
| 실제 생성 | **정답지 GitHub 링크를 단다** (`https://github.com/ishs-cloud-computing/skills-2026/blob/main/...`) |

## Global Constraints

- 커밋 메시지는 한국어로 쓰고, 무엇을 왜 바꿨는지를 본문에 남긴다.
- 콘텐츠 파일은 CRLF 다. 스크립트로 `.mdx` 를 다루면 `\r` 을 먼저 지운다.
- 이 계획은 새 `.mdx` 를 만들지 않는다. dev 서버 재시작이 필요 없다.
- Starlight 가 frontmatter 의 `title` 을 렌더한다. 본문에 H1 을 쓰지 않는다.
- 산문에서 사이트 문서를 파일명으로 지칭하지 않는다. 절대 경로 링크를 쓴다. 정답지 **레포** 파일은 반대로 GitHub 링크를 단다.
- 셸 명령은 PowerShell·bash 두 탭. `<Tabs syncKey="shell">` + `<TabItem label="PowerShell">` / `<TabItem label="Bash (Linux/CloudShell)">`.
- **소요 시간·리소스 개수는 실측값만.** 04·05 는 AWS 실행 검증을 못 했다. 정답지 코드와 `mark.sh` 에서 도출되는 것(개수·이름·판정 축)만 쓰고, 재보지 않은 분 단위 수치는 쓰지 않는다. 기존 문서에 이미 있는 "약 20분"은 정답지 README 가 적어 둔 값이라 유지한다.
- 접이식 블록 안은 셋으로 제한한다: 실행 명령, 기대 출력, 기대와 다를 때 볼 곳 한 줄.

## 근거 — 실제로 대조한 변동 (2026-08-14 diff)

### 모듈 04: `set-02/task-1/eksctl/cluster.yaml` → `set-07/task-1/eksctl/cluster.yaml`

| 항목 | set-02 (기준본) | set-07 (타깃) |
|---|---|---|
| 파드 자격증명 | IRSA (`iam.withOIDC` + `serviceAccounts` 3개) | **Pod Identity** (`podIdentityAssociations` 4개) |
| 엔드포인트 | `clusterEndpoints` public+private | **`privateCluster.enabled: true`** + `skipEndpointCreation` |
| 프라이빗 서브넷 | 2개 (c/d) | **3개** (a/b/c) |
| 노드 라벨 키 | `node-type: addon\|app` | `unicorn: addon\|app` |
| KMS | EKS 전용 키 | **Platform CMK 통합** + `volumeKmsKeyID` |
| 애드온 | `disableDefaultAddons: true`, 버전 미지정 | **버전 명시 고정** + `eks-pod-identity-agent` + `aws-ebs-csi-driver` |
| 시간대 | 없음 | `preBootstrapCommands` YAML 앵커로 **KST** |
| 노드 SG | `securityGroups.attachIDs` | 위 + `vpc.sharedNodeSecurityGroup` |
| 운용 위치 | 본 PC 에서 kubectl | **SSM bastion** (private 이라 본 PC 가 API 에 못 닿는다) |

**교육적으로 가장 센 것은 IRSA → Pod Identity 반전이다.** 현행 04 theory·lab 은 "Pod Identity 를 쓰면 mark 5-4 감점"을 반복해 가르치는데, set-07 은 정확히 그 반대를 요구한다. 규칙이 아니라 **판단 기준**을 가르쳐야 한다는 것이 이 변동의 핵심이다.

### 모듈 05: `k8s/app/*` + `terraform/alb.tf`

| 항목 | set-02 | set-07 |
|---|---|---|
| 앱 ALB | `internal = false` | **`internal = true`** — CloudFront VPC Origin 경유만 |
| ServiceAccount | eksctl 이 생성(IRSA) → manifest 없음 | **`k8s/app/00-serviceaccount.yaml` 신설** (Pod Identity 는 SA 를 안 만든다) |
| 네임스페이스 | `wskorea26` / `monitoring` | `unicorn` / `monitoring` + **`logging` 분리** |
| 이미지 태그 | `${ECR}:stable` | `${ECR}:v1.0.0` |
| StorageClass | 없음 (EBS CSI 미설치) | **`01-storageclass.yaml` 신설** |
| nodeSelector | `node-type: app` | `unicorn: app` |

채점이 이 변동을 직접 잰다 — `mark.sh 8-1-A` 가 ALB `Scheme` 을 보고, **`8-5-A` 는 ALB DNS 로 직접 POST 해서 막히는지를 잰다**(`|| echo "000"`). internal 로 바꾸지 않으면 이 항목이 뚫린다.

---

### Task 1: 모듈 04 theory — 접이식 실행 블록

**Files:**
- Modify: `src/content/docs/part-2/04-eksctl-cluster/theory.mdx`

**Interfaces:**
- Consumes: 1단계의 `.build-step` 클래스.
- Produces: 없음. **이 문서는 아무것도 만들지 않는다** — 그래서 정리 절도 없다.

**설계 근거 — 왜 04 theory 는 apply 까지 가지 않나**

01 theory 는 5절에서 `terraform apply` 까지 갔다. 04 는 안 간다. `eksctl create cluster` 는 정답지 README 기준 약 20분이고 그 동안 이론을 읽을 수 없다. 클러스터는 떠 있는 내내 과금된다. 그래서 04 theory 의 블록은 **`--dry-run` 과 스키마 조회처럼 과금이 0 인 것만** 담고, 실제 생성은 lab 0절이 한 번만 한다.

블록은 절마다 두지 않는다. 2절(인증 3방식)은 클러스터가 있어야 확인되므로 블록이 없다 — 그 확인은 lab 5절이 한다.

- [ ] **Step 1: 문서 앞머리에 학습 경로 안내를 넣는다**

`> 문서 유형: explanation` 과 교재 원본 줄 아래에 넣는다. 01 과 달리 **과금이 0 이라는 것과 실제 생성은 실습 소관이라는 것**을 명시한다.

```mdx
:::tip[읽으면서 확인한다]
절 끝에 **지금 확인하기** 블록이 접혀 있다. 열고 따라오면 `cluster.yaml` 이 실제로 무엇으로 펼쳐지는지 눈으로 본다. 블록을 열지 않고 읽어도 문서는 그대로 이어진다.

01 과 달리 **이 문서는 아무것도 만들지 않는다.** 전부 `--dry-run` 과 스키마 조회라 과금이 0 이다. 클러스터를 실제로 세우는 것은 [04 실습](/part-2/04-eksctl-cluster/lab/)이다 — 생성에 약 20분이 걸리고 떠 있는 내내 과금되므로 한 번만 세운다.
:::
```

- [ ] **Step 2: 1절 끝에 `--dry-run` 으로 ClusterConfig 를 펼쳐 보는 블록을 붙인다**

`## 1. eksctl ClusterConfig 구조` 의 ④ 변형 포인트 표 뒤, `---` 앞에 넣는다.

블록 내용의 뼈대:
- 정답지 [`set-02/task-1/eksctl/cluster.yaml`](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-02/task-1/eksctl/cluster.yaml) 링크
- `eksctl create cluster -f cluster.yaml --dry-run` — 치환 전 파일로도 스키마 검증이 된다
- 기대: eksctl 이 기본값을 채워 넣은 완전한 ClusterConfig 가 stdout 으로 나온다. 원문에 없던 `iam.vpcResourceControllerPolicy` 같은 필드가 붙는다
- 안 나올 때: `Error: loading config file` 이면 YAML 들여쓰기, `unknown field` 면 eksctl 버전

- [ ] **Step 3: 3절 끝에 노드그룹 확장 결과를 세는 블록을 붙인다**

`## 3. 노드그룹 2분할` 끝. 01 의 "`for_each` 가 몇 개로 펼쳐지나"와 같은 자리다.

- `--dry-run` 출력에서 `managedNodeGroups` 항목 수와 `labels`·`instanceName` 을 뽑아 센다 (PowerShell `Select-String`, bash `grep`)
- 기대: 노드그룹 2개, 라벨 `node-type: addon` / `node-type: app`, `instanceName` 2개
- 안 나올 때: `tags.Name` 과 `instanceName` 이 헷갈린 것 — 3절 함정 ① 로 되돌아간다

- [ ] **Step 4: 4절 끝에 치환 → 누락 검사 블록을 붙인다**

`## 4. ${VAR} 플레이스홀더 치환` 끝. 지금 lab 1절에 있는 렌더 명령이 원래 여기 있어야 할 내용이다. **lab 에서 지우고 여기로 옮기는 것이 아니라**, theory 는 "치환이 무엇을 하나"를 보고 lab 0절은 정답지 런북을 그대로 실행한다.

- `.env.ps1` 로드 → 치환 → `Select-String '\$\{'` / `grep '\${'`
- 기대: **출력 없음**
- 안 나올 때: 남은 변수 이름이 그대로 찍히므로 그 변수가 `.env.ps1` 에 있는지 본다
- 4절 퀴즈가 이미 "dry-run 은 치환 누락을 못 잡는다"고 가르치므로, 블록도 grep 이 먼저이고 dry-run 이 나중임을 지킨다

- [ ] **Step 5: 2절 변형 포인트 표에 set-07 열을 더한다**

2절 표가 지금 set-02 ↔ set-03 만 대조한다. lab 이 set-07 로 이행시키므로 근거가 문서 안에 있어야 한다. `privateCluster.enabled` · `podIdentityAssociations` · `aws-ebs-csi-driver` 세 줄을 set-07 실측으로 채운다.

- [ ] **Step 6: 빌드로 검증한다**

Run: `npm run build`
Expected: 성공, `starlight-links-validator` 경고 0건. 새 링크는 GitHub 절대 URL 이라 검증 대상이 아니고, 사이트 내부 링크는 `/part-2/04-eksctl-cluster/lab/` 하나다.

- [ ] **Step 7: 커밋**

```
docs: 04 이론에 dry-run 접이식 블록을 넣고 set-07 대조를 더한다
```

---

### Task 2: 모듈 04 lab — 변동 이행·복구·진단으로 전면 재작성

**Files:**
- Rewrite: `src/content/docs/part-2/04-eksctl-cluster/lab.mdx`

**Interfaces:**
- Consumes: Task 1 의 theory 블록(선택), 01 실습이 만든 VPC.
- Produces: set-07 스펙의 클러스터. 05 lab 이 이어 쓴다.

**목표 골격**

```
## 0. 기준본 세우기      set-02 클러스터. 정답지 README GitHub 링크 + 최소 명령
## 1. 변동 과제지        set-07 스펙 차이만 산문. 정답 YAML 은 보여주지 않는다
## 2. 이행 (타이머)      학습자가 직접. 절차 지시 없음
## 3. 통과 기준          치환 누락 grep · --dry-run · set-07 mark 대응표
## 4. 복기              정답 diff, 놓친 곳 분류
## 5. 배포와 채점 확인    eksctl create · mark 대응 명령
## 6. 과제지 오독 복구    A-1 ~ A-3
## 7. 장애 진단          B-1 ~ B-2
## 8. 정리
```

- [ ] **Step 1: 0절 — 기준본 세우기**

지금 0절이 `.env.ps1` 영속화 블록을 30줄 넘게 인라인으로 갖고 있다. 그것이 정답지 README 3)·1) 과 같은 내용이라 두 벌이다. 정답지 링크로 대체하고 사이트에는 **검증 명령만** 남긴다.

- [`set-02/task-1/README.md`](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-02/task-1/README.md) 의 `1)` `3)` 을 그대로 실행하라고 지시
- `.env.ps1` 이 왜 필요한지 한 문단 (theory 4절 링크)
- 선 것을 확인하는 명령: `kubectl get nodes --show-labels`
- 기대: 노드 4개, `node-type=addon` 2 + `node-type=app` 2
- 과금 경고 `:::danger` — 클러스터는 떠 있는 내내 과금이고 6·7절이 이 상태를 전제한다

- [ ] **Step 2: 1절 — 변동 과제지**

set-07 요구를 산문으로만 쓴다. **`cluster.yaml` 을 보여주지 않는다.**

- 컨트롤 플레인이 외부에서 닿으면 안 된다 → 본 PC 에서 kubectl 이 끊긴다는 파생 결과까지 스스로 발견하게 둔다
- 파드는 OIDC 가 아니라 EKS 가 직접 자격증명을 중계해야 한다
- 프라이빗 서브넷 3개 AZ 분산
- 노드 볼륨까지 플랫폼 CMK 로 암호화
- 모든 노드 시간대 KST
- 노드 라벨 키가 바뀐다
- EBS 볼륨을 쓰는 워크로드가 생긴다
- `실전 참조 — 막히면 여는 곳` 을 이 변동에 맞게 다시 쓴다: `eksctl utils schema`, [schema.eksctl.io](https://schema.eksctl.io/), `privateCluster` 스키마 항목

- [ ] **Step 3: 2절 — 이행 (타이머)**

절차를 쓰지 않는다. 고쳐야 할 파일과 시간만 준다. 놓치기 쉬운 자리를 **질문 형태로만** 남긴다 (답을 쓰지 않는다).

- [ ] **Step 4: 3절 — 통과 기준**

배포 없이 되는 판정만 여기 둔다.

1. 치환 누락 grep — 출력 0줄
2. `eksctl create cluster -f cluster.rendered.yaml --dry-run` 통과
3. set-07 mark 대응표 — [`set-07/task-1/mark.sh`](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-07/task-1/mark.sh) 의 해당 항목이 무엇을 보는지
4. `privateCluster.enabled: true` 를 켜면 `clusterEndpoints` 를 함께 지웠는지 — 둘이 공존하면 eksctl 이 거부한다

- [ ] **Step 5: 4절 — 복기**

[`set-07/task-1/eksctl/cluster.yaml`](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-07/task-1/eksctl/cluster.yaml) 과 diff. 놓친 곳을 셋으로 분류한다: 과제지를 못 읽은 것 / 읽었는데 어디를 고칠지 못 찾은 것 / 찾았는데 문법을 틀린 것.

- [ ] **Step 6: 5절 — 배포와 채점 확인**

`eksctl create cluster` (약 20분). 기존 lab 2절의 `ROLLBACK_COMPLETE` 재시도 `:::danger` 블록을 여기로 살려 온다 — 지우기 아까운 실전 지식이다.

**private 클러스터가 되면 본 PC 에서 kubectl 이 끊긴다**는 것을 여기서 마주하게 한다. 정답지가 SSM bastion 을 쓰는 이유이고, [`set-07/task-1/README.md`](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-07/task-1/README.md) 의 `3)` `4)` 가 그 절차다. 링크로 넘긴다.

- [ ] **Step 7: 6절 — 과제지 오독 복구 3건**

판정 축은 01 과 같되 **`terraform plan` 이 없으므로 "대응하는 modify API 가 있는가"로 판정**한다(spec 3절). 표를 그렇게 다시 쓴다.

| 판정 | 무엇으로 아나 | 비용 |
|---|---|---|
| 즉시 수정 | `aws eks update-*` 또는 `eksctl utils update-*` 가 있다 | 초~분 |
| 노드그룹 교체 | 노드그룹만 지우고 다시 만든다 | 분 |
| 클러스터 재생성 | `create` 외에 방법이 없다 | 처음 만든 시간 그대로 |

- **6-1. 로그 종류를 빼먹었다** — `eksctl utils update-cluster-logging` 이 있다. 즉시 수정. 판정 근거는 `aws eks update-cluster-config` 가 `logging` 을 받는다는 사실
- **6-2. 노드 라벨 키를 `node-type` 그대로 뒀다** — `eksctl` 은 managed NG 의 라벨을 `eksctl utils update-labels` 로 고칠 수 있으나, **워크로드의 `nodeSelector` 와 짝이라 한쪽만 고치면 파드가 Pending 된다.** 파급을 세는 훈련
- **6-3. 클러스터 이름을 잘못 읽었다** — `metadata.name` 에는 modify API 가 없다. 전면 재생성이고 05 가 만든 것까지 전부 따라 죽는다. **이름·리전은 만들기 전에 두 번 확인한다**는 교훈이 01 6-3 과 같은 자리다

- [ ] **Step 8: 7절 — 장애 진단 2건 (kubectl 주입)**

- **7-1. coredns 가 app 노드로 내려왔다** — 주입 `kubectl patch deployment coredns -n kube-system` 으로 nodeSelector 제거. 증상은 `kubectl get pod -n kube-system -o wide` 에서 app 노드에 뜬 coredns. 좁히는 순서는 파드 → 노드 라벨 → nodeSelector → 애드온 `configurationValues`. 복구는 애드온 재적용
- **7-2. 파드가 AWS API 에서 AccessDenied 를 받는다** — 주입 `aws eks delete-pod-identity-association`(또는 IRSA 어노테이션 제거). 증상은 앱 로그의 AccessDenied. 좁히는 순서는 파드 로그 → SA 이름 → association 존재 → 역할 trust. **코드가 아니라 신원을 먼저 본다**가 이 항목의 교훈
- 주입 명령마다 복구 명령을 짝으로 적는다

- [ ] **Step 9: 8절 — 정리**

`eksctl delete cluster --disable-nodegroup-eviction`. 05 로 이어 갈 거면 남긴다는 기존 예외를 유지한다. 남은 CloudFormation 스택 확인 명령과 [잔존 리소스 점검](/reference/cleanup-check/) 링크.

- [ ] **Step 10: `변형 셀프 체크` 삭제 확인**

Run: `grep -n "변형 셀프 체크" src/content/docs/part-2/04-eksctl-cluster/lab.mdx`
Expected: 0건. 6절이 같은 질문을 손으로 하게 하므로 답을 두 번 주지 않는다.

- [ ] **Step 11: 빌드 + 브라우저 확인**

`npm run build` 통과. `/part-2/04-eksctl-cluster/lab/` 에서 0~8절 번호가 이어지는지 본다.

- [ ] **Step 12: 커밋**

```
docs: 04 실습을 set-07 이행과 배포 뒤 복구·진단으로 바꾼다
```

---

### Task 3: 모듈 05 theory — 접이식 실행 블록

**Files:**
- Modify: `src/content/docs/part-2/05-k8s-workloads-alb/theory.mdx`

- [ ] **Step 1: 1절 끝에 `--dry-run=server` 블록을 붙인다**

`## 1. 프로덕션급 Deployment` 끝. [`set-02/task-1/k8s/app/deployment.yaml`](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-02/task-1/k8s/app/deployment.yaml) 을 `kubectl apply --dry-run=server` 로 넘긴다.

- **`--dry-run=server` 는 API 서버가 검증까지 하되 저장하지 않는다.** `--dry-run=client` 와의 차이를 여기서 가르친다 — client 는 스키마만, server 는 admission·기본값까지 본다
- 기대: `deployment.apps/... created (server dry run)`
- 안 나올 때: 클러스터가 없으면 server dry-run 자체가 안 된다. 04 lab 0절이 선행이다

- [ ] **Step 2: 3절 끝에 LBC helm 렌더 블록을 붙인다**

`## 3. AWS Load Balancer Controller + TargetGroupBinding 패턴` 끝.

- `helm template` 으로 설치하지 않고 매니페스트만 뽑는다 — 과금 0
- 기대: `Deployment`·`ServiceAccount`·`ClusterRole` 과 TargetGroupBinding CRD 가 나온다
- `--set clusterName` 을 빼면 컨트롤러가 어느 클러스터인지 몰라 기동 후 조용히 실패한다는 한 줄

- [ ] **Step 3: 4절 변형 포인트에 internal ALB 를 더한다**

`## 4. ALB 리스너 규칙` 의 변형 표에 set-07 의 `internal = true` + CloudFront VPC Origin 을 넣는다. lab 이 이행시킬 변동이므로 근거가 여기 있어야 한다.

- [ ] **Step 4: 빌드 + 커밋**

```
docs: 05 이론에 dry-run·helm template 접이식 블록을 넣는다
```

---

### Task 4: 모듈 05 lab — 변동 이행·복구·진단으로 전면 재작성

**Files:**
- Rewrite: `src/content/docs/part-2/05-k8s-workloads-alb/lab.mdx`

**Interfaces:**
- Consumes: 04 lab 이 세운 클러스터.

골격은 Task 2 와 같은 0~8절이다.

- [ ] **Step 1: 0절 — 기준본 세우기**

set-02 워크로드가 뜬 상태. [`set-02/task-1/README.md`](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-02/task-1/README.md) 의 `4)` `5)` 링크 + 확인 명령(`kubectl get pod -n wskorea26 -o wide`, 타깃그룹 healthy).

- [ ] **Step 2: 1절 — 변동 과제지**

- 앱 ALB 는 인터넷에서 직접 닿으면 안 되고 CDN 을 거쳐야 한다
- 파드 자격증명 방식이 바뀌어 ServiceAccount 를 **직접 만들어야 한다**
- 네임스페이스가 바뀌고 로깅이 분리된다
- 이미지 태그가 고정 버전이 된다
- 노드 라벨 키가 바뀐다(04 와 짝)

- [ ] **Step 3: 2절 — 이행 (타이머)**

- [ ] **Step 4: 3절 — 통과 기준**

`kubectl --dry-run=server` · 치환 누락 grep · [`set-07/task-1/mark.sh`](https://github.com/ishs-cloud-computing/skills-2026/blob/main/set-07/task-1/mark.sh) `8-1-A`·`8-5-A` 대응표.

**`8-5-A` 를 명시적으로 다룬다** — ALB DNS 로 직접 POST 했을 때 응답이 오면 감점이다. "되는지"가 아니라 "안 되는지"를 재는 채점 항목이라 감각이 뒤집힌다.

- [ ] **Step 5: 4절 — 복기**

[`set-07/task-1/k8s/`](https://github.com/ishs-cloud-computing/skills-2026/tree/main/set-07/task-1/k8s) 와 diff.

- [ ] **Step 6: 5절 — 배포와 채점 확인**

- [ ] **Step 7: 6절 — 과제지 오독 복구 3건**

- **6-1. 네임스페이스를 기준본대로 뒀다** — 네임스페이스는 변경 불가다. 리소스를 다시 만들어야 하고 **TargetGroupBinding 도 따라온다**. 파급을 세는 훈련
- **6-2. ALB 를 internet-facing 으로 만들었다** — `Scheme` 은 ALB 생성 후 변경 불가다. ALB 재생성이고 CloudFront VPC Origin 과 TargetGroupBinding 이 함께 끌려온다
- **6-3. 이미지 태그를 `stable` 로 뒀다** — `kubectl set image` 로 초 단위 수정. 가장 싼 축이라는 대조군

- [ ] **Step 8: 7절 — 장애 진단 2건**

- **7-1. 타깃그룹이 unhealthy 다** — 주입 `kubectl patch` 로 readinessProbe 경로를 없는 경로로. 증상은 `describe-target-health` 의 `Target.ResponseCodeMismatch`. 좁히는 순서는 타깃 등록 여부 → 파드 Ready → 프로브 경로 → SG. **등록도 안 됐는데 프로브를 보는 것이 흔한 시간 낭비**
- **7-2. 파드가 Pending 이다** — 주입 `kubectl patch` 로 `nodeSelector` 를 없는 라벨로. 증상은 `kubectl describe pod` 의 `didn't match Pod's node affinity/selector`. 좁히는 순서는 describe 이벤트 → 노드 라벨 → nodeSelector. 04 의 6-2 와 같은 뿌리임을 링크로 잇는다

- [ ] **Step 9: 8절 — 정리**

- [ ] **Step 10: `변형 셀프 체크` 삭제 확인 · 빌드 · 커밋**

```
docs: 05 실습을 internal ALB 이행과 배포 뒤 복구·진단으로 바꾼다
```

---

## 확산 게이트

Task 4 까지 끝나면 **멈춘다.** 런북형에서 형식이 섰는지 확인받고 spec 10절 5단계(02·03·06·07·08)로 간다.

확인받을 것.

1. 0절이 정답지 GitHub 링크로 넘기는 방식이 읽히나 — 01 은 사이트 안에서 세우고 04·05 는 링크로 넘긴다. 이 비대칭이 납득되나
2. theory 가 아무것도 만들지 않는 모듈(04·05)과 만드는 모듈(01)이 섞이는 것이 괜찮나
3. 6절 판정 축을 모듈마다 다시 쓰는 것(01=`plan`, 04=modify API 유무)이 맞나
4. 실측 없이 분 단위 수치를 안 쓴 결과가 문서에서 허전하지 않나

## 미해결

- **AWS 실행 검증을 못 했다.** 6·7절의 주입·복구 명령은 정답지 코드와 `mark.sh` 에서 도출한 것이다. 실행 가능한 계정이 생기면 이 두 절만 따로 검증한다.
- 모듈 04 의 SSM bastion 절차를 사이트가 얼마나 흡수할지. 지금은 정답지 README 링크로 넘겼다. PART-3 모듈 08(Private EKS)이 같은 문제를 다시 만나므로 그때 함께 정한다.
