# 03. 컨테이너 + Lambda + DynamoDB — 실습

> 문서 유형: tutorial

**방식**: Dockerfile·tf·index.py 를 직접 쓴다 → apply·직접 invoke 검증 → `skills-2026` 정답과 diff. ALB 는 이 모듈 범위 밖이므로 Lambda 는 `aws lambda invoke` 로 ALB 이벤트를 흉내 내 검증한다.

## 실습 목표

- [ ] alpine 고정 + tzdata/TZ + 비루트 Dockerfile 작성, (CloudShell 에서) 빌드·push·스캔 확인
- [ ] scanOnPush + KMS ECR 리포지토리 tf 작성, `stable` 태그만 push
- [ ] PK/GSI/PITR/삭제방지/SSE-KMS DynamoDB 테이블 tf 작성
- [ ] ALB 통합 응답 포맷 Lambda + 최소권한 실행역할 + env 주입 tf 작성
- [ ] 테스트 데이터로 최신순·키 순서·비ASCII·400·빈배열을 실제 응답으로 검증
- [ ] 삭제방지 해제 → destroy 순서 체득

## 사전 준비

```powershell
mkdir my-app-lab; cd my-app-lab
```

Day 2 실습을 destroy 했다면 dynamodb 용 CMK(`wskorea26-dynamodb-key`)를 이 모듈 tf 에 다시 포함시킨다 (root 위임 정책이면 충분).

## 단계별 절차

### 1) Dockerfile 직접 작성 (정답지 금지)

스펙: 최신 안정 **고정 버전** alpine, tzdata 설치 + `TZ=Asia/Seoul`, uid 10001 비루트 유저 생성·전환, 바이너리 `book` 을 `/book` 으로 755 복사, EXPOSE 8080, ENTRYPOINT.

실제 book 바이너리가 없으므로 로컬 검증용 더미:

```powershell
'#!/bin/sh' , 'date "+%Y-%m-%d %H:%M:%S %Z"; sleep 3600' | Set-Content -NoNewline book
```

### 2) 빌드·타임존 검증 (Docker 가능 환경 — CloudShell 권장)

대회 조건 그대로 연습하려면 기본 CloudShell(인터넷 O, docker 내장, amd64)에 Dockerfile+book 만 올려 빌드한다:

```bash
docker build -t book-test .
docker run --rm book-test        # 기대: ... KST  (UTC 가 나오면 tzdata/TZ 누락)
docker run --rm --entrypoint id book-test   # 기대: uid=10001(book) — 비루트 확인
```

### 3) tf 작성 — ECR + DynamoDB + KMS

| 리소스 | 스펙 (set-02 실측) |
|---|---|
| ECR | `wskorea26-book-repo`, scan_on_push, encryption_type KMS(키 미지정=aws/ecr), force_delete |
| CMK | `wskorea26-dynamodb-key` + alias |
| 테이블 | `wskorea26-data-table`, PAY_PER_REQUEST, hash_key `client_id`(S), deletion_protection, attribute 3개(client_id/concert_name/created_at 전부 S), GSI `concert_name-created_at-index`(HASH concert_name + RANGE created_at, ALL), SSE-KMS(CMK), PITR |

### 4) push & 스캔 확인 (CloudShell)

```bash
ECR="$ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/wskorea26-book-repo"
aws ecr get-login-password | docker login --username AWS --password-stdin "${ECR%%/*}"
docker build -t "$ECR:stable" .
docker push "$ECR:stable"              # stable 만! latest 추가 push 금지

aws ecr wait image-scan-complete --repository-name wskorea26-book-repo --image-id imageTag=stable
aws ecr describe-image-scan-findings --repository-name wskorea26-book-repo --image-id imageTag=stable \
  --query 'imageScanFindings.findingSeverityCounts'
# 기대: {} 또는 CRITICAL/HIGH 키 없음. High 발견 시 RUN apk upgrade --no-cache 추가 후 재빌드
aws ecr describe-images --repository-name wskorea26-book-repo --query 'imageDetails[].imageTags'
# 기대: [["stable"]] — 태그 1개뿐
```

