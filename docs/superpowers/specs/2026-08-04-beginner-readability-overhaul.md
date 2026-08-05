# 초심자 가독성 전면 개편 — 진단과 6차 계획

날짜: 2026-08-04
상태: 완료 (차수 1~6 전부 커밋. 2026-08-05 랜딩 브랜딩 정정으로 종료)

## 왜

사용자 체감: "기술 설명은 자세한데 대회 훈련을 시작한 사람이 읽기에 너무 어렵다."
실례 3건(키 정책 Principal 역할, `"Resource": "*"` 가 키 자신을 뜻하는 이유, SSE-KMS 정의)에서 출발해
감사 5개(용어 정의·전제지식 대조·구조/항행·lab 실행 가능성·문장 난도)를 돌려 원인을 확정했다.

## 진단 요약 (감사 5개 종합, 심각도 순)

1. **항행·순서 붕괴** — `sidebar` frontmatter 가 74편 중 0편이라 알파벳순 정렬. 모듈마다
   `index → lab → theory` 로 뜨고 "다음" 버튼도 lab 을 먼저 가리킨다(17개 모듈 전부).
   start 의 첫 "다음"은 최난도 autoscaling-basics. 선수 학습 체인은 3갈래로 끊겨 있고
   hcl-basics 는 어떤 문서도 "다음"으로 가리키지 않는 고아. eks-basics 는 이미 읽은
   awscli 로 순환. 자가진단 표 1~6번은 내부 문서 대신 외부 워크숍만 안내.
2. **lab 착수 불가** — 정답지 저장소 `skills-2026` 를 받는 방법이 사이트 전체 0건.
   저자 로컬 경로(`C:\Users\kryuk\...`) 하드코딩 17건. `.env.ps1` 변수 체인 단절
   (01 lab 은 2개 저장, 04 lab 은 9개 전제). `$ACCOUNT_ID`·`$env:NUM`·`$env:ECR` 미정의 사용.
   `terraform apply` 실패 대처가 어느 lab 에도 없고 part-1·2 는 troubleshooting/cleanup 링크 0건.
   05 lab 이 이미지 빌드를 06 lab 이라고 오지시(실제는 03). `rm -rf ~/.aws` 를 경고 없이 지시.
3. **용어 정의 구멍** — ARN·CIDR 접두사(`/16`)·AZ 는 사이트 어디에도 정의가 없다(첫 문서부터 사용).
   Principal 은 일반 정의 없이 신뢰 정책 맥락으로만 등장. SSE-KMS 정의는 s3-basics 에 있는데
   읽기 순서가 kms → s3 라 사용이 정의보다 앞선다. kms-basics 는 주제인 root-less 키 정책의
   실물 JSON 이 없고 키 정책 `"Resource": "*"`(= 이 키 자신)를 언급하지 않는다.
   DynamoDB(PK·GSI)·Prometheus/Grafana 는 start 문서 자체가 없어 part-1/03·part-2/06 이 공중에 뜬다.
4. **되돌아갈 길 부재** — 선행 지식 안내는 모듈 index 에만 있고 theory 17·lab 17편의 역링크 0건.
   theory 본문의 `/start/` 링크는 7편 중 1개.
5. **문장 난도** — 한 문장에 새 정보 3개+, 괄호 속 핵심 정의(QoS·CRD), 4중 부정
   (part-1/02 theory 185행), 표 셀에 문단급 정보. 밀집 3편: part-2/05 · part-1/02 · part-2/07.
6. **밀도·경계** — theory 400줄+ 6편(최장 part-1/02 665줄), Day 12 하루 1,692줄,
   start 13편 합계 4,272줄인데 Day 0 공지는 "반나절". 봉투 암호화·root-less·HCL 문법이
   start 와 theory 에 중복. 기초 문서가 대회 심화를 흡수(loadbalancer-basics 546줄).

세부 근거(file:line 목록)는 그릴링 세션의 감사 에이전트 5개 결과에 있다. 필요하면 재감사가 싸다.

## 편집 원칙 (사용자 확정)

