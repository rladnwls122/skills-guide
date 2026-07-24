# 04. 실습 — set-02 클러스터 생성

> 문서 유형: tutorial

## 목표

- [ ] terraform output → 환경변수 → cluster.rendered.yaml 렌더 파이프라인을 손으로 완주
- [ ] `eksctl create cluster` 로 wskorea26-cluster 생성 (~20분)
- [ ] mark 5-1 ~ 5-3 채점 명령을 직접 실행해 기대 출력과 대조
- [ ] (실패 대비) 부분 복구 명령 4종을 알고 있다

전제: PART-1에서 `set-02/task-1/terraform` 이 apply 되어 있고 `.env.ps1` 이 존재한다.
없다면 `terraform apply -var "player_number=<비번호>"` 후 README 배포 순서 1)의 영속화 블록을 실행.

## 1. 환경변수 로드 + 렌더

```powershell
cd C:\Users\kryuk\practice\skills-2026\set-02\task-1
. .\.env.ps1                      # terraform output 영속 파일

cd eksctl
$c = Get-Content cluster.yaml -Raw
foreach ($v in 'VPC_ID','PRIV_SUBNET_C','PRIV_SUBNET_D','CLUSTER_EXTRA_SG_ID','NODE_SG_ID',
               'EKS_KMS_ARN','BOOK_APP_POLICY_ARN','LBC_POLICY_ARN','FLUENT_BIT_POLICY_ARN') {
  $c = $c.Replace('${' + $v + '}', [Environment]::GetEnvironmentVariable($v))
}
$c | Set-Content cluster.rendered.yaml
```

**검증 — 치환 누락 grep:**

```powershell
Select-String '\$\{' cluster.rendered.yaml
```

기대 출력: **아무것도 없음**. 한 줄이라도 나오면 해당 변수가 env에 없는 것 — `.env.ps1` 재확인.

## 2. 클러스터 생성 (~20분)

```powershell
eksctl create cluster -f cluster.rendered.yaml
```

기대 출력(말미):

```
[✓]  EKS cluster "wskorea26-cluster" in "ap-northeast-2" region is ready
```

대기 중 CloudFormation 콘솔에서 `eksctl-wskorea26-cluster-cluster` → `-addon-...` → `-nodegroup-...` 스택 순서를 관찰해 둔다(트러블슈팅 감각).

```powershell
aws eks update-kubeconfig --region ap-northeast-2 --name wskorea26-cluster
kubectl get nodes --show-labels | Select-String node-type
```

기대 출력: 노드 4개, `node-type=addon` 2 + `node-type=app` 2.

## 3. 채점 항목 셀프 검증 (mark 5-1 ~ 5-4)

```powershell
# 5-1 버전 + 로그 5종
aws eks describe-cluster --name wskorea26-cluster --query "cluster.[name,version]" --output text
aws eks describe-cluster --name wskorea26-cluster --query "sort(cluster.logging.clusterLogging[?enabled==``true``].types[])" --output text
```

기대: `wskorea26-cluster 1.35` / `api audit authenticator controllerManager scheduler`

```powershell
# 5-2 KMS 별칭 + 서브넷 이름 (채점지 원문은 bash — CloudShell에서 그대로 실행 가능)
aws eks describe-cluster --name wskorea26-cluster --query "cluster.encryptionConfig[0].provider.keyArn" --output text
```

기대: `wskorea26-eks-key`의 ARN (별칭 역조회는 채점지 5-2-A 명령 참조).

```powershell
# 5-3 노드그룹 이름/타입/tags.Name
foreach ($ng in 'wskorea26-addon-ng','wskorea26-app-ng') {
  aws eks describe-nodegroup --cluster-name wskorea26-cluster --nodegroup-name $ng `
    --query "nodegroup.[nodegroupName,instanceTypes[0],tags.Name]" --output text
}
```

기대:

```
wskorea26-addon-ng      t3.medium       wskorea26-addon-node
wskorea26-app-ng        t3.medium       wskorea26-app-node
```

```powershell
# 5-4 사전 점검: kube-system 파드(aws-node/kube-proxy 제외)가 전부 addon 노드인가
kubectl get pod -n kube-system -o wide
```

기대: coredns 2개가 addon 노드 위. `eks-pod-identity-agent`, `metrics-server`가 **보이면 안 된다**.

## 4. 함정 정리

| 함정 | 증상 | 예방 |
|---|---|---|
| `${VAR}` 치환 누락 | eksctl이 서브넷/SG를 못 찾고 실패 | grep 검사 필수 (1절) |
| Pod Identity 사용 | agent가 app 노드에 떠서 mark 5-4 감점 | set-02는 IRSA 고정 |
| 기본 애드온 자동설치 | metrics-server가 app 노드 스케줄 → 5-4 감점 | `addonsConfig.disableDefaultAddons: true` |
| coredns 노드 미고정 | coredns가 app 노드로 → 5-4 감점 | `configurationValues` nodeSelector |
| `tags.Name`만 쓰고 instanceName 누락 | EC2 인스턴스 Name 태그 미적용 | 둘 다 유지 (역할이 다름) |
| version 따옴표 없이 `1.35` | YAML이 float로 파싱 | `version: "1.35"` |
| 생성 도중 중단 | 스택 일부만 존재 | 아래 부분 복구 |

**부분 복구 (생성 중단 시):**

```powershell
eksctl utils associate-iam-oidc-provider --cluster wskorea26-cluster --approve   # OIDC
eksctl create iamserviceaccount -f cluster.rendered.yaml --approve               # IAM SA
eksctl create nodegroup -f cluster.rendered.yaml --include=<ng-name>             # NodeGroup
eksctl create addon -f cluster.rendered.yaml                                     # Addon
```

## 5. 통과 기준 (mark 대응)

- [ ] mark 5-1: 이름/버전/로그 5종 정확 일치
- [ ] mark 5-2: KMS 별칭 `alias/wskorea26-eks-key`, 서브넷 `wskorea26-priv-subnet-c wskorea26-priv-subnet-d`
- [ ] mark 5-3: NG 2개 이름·t3.medium·tags.Name·priv 서브넷 정확 일치
- [ ] mark 5-4 사전조건: kube-system에 coredns만 addon 노드, 불청객 DaemonSet 없음

## 6. 정리

> **05로 바로 이어가면 클러스터 유지 (README destroy 방침 예외).**

당일 종료 시:

```powershell
eksctl delete cluster -f cluster.rendered.yaml --disable-nodegroup-eviction
# terraform 리소스(VPC 등)는 PART-2 전체 종료 전까지 유지 가능 — NAT 시간당 과금은 인지할 것
```