### 5) Lambda 작성 (index.py + lambda.tf)

index.py 스펙 (정답지 금지, theory §4 의 사실 목록만 보고):
- env `TABLE_NAME`/`INDEX_NAME` 읽기 (하드코딩 금지)
- `queryStringParameters` 에서 `concert_name` — 없으면 400 `{"msg": "concert_name is required"}`
- `unquote_plus` 디코딩 (ALB 는 `2ND%20TINY_CON` 그대로 전달)
- GSI Query + `ScanIndexForward=False` + LastEvaluatedKey 페이지네이션
- 결과 없으면 `[]` + 200
- 응답: statusCode / statusDescription("200 OK") / isBase64Encoded / headers / body
- body 는 `json.dumps(..., ensure_ascii=False, default=str)`, 키 순서 `username, created_at, email, booking_id, client_id, concert_name`

lambda.tf 스펙: `archive_file` zip, 로그그룹 `/aws/lambda/wskorea26-book-lambda`(30일), 실행역할 3-statement(dynamodb:Query 테이블+`/index/*` / logs 2액션 / CMK kms:Decrypt), runtime python3.14(불가하면 python3.13), timeout 10, env 주입.

### 6) 데이터 주입 & 검증

```powershell
# Decimal 함정은 CLI put-item 은 문자열 "N" 타입이라 안 밟지만, 파이썬 스크립트로 넣을 땐 Decimal 필수
aws dynamodb put-item --table-name wskorea26-data-table --item '{
  "client_id":{"S":"c1"},"concert_name":{"S":"2ND TINY_CON"},"created_at":{"S":"2026-07-25 10:00:00"},
  "username":{"S":"akaね"},"email":{"S":"a@b.c"},"booking_id":{"S":"b1"}}'
aws dynamodb put-item --table-name wskorea26-data-table --item '{
  "client_id":{"S":"c2"},"concert_name":{"S":"2ND TINY_CON"},"created_at":{"S":"2026-07-25 12:00:00"},
  "username":{"S":"kim"},"email":{"S":"k@b.c"},"booking_id":{"S":"b2"}}'

# (1) 정상 조회 — ALB 이벤트 흉내
'{"queryStringParameters":{"concert_name":"2ND%20TINY_CON"}}' | Set-Content event.json
aws lambda invoke --function-name wskorea26-book-lambda --payload fileb://event.json out.json
Get-Content out.json
```

기대 출력 검증 포인트:
- `"statusCode": 200`, `"statusDescription": "200 OK"`
- body 배열이 **12:00 항목이 먼저** (최신순)
- 각 항목 키 순서가 username → created_at → email → booking_id → client_id → concert_name
- `akaね` 가 이스케이프 없이 그대로 (`\u` 가 보이면 ensure_ascii 실패)

```powershell
# (2) 파라미터 누락 → 400
'{"queryStringParameters":null}' | Set-Content event400.json
aws lambda invoke --function-name wskorea26-book-lambda --payload fileb://event400.json out400.json
# 기대: statusCode 400, body {"msg": "concert_name is required"}

# (3) 결과 없음 → [] + 200
'{"queryStringParameters":{"concert_name":"NOPE"}}' | Set-Content eventempty.json
aws lambda invoke --function-name wskorea26-book-lambda --payload fileb://eventempty.json outempty.json
# 기대: statusCode 200, body "[]"

# (4) 테이블 상태 — mark 4-1 상당
aws dynamodb describe-table --table-name wskorea26-data-table `
  --query 'Table.[DeletionProtectionEnabled, SSEDescription.SSEType, GlobalSecondaryIndexes[0].IndexName]'
# 기대: [true, "KMS", "concert_name-created_at-index"]
aws dynamodb describe-continuous-backups --table-name wskorea26-data-table `
  --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus'
# 기대: "ENABLED"
```

