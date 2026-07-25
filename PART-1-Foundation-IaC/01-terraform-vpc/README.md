# 01. Terraform 문법 + VPC (Day 1)

> 문서 유형: 개요

## 학습 목표

- [ ] HCL 블록 구조(블록 타입·라벨 2개·인자)와 참조 주소 5종을 읽고, 참조가 실행 순서를 만든다는 것을 설명할 수 있다
- [ ] provider / variable / tfvars / output / data source / locals / `for_each` / `aws_iam_policy_document` 문법을 남의 코드 없이 직접 쓸 수 있다
- [ ] set-02 기준 VPC(172.16.0.0/16, pub/priv 서브넷 4, IGW, NAT 2, RTB 3)를 백지에서 작성할 수 있다
- [ ] RTB↔서브넷 매핑(공용 public RTB 1개 + AZ별 private RTB 2개)이 채점 대상임을 이해하고 정확히 연결할 수 있다
- [ ] `terraform output -json` + jq 로 값을 뽑아 `.env` 파일로 영속화할 수 있다
- [ ] 비번호(`player_number`) 등 바뀌기 쉬운 값을 변수화하는 습관을 만든다

## 소요 시간 / 일차

- Day 1, 약 4~6시간 (이론 1.5h + 실습 3h + 정답 diff 1h)

## 과금 리소스와 destroy 방침

| 리소스 | 과금 | 방침 |
|---|---|---|
| NAT Gateway ×2 | **시간당 + 데이터 처리량 과금** (가장 큼) | **당일 실습 종료 즉시 `terraform destroy`** |
| EIP ×2 | NAT 에 붙어있는 동안 무료, destroy 시 함께 해제 | destroy 로 자동 정리 |
| VPC/서브넷/IGW/RTB | 무료 | destroy 로 함께 정리 |

**절대 NAT 를 밤새 켜두지 않는다.** 실습을 이어서 하려면 다음 날 다시 apply 한다 (state 가 로컬이므로 apply 만 다시 하면 됨).

## 선행 지식

- 서브넷이 퍼블릭인지 결정하는 것은 이름이 아니라 **연결된 RTB** — [vpc-basics](../../00-prerequisites/vpc-basics.md)
- 프라이빗 인스턴스의 아웃바운드 경로: 프라이빗 RTB → NAT GW → 퍼블릭 RTB → IGW — [vpc-basics](../../00-prerequisites/vpc-basics.md)
- SG는 스테이트풀, NACL은 스테이트리스 — [vpc-basics](../../00-prerequisites/vpc-basics.md)
- `--query`(JMESPath)와 `jq`로 출력에서 값만 뽑는 법 — [awscli-basics](../../00-prerequisites/awscli-basics.md)

막히면 위 링크, 아니면 바로 다음 파일로.

## 선행 모듈

- 없음 (PART-1 첫 모듈). AWS 계정, Terraform ≥ 1.6, AWS CLI 자격증명만 준비.

## 참고 경로 (정답지)

- `skills-2026/set-02/task-1/terraform/vpc.tf` — VPC/서브넷/NAT/RTB 정답
- `skills-2026/set-02/task-1/terraform/variables.tf` — 변수 설계 정답
- `skills-2026/set-02/task-1/terraform/data.tf` — locals·caller_identity 패턴
- `skills-2026/set-02/task-1/terraform/versions.tf` — provider 고정 패턴
- `skills-2026/set-02/task-1/terraform/terraform.tfvars` — 세트 고유값 주입 패턴
- `skills-2026/set-02/task-1/terraform/outputs.tf` — output 설계 정답
- `skills-2026/set-02/task-1/README.md` §"작업 변수 영구화" — output → .env 영속화 실측 절차

## 공식 문서

- [Terraform 언어 레퍼런스](https://developer.hashicorp.com/terraform/language) — 블록·표현식·타입. 문법이 막히면 여기
- [`for_each` 메타 인자](https://developer.hashicorp.com/terraform/language/meta-arguments/for_each) — map/set 반복과 `each` 참조
- [AWS provider 리소스 색인](https://registry.terraform.io/providers/hashicorp/aws/latest/docs) — `aws_vpc`·`aws_subnet`·`aws_route_table` 인자와 반환 속성(Attribute Reference)
- [Terraform CLI 명령](https://developer.hashicorp.com/terraform/cli/commands) — `plan`/`apply`/`output`/`-target` 옵션
- [Amazon VPC 사용 설명서](https://docs.aws.amazon.com/vpc/latest/userguide/) — 라우팅·NAT·엔드포인트 개념 원문