- **개념이 어려우면 길어지는 것을 감수하고 쉽게 쓴다.** 압축이 난이도의 원인이다. 단
  끊어쓰기는 수단이지 목표가 아니다 — 기계적으로 토막 내면 오히려 가독성이 죽는다.
  정보 3개+ 문장·괄호 속 핵심 정의·다중 부정처럼 **읽기를 실제로 막는 곳만** 푼다. 적당히.
- 대회는 인터넷(공식 문서 열람)이 허용된다(사용자 확인). 문서는 "실전에서 어디를 열어 값을
  찾는가"를 훈련시키는 방향으로 링크를 단다. competition-rules 에 이 사실을 명시한다.

## 계획 — 6차, 차수마다 커밋 분리

| 차수 | 내용 | 상태 |
|---|---|---|
| 1 | 구조: 전 문서 `sidebar.order`(모듈 내 index→theory→lab, start 읽기 순서 강제), 선수 학습 체인 단일화, 자가진단 표 내부 링크, 고아·순환 해소 | 완료 `48e9051` |
| 2 | lab 착수 차단 해소: clone 안내, 경로 치환 규칙, `.env.ps1` 체인 복구, 미정의 변수, 오지시 수정, apply 실패 대처, 위험 명령 경고 | 완료 `d0fcedb` |
| 3 | 용어 구멍: start 에 ARN·CIDR·AZ·Principal·SSE-KMS·키 정책 `Resource:"*"` 정의 보강, root-less 키 정책 실물 JSON, DynamoDB·관측성 기초 신설, 규칙 명문화(정의 없이 용어 사용 금지 등) | 완료 `6acc64d` |
| 4 | 링크·실전 참조: theory 해설에 Terraform Registry 리소스 링크, lab 17편 상단 "실전 참조" 박스, **실전 문서 검색 가이드 신설(승패 결정 문서 — 전담 작업)**, theory/lab 상단 선행 지식 축약 블록, competition-rules 인터넷 허용 명시 | 완료 `9ebddec`(검색 가이드)·`9c59482`(4a lab)·`f0f7d28`(4b theory) |
| 5 | 문장 리라이트: 밀집 3편(part-2/05·part-1/02·part-2/07) 우선 + **start 기초 문서군 전반 보강**(사용자 지시 — 3편에 한정하지 않는다). 끊어쓰기는 막힌 곳만, 과용 금지 | 완료 `4fe92a1` |
| 6 | 층위 분리·변형 축 강화 (아래 "차수 6 재정의" 참조) | 완료 `bc83608`·`fb1036b`·`4d601d7`(재검수) |

스펙·문체 규칙 F 절·인터넷 열람 규정은 `ac91ca5`, 랜딩 브랜딩 정정은 `000732f`.

## 확정 결정

- theory 코드 해설: **리소스 타입 단위** Registry 링크(인자 앵커 아님 — 링크 부패 회피).
- lab: 상단 "실전 참조" 박스 + 검색 가이드 링크. 인라인 링크는 막히는 지점에만 선별.
- 검색 가이드 범위: HCL 인자→Registry, CLI→`help`+AWS 문서, **YAML→`kubectl explain`·
  `helm show values`·eksctl 스키마**, helm values→ArtifactHub. 값 종류별 "대회 화면에서
  여는 순서" 동선 포함. YAML 값 찾기 훈련은 사용자 명시 요구.
- 선수 학습 순서: s3-basics 를 kms-basics **앞**으로(SSE-KMS 정의 순서 교정).
- hcl-basics 는 awscli 다음, PART-1 직전에 배치(part-1/01 이 전제하는 마지막 기초).

## 차수 6 재정의 (2차 그릴링 합의)

**theory 의 역할 (사용자 정의)**: 실제 대회에서 쓸 소스(정답지 실측 코드)를 읽고·사용하고·
구축하는 관점에서 동작 원리를 설명하고, "이런 게 바뀌면 이쪽을 봐야 한다"까지 대회에 맞춘다.