### 7) 정답과 diff

```powershell
git diff --no-index .\Dockerfile   C:\Users\kryuk\practice\skills-2026\set-02\task-1\app\Dockerfile
git diff --no-index .\dynamodb.tf  C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\dynamodb.tf
git diff --no-index .\ecr.tf       C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\ecr.tf
git diff --no-index .\lambda.tf    C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\lambda.tf
git diff --no-index .\lambda\index.py C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\lambda\index.py
```

확인 관점: 비키 attribute 를 정의하지 않았는가, 실행역할이 3-statement 최소권한인가, 페이지네이션 루프가 있는가, `_KEYS` 재조립 방식인가.

## 함정 목록

| 함정 | 증상 / 결과 |
|---|---|
| scratch 베이스 | ECR Basic 스캔 불가 + DynamoDB TLS 실패 (CA 번들 없음) |
| tzdata/TZ 누락 | created_at UTC 저장 → 시각 비교 채점 실패 |
| latest 태그 추가 push | 요구 외 리소스 — 감점 |
| 스캔 High 방치 | mark 3-1 실패 — `RUN apk upgrade --no-cache` 재빌드 |
| arm 맥 등에서 빌드 | 아키텍처 불일치/멀티아키 매니페스트 — CloudShell(amd64)에서 빌드 |
| 비키 속성을 attribute 로 정의 | `all attributes must be indexed` 에러 |
| 삭제방지 켠 채 destroy | 테이블 삭제 실패 — 먼저 해제 apply |
| 파이썬으로 float 저장 | boto3 가 거부 (`Float types are not supported`) — Decimal(str(x)) |
| float 평균 | 96.60000000000001 ≠ 기대 96.6 — Decimal 나눗셈 |
| TABLE_NAME 하드코딩 | env 주입 채점(mark 6-1) 실패 |
| ensure_ascii 기본값 | `akaね` → `aka\u306d` 문자열 비교 실패 |
| 키 순서 미정렬 | 기대 출력과 diff 발생 |
| ScanIndexForward 미지정 | 기본 True = 오래된 순 — 정렬 채점 실패 |
| statusDescription 누락 | ALB 통합 응답 불완전 — 502/포맷 채점 실패 |
| SSE-KMS 테이블인데 실행역할에 kms:Decrypt 없음 | Query 가 AccessDenied |

## 통과 기준 (mark 항목 연결)

- [ ] 스캔 결과 CRITICAL/HIGH 없음 + scanOnPush + encryptionType KMS + 태그 stable 만 (mark 3-1)
- [ ] 테이블: 삭제방지 true, SSEType KMS(CMK alias 역조회 가능), GSI 이름 정확, PITR ENABLED (mark 4-1)
- [ ] Lambda env 에 TABLE_NAME 주입, 하드코딩 없음 (mark 6-1)
- [ ] invoke 응답: 최신순 + 키 순서 + 비ASCII 원문 + 400/[] 처리 (mark 9-2)
- [ ] 컨테이너 프로세스 uid 10001 비루트, TZ=KST
- [ ] 재 plan `No changes`

## 정리 (destroy 순서 — 이 모듈은 순서가 있다)

```powershell
# 1) 삭제방지 해제: dynamodb.tf 에서 deletion_protection_enabled = false 로 수정
terraform apply        # 해제만 반영

# 2) 전체 삭제 (ECR 은 force_delete 로 이미지째 삭제됨)
terraform destroy

# 3) 확인
aws dynamodb describe-table --table-name wskorea26-data-table 2>&1        # ResourceNotFoundException
aws ecr describe-repositories --repository-names wskorea26-book-repo 2>&1 # RepositoryNotFoundException
```

CMK 는 PendingDeletion 7일 대기 — 정상. CloudShell 홈의 이미지/파일은 과금 대상이 아니므로 방치해도 되지만, 대회 습관상 `docker image prune -af` 로 정리한다.
