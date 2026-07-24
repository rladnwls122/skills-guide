# 02. KMS + S3 + CloudFront — 실습

**방식**: 스펙만 보고 tf 코드를 직접 쓴다 → apply·검증 → `skills-2026` 정답과 diff. Day 1 실습 디렉토리와 별개의 새 디렉토리에서 진행 (VPC 불필요 — 이 3개 서비스는 VPC 밖 리소스).

## 실습 목표

- [ ] CMK 2개(s3용, dynamodb용) + alias 를 정책 문서 합성(source_policy_documents) 패턴으로 작성
- [ ] 퍼블릭 차단 4종 + SSE-KMS(BucketKey) 버킷 + `web/main/` 객체 업로드
- [ ] OAC + CloudFront 배포 + SourceArn 버킷 정책 연결
- [ ] 순환 참조를 일부러 만들어 에러를 눈으로 본 뒤 SourceAccount 로 우회
- [ ] (심화) s3 키 정책을 set-03 방식 root-less 로 재작성

## 사전 준비

```powershell
mkdir my-cdn-lab; cd my-cdn-lab
# 업로드할 더미 정적 파일
mkdir provided
'<html><body>hello</body></html>' | Set-Content provided\index.html
# 아무 jpeg 하나를 provided\main.jpeg 로 복사 (없으면 index.html 만으로 진행해도 됨)
```

## 단계별 절차

### 1) 스펙만 보고 직접 작성 (정답지 금지)

작성 파일: `versions.tf`, `variables.tf`(player_number 포함), `data.tf`, `kms.tf`, `s3.tf`, `cloudfront.tf`, `outputs.tf`

| 항목 | 스펙 (set-02 실측) |
|---|---|
| CMK | `wskorea26-s3-key`, `wskorea26-dynamodb-key` — rotation 활성, 삭제 대기 7일, alias `alias/<이름>` |
| s3 키 정책 | root 전체 위임 + CloudFront 서비스 principal 에 Decrypt/GenerateDataKey (`aws:SourceAccount` 조건) |
| dynamodb 키 정책 | root 전체 위임만 |
| 버킷 | `wskorea26-concert-bucket-<비번호>`, 퍼블릭 차단 4종, SSE-KMS(s3키)+BucketKey |
| 객체 | `web/main/index.html`(`text/html`), `web/main/main.jpeg`(`image/jpeg`) — for_each |
| OAC | `wskorea26-s3-oac`, s3 타입, always/sigv4 |
| CloudFront | comment `wskorea26-concert-cf`, S3 오리진(OAC, origin_path `/web/main`), default behavior GET/HEAD + redirect-to-https + Managed-CachingOptimized, default_root_object `index.html`, 기본 인증서 |
| 버킷 정책 | cloudfront.amazonaws.com + `AWS:SourceArn` = 배포 ARN, `s3:GetObject` |
| output | `s3_bucket_name`, `cloudfront_domain` |

관리형 캐시 정책은 data source 로 조회한다: `data "aws_cloudfront_cache_policy" "caching_optimized" { name = "Managed-CachingOptimized" }`.

### 2) 순환 참조를 일부러 체험 (5분)

s3 키 정책의 CloudFront statement 에 SourceAccount 대신 아래를 넣고 plan:

```hcl
condition {
  test     = "StringEquals"
  variable = "aws:SourceArn"
  values   = [aws_cloudfront_distribution.cdn.arn]   # 순환!
}
```

기대: `Error: Cycle: aws_kms_key.s3, aws_cloudfront_distribution.cdn, aws_s3_bucket..., ...` — key→distribution→bucket→key 순환을 확인 후 `aws:SourceAccount = local.account_id` 로 되돌린다.

### 3) apply & 검증

```powershell
terraform init && terraform fmt && terraform validate && terraform apply
# CloudFront 배포 완료까지 수 분 소요

$BUCKET = terraform output -raw s3_bucket_name
$CF     = terraform output -raw cloudfront_domain

# (1) alias 역조회 — mark 방식
aws kms describe-key --key-id alias/wskorea26-s3-key --query 'KeyMetadata.[KeyState,KeyManager]'
# 기대: ["Enabled", "CUSTOMER"]

# (2) 퍼블릭 차단 4종 — mark 2-2
aws s3api get-public-access-block --bucket $BUCKET
# 기대: 4개 필드 모두 true
aws s3api get-bucket-policy-status --bucket $BUCKET --query 'PolicyStatus.IsPublic'
# 기대: false  (버킷 정책이 없으면 이 호출 자체가 에러 — OAC 정책이 있어야 함)

# (3) 암호화 — SSE-KMS + BucketKey
aws s3api get-bucket-encryption --bucket $BUCKET `
  --query 'ServerSideEncryptionConfiguration.Rules[0]'
# 기대: SSEAlgorithm aws:kms + KMSMasterKeyID(s3키 ARN) + BucketKeyEnabled true