이 정의에서 나온 층위 규칙: **실측 코드 없이도 참인 문장은 start 로, 실측 코드를 가리키는
문장은 theory 에.** "중복"의 판정 기준이 이것이다 — 같은 주제를 양쪽이 다뤄도 층위가 다르면
중복이 아니다. (원래 안 1·2 의 "통째로 이관"은 이 기준으로 철회.)

차수 6 확정 범위:

1. part-1/01 theory HCL 절: 언어 교습 층위 문장만 hcl-basics 로 몰고, 실측 해설·변형
   포인트는 잔류. part-1/02 봉투 암호화도 동일 규칙.
2. theory ④(세트별 차이)를 "변형 포인트" 표준 형식으로 강화 — 당일 30% 변형에서 바뀌는
   값 → 고칠 파일·변수 → 검색할 문서.
3. lab 17편 말미에 "변형 셀프 체크" 3~5문항 — ①값 변경(고칠 위치 즉답) ②요구 추가
   (theory ④ 회수 + 검색 동선) ③채점 판정(mark 어느 체크에 닿나). 답은 details 접기,
   실측 근거 병기. variation-drill(낯선 신규 요구)과 역할이 다르다.
4. part-4/10 theory(644줄): 분할 대신 유형별 재편 + 퀴즈 감축(23문 → 유형당 2~3문).
5. Day 12 모듈 3개 겹침은 timings.mdx 조정으로 처리(문서 이동 없음).
6. start 의 대회 심화 절(loadbalancer-basics ⑤ 등)은 이번 차수 손대지 않는다 —
   theory 링크가 이미 그 절을 가리키고 있어 이동 비용이 큼.
7. 층위 규칙을 style.mdx 의 문서 유형 경계(A 절)에 명문화.

## 실행 결과

### 차수 1 결과 (`48e9051`)

- 모듈·start 65편에 `sidebar.order` 부여. 모듈은 index→theory→lab, start 는
  vpc→iam→s3→kms→docker→shell→awscli→hcl→k8s→lb→eks→serverless→autoscaling.
  알파벳순 탓에 lab 이 theory 앞에 오고 start 첫 문서가 autoscaling 이던 문제가 사라졌다.
- s3-basics 를 kms-basics 앞으로 옮겨 SSE-KMS 의 정의가 사용보다 먼저 오게 했다.
- 선수 학습 체인 단일화: hcl-basics 고아 해소(awscli 뒤 편입), eks→awscli 순환 제거,
  끊긴 3갈래를 한 줄로 합침. 자가진단 1~5 번에 내부 링크를 병기하고 hcl·eks 문항(12·13)을 신설.
- `reference/` 14편과 랜딩 `index.mdx` 에는 order 를 주지 않았다 — 이 차수의 범위가
  모듈·start 였다. 조회용 문서라 알파벳순으로 남아 있다.
- 빌드 79페이지·내부 링크 검증 통과.

### 차수 2 결과 (`d0fcedb`)

- 경로 규약을 정답지 클론 루트 `~\skills-2026` 으로 통일하고 저자 로컬 절대경로 17건을 전부
  치환(잔존 0건). 클론 안내는 Day 0 §4 로 링크.
- `.env.ps1` 영속화 블록 21종 전문을 04 lab §0 에 수록해 사이트 밖 README 의존을 제거하고,
  01↔04 변수 체인의 출처(`security/kms/iam.tf`)를 명시. `$ACCOUNT_ID`·`$env:NUM`·`$env:ECR`·
  `$APP_TG` 의 정의·확인 명령을 추가.
- 오지시 수정: 이미지 빌드는 06 lab 이 아니라 03 lab. 06 lab 매니페스트 출처(`set-03/task-1/k8s/`) 명시.
- 실패 대처: 01 lab `apply` 실패 세 갈래, 04 lab eksctl `ROLLBACK_COMPLETE` 복구,
  `rm -rf ~/.aws` 선경고, part-1·2 전편에 troubleshooting/cleanup-check 링크.
- Grafana 계정 값은 문서 불일치가 아니라 세트별 정답값임을 확인해 표로 명시(set-02/03/07 실측).
  book 더미 생성의 `Set-Content -NoNewline` 버그를 `IO.File.WriteAllText` 로 교체.
- 빌드 81페이지·내부 링크 검증 통과.

### 차수 3 결과 (`6acc64d`)

- 정의 구멍 10건 보강: iam-basics 에 ARN 6칸 해설·`arn:aws:iam::계정:root` = 계정 전체 위임·
  Principal 일반 정의, kms-basics 에 set-03 실측 키 정책 JSON 전문과 칸별 해설·
  `Resource:"*"` 가 이 키 자신을 뜻한다는 danger·Condition 우회 예시, vpc-basics 에 CIDR
  접두사 길이·AZ, s3-basics 에 BPA 4항목 표, k8s-basics 에 requests/limits 절.
  loadbalancer-basics 의 HealthyThresholdCount 서술은 모순처럼 읽히던 두 경우를 갈라 놓았다.
- `start/dynamodb-basics.mdx`(316줄)·`start/observability-basics.mdx`(303줄) 신설.
  part-1/03·part-2/06 이 전제하는데 정의처가 없던 영역이다. 읽기 순서(hcl→dynamodb→k8s,
  eks→observability→serverless)·자가진단 14·15번·카드 2장에 편입.
- 이 차수에서 사이트의 root-less 관리자 서술(`aws_iam_session_context`)이 정답지 실측과
  다르다는 것을 발견했다. 교정은 차수 4b 로 넘겼다.
- 빌드 82페이지·내부 링크 검증 통과.

### 차수 4 결과 (`9ebddec` → `9c59482` → `f0f7d28`)

- **검색 가이드 신설**(`reference/search-guide.mdx`, 274줄): 막힌 값의 종류별 진입 경로
  (HCL 인자→Registry, CLI→`aws help`, k8s·CRD YAML→`kubectl explain`, helm values→
  `helm show values`+ArtifactHub, eksctl→`utils schema`, IAM→Service Authorization Reference),
  과제 수령 직후 열어 둘 탭 목록, 인터넷 불가 시 로컬 대체 수단, 훈련 드릴 10종.
  URL 은 raw.githubusercontent 대조로 실검증했다(Registry 는 SPA 라 가짜 주소도 200 을
  반환한다) — 깨진 2건 교정. style.mdx·competition-rules 의 보류 표기를 실링크로 승격.
- **4a**: lab 17편 상단에 "막히면 여는 곳" 박스(그 lab 의 실제 리소스로 구체화, Registry
  리소스 페이지 37종 신규 검증, 마지막 줄은 항상 검색 가이드 링크). lab 16편에 모듈 개요
  역링크(14 는 기존 링크와 중복이라 제외).
- **4b**: theory 17편에 모듈 개요 역링크, HCL 코드가 있는 4편에 Registry 리소스 링크,
  막힘 지점 start 링크 49건. 차수 3 에서 발견한 root-less 오서술을 실측(`Principal "*"` +
  `kms:CallerAccount` 계정 위임)으로 재서술 — 언급 7건 전부, 사실이 뒤집혀 있던 퀴즈 정답과
  danger 블록 포함. 계정 위임을 쓰는 이유(채점자가 root 로 접속하므로 배포자 고정이면
  채점 스크립트가 `get-key-policy` 조차 못 한다)를 신설.
- 빌드 82페이지·내부 링크 검증 통과.

### 차수 5 결과 (`4fe92a1`)

- 밀집 3편(part-2/05·part-1/02·part-2/07)과 start 문서군에서 **읽기를 실제로 막는 문장
  24건만** 풀었다. 이전 차수에서 이미 해소된 9건은 재확인 후 건너뛰었다 — 편집 원칙의
  "끊어쓰기는 수단이지 목표가 아니다" 를 적용한 것이다.
- 유형별 내역: 정보 과밀 4건(preStop/SIGTERM, LBC·CRD·TGB 정의 분리, JMESPath vs jq 표화,
  ALB Lambda 응답 규격), 괄호 속 핵심 정의 3건(QoS·in-flight·Access Entry), 대시 연쇄·조사
  고아 4건, 결론 선행 4건, 지시어 모호 4건, 부정 중첩 3건, 표 셀 과밀 4건.