# (4) 객체 키 — mark 2-1
aws s3api list-objects-v2 --bucket $BUCKET --query 'Contents[].Key'
# 기대: ["web/main/index.html", "web/main/main.jpeg"]

# (5) 접근 경로: CloudFront 만 허용
curl.exe -s -o NUL -w "%{http_code}`n" "https://$CF/"          # 기대: 200
curl.exe -s -o NUL -w "%{http_code}`n" "https://$BUCKET.s3.ap-northeast-2.amazonaws.com/web/main/index.html"  # 기대: 403
curl.exe -s -o NUL -w "%{http_code}`n" "http://$CF/" -L        # http → 301 후 200 (redirect-to-https)
```

배포 완료 대기가 필요하면: `aws cloudfront wait distribution-deployed --id <배포ID>`.

### 4) (심화) root-less 키 정책으로 재작성

set-03 유의사항을 가정하고 s3 키 정책에서 root statement 를 제거:

1. `data "aws_iam_session_context"` + `aws_caller_identity` 로 배포자 ARN 조회
2. `kms:*` 없이 admin 액션을 개별 나열한 `kms_admin` 문서 작성 (`kms:Create*`, `kms:Put*` 포함 필수)
3. apply 후 정책 텍스트 자가 grep:

```powershell
aws kms get-key-policy --key-id alias/wskorea26-s3-key --policy-name default --output text | Select-String -Pattern ':root|kms:\*'
# 기대: 출력 없음 (있으면 set-03 mark 실격)
```

`kms:Put*` 를 빼고 apply 해 보면 `MalformedPolicyDocumentException: ... will prevent you from managing the key`(lockout safety check) 를 볼 수 있다.

### 5) 정답과 diff

```powershell
git diff --no-index .\kms.tf C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\kms.tf
git diff --no-index .\s3.tf  C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\s3.tf
git diff --no-index .\cloudfront.tf C:\Users\kryuk\practice\skills-2026\set-02\task-1\terraform\cloudfront.tf
# 심화 diff
git diff --no-index .\kms.tf C:\Users\kryuk\practice\skills-2026\set-03\task-1\terraform\kms.tf
```

확인 관점: `source_policy_documents` 합성 여부, `bucket_key_enabled`, `content_type` 처리, comment 로 배포 식별, 버킷 정책 SourceArn vs 키 정책 SourceAccount 구분.

## 함정 목록

| 함정 | 증상 / 결과 |
|---|---|
| 키 정책에 배포 ARN 직접 참조 | `Error: Cycle` — SourceAccount 조건으로 우회 |
| 버킷 정책 없이 퍼블릭 차단만 | `get-bucket-policy-status` 호출 에러 → mark 2-2 실패 |
| 객체 content_type 누락 | 브라우저가 html 을 다운로드 (기본 octet-stream) |
| origin_path 누락 | `https://<cf>/` 가 403/404 — 루트가 web/main/index.html 로 안 감 |
| alias 오타 (`alias/` 접두 누락 포함) | mark 가 키를 역조회 못 함 — 암호화 항목 전멸 |
| root-less 정책에 `kms:Put*` 누락 | lockout safety check 로 apply 자체 실패 |
| root-less 키를 다른 신원으로 사용 | AccessDenied — terraform 과 같은 자격증명으로만 작업 |
| ECR 등 이름 없는 서비스에 CMK 생성 | 불필요 리소스 감점 (set-02 유의사항 10) |
| CloudFront 전파 전 채점/검증 | 간헐 403 — `wait distribution-deployed` 후 확인 |

## 통과 기준 (mark 항목 연결)

- [ ] `alias/wskorea26-s3-key`·`alias/wskorea26-dynamodb-key` 로 CMK 역조회 성공 (mark 2-2/4-1 상당)
- [ ] 객체 키가 정확히 `web/main/index.html`, `web/main/main.jpeg` (mark 2-1)
- [ ] 퍼블릭 차단 4종 true + IsPublic false + SSE-KMS/BucketKey (mark 2-2)
- [ ] CloudFront 200 / S3 직접 403 / http→https 리다이렉트 (mark 8-3/8-5 상당)
- [ ] (심화) 키 정책 텍스트에 `:root`·`kms:*` 없음 + apply 성공 (set-03 check_kms)
- [ ] 재 plan 시 `No changes`

## 정리 (destroy 순서)

```powershell
terraform destroy
```

단일 state 라 순서는 Terraform 이 처리한다(배포 disable→삭제 때문에 5~10분 소요). 확인 사항:

```powershell
aws s3api head-bucket --bucket $BUCKET 2>&1            # 404 여야 함
aws kms describe-key --key-id alias/wskorea26-s3-key 2>&1   # NotFoundException (alias 삭제됨)
```

KMS 키는 즉시 삭제되지 않고 **PendingDeletion(7일)** 상태로 남는다 — 정상이며 대기 중 과금 없음. 같은 이름 키를 바로 다시 만들어도 alias 는 재사용 가능(이전 alias 는 destroy 로 삭제됨).