- 표 재구성 2건: part-2/05 6대 요소 표(3열→2열+이유 불릿), part-2/07 세트 비교 표
  (대시 4개 셀→값만+소제목 산문).
- 코드 해설 누락 필드 4건·채점 서술이 원리를 대체하던 3건 보강. 전부 정답지 실측 근거 병기.
- 빌드 82페이지·내부 링크 검증 통과.

### 차수 6 결과 (2026-08-05 마무리)

층위 분리(part-1/01·02)와 theory 12편의 ④ "변형 포인트" 표준화 완료. 커밋됨.

**퀴즈 감축 판단(part-4/10)**: 유형3만 처리. 유형3변형·유형4·유형5는 **의도적으로 감축하지
않았다** — 검토 결과 각 퀴즈가 서로 다른 실패 유형(예: 유형4의 Dockerfile 결함 / 라벨 승격
메커니즘 / body 파싱 훼손 / TGB 생성 순서 / No Data 패널 대응)을 다루는 실질 콘텐츠였고,
"23문 → 유형당 2~3문"이라는 원래 목표 수치는 콘텐츠 실사와 안 맞았다. 강제 삭감이 학습
가치를 깎을 위험이 삭감의 이득보다 컸다.

### 재검수 (같은 날 후속) — 부실 처리 발견·수정

1차 마무리를 사용자가 "대충 마무리한 거 아니냐"고 되물어 재검수했다. 실제로 부실했던 부분:

- **theory 12편 전체를 grep 스팟체크만 하고 커밋했다.** 재검수에서 diff 전체를 다시 대조한
  결과 `part-2/04`(2곳)·`part-2/06`(1곳)에서 "④ 세트별 차이" 의 **세트별 실측 비교표**
  (예: set-02 IRSA vs set-03 Pod Identity, NG 이름 실측값, 인증·로그형식·HTTP메트릭 3세트
  비교)가 "변형 포인트" 템플릿으로 교체되며 **삭제**돼 있었다. 정보 손실이었다 — 복원하고
  변형 포인트 표와 병기하도록 고쳤다. 나머지 9편은 재대조 결과 손실 없음(표 자체가 원래
  없었거나 산문 안에 세트값이 남아 있었다).
- **작업 4·5(timings.mdx·style.mdx A절)를 손도 안 대고 "백로그"라고 라벨만 붙였다.**
  다시 실행: `style.mdx` A 절에 theory/start 층위 경계 절 신설(F 절과 중복 없이 A 절
  맥락에 맞게). `timings.mdx` 는 대회 당일 4시간 소요표라 Day 배정과 무관함을 확인 —
  Day 12 겹침의 실체는 모듈 `index.mdx` 의 title 라벨(11·12·13 이 전부 "Day 12")이었다.
  Day 13~14 는 이미 모듈 14(3과제)가 점유해 뒤로 밀 공간이 없어 사용자에게 확인 →
  **"주 늘리자"** 결정. 11=Day12(유지)·12=Day12→13·13=Day12→14, 모듈14는 Day13~14→
  Day15~16 으로 순연. 랜딩 페이지의 "2주 완성" 브랜딩은 더 큰 결정이라 이번엔 안 건드림
  (14일 계획이 16일로 늘어난 것과 브랜딩 문구가 불일치 — 다음에 확인 필요).

빌드 82페이지·내부 링크 검증 통과(재검수 후 재확인). 가독성 개편 본편(차수 1~6) 종료.

### 랜딩 브랜딩 결정 (`000732f`)

재검수에서 보류했던 "2주 완성" 문구를 처리했다. 결정: **브랜딩을 실제 일정에 맞춘다.**
일정이 16일로 늘어난 것은 Day 12 삼중 겹침 해소의 결과이고, 문구가 사실과 어긋난 채로
남으면 학습자가 세우는 계획이 틀어진다. 랜딩 `index.mdx` 의 title·hero title·tagline·
예산 문구와 `CLAUDE.md` 첫 줄을 16일로 정정. 빌드 82페이지·내부 링크 검증 통과.

이로써 이 스펙의 남은 항목은 없다.
