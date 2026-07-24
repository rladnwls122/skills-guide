# 트러블슈팅 플레이북 — 증상 → 원인 → 확인 명령

> 문서 유형: reference

대회장 사용법: 증상 행을 찾고 **1순위 확인 명령부터** 친다. 추측으로 고치지 않는다.
모든 항목은 수상 과제(set-02/03/07)에서 실측된 것.

## 네트워크·로드밸런서

### TG unhealthy
- 원인 순위: ① probe 경로/포트 불일치 ② SG 미허용 ③ 앱 기동 전(2~3분 대기)
- 확인:
  ```bash
  kubectl describe pod <pod>           # Events, probe 실패 사유
  aws elbv2 describe-target-health --target-group-arn <arn>
  ```
- 참고: gunicorn/Flask 앱은 userdata 완료까지 2~3분. EC2면 `systemctl status <unit>` (SSM 경유).

### ALB 직접 접근이 200 (채점은 403/000 기대)
- 원인: CloudFront 미경유 차단 미구현 — 리스너 기본 액션 403 누락 or SG가 전체 개방
- 확인: `curl.exe -m 5 http://<alb-dns>/` → 000 또는 403이어야 득점
- 조치: internal ALB + CloudFront prefix list SG(→000) 또는 기본 액션 fixed-response 403

### CloudFront 403
- 원인 순위: ① OAC 버킷정책(SourceArn) 불일치 ② Lambda 오리진에 Authorization 헤더 전달(SigV4 충돌) ③ WAF 차단 ④ 배포 전파 미완
- 확인: 오리진 직접 curl로 분리 → S3 presign / ALB 직접 / Function URL 직접
- 참고: `AllViewerExceptHostHeader`는 Authorization을 전달한다 — OAC Lambda 오리진엔 QueryString-only ORP.

### CloudFront 변경이 반영 안 됨
- 원인: 전파 수 분 소요
- 확인: `aws cloudfront wait distribution-deployed --id <id>`

## Kubernetes

### Pod Pending
- 원인 순위: ① taint/toleration 불일치 ② 노드 용량 부족 ③ nodeSelector 라벨 오타
- 확인: `kubectl describe pod <pod>` Events 최하단
- 참고: addon 노드 t3.medium 1대는 coredns2+KEDA3+Karpenter1로 이미 빠듯 — requests 낮춰라.

### Pod CrashLoopBackOff
- 원인 순위: ① 이미지 의존성 누락(제공 Dockerfile에 flask 없음 — set-07 실측) ② env 누락(앱이 import 시 raise) ③ 아키텍처 불일치(arm 빌드)
- 확인: `kubectl logs <pod> --previous`

### kubectl 인증 실패 (Unauthorized)
- 원인: 클러스터 생성자 ≠ 현재 신원
- 확인: `aws sts get-caller-identity` ↔ 클러스터 만든 신원 비교
- 조치: 같은 신원으로 `aws eks update-kubeconfig`, 불가하면 Access Entry 추가

### IRSA/Pod Identity 권한 없음 (AccessDenied)
- 원인 순위: ① SA annotation/연결 누락 ② trust 조건(OIDC sub / SourceArn) 불일치 ③ Pod Identity agent 미설치
- 확인: `kubectl describe sa <sa>`, CloudTrail에서 AssumeRole 오류 검색
- 참고: 세트별로 IRSA(set-02) vs Pod Identity(set-03/07)가 다르다 — 과제지 먼저.

## 컴퓨트·데이터

### Lambda가 ALB에서 502
- 원인: ALB 통합 응답 포맷 위반 — `statusCode`/`statusDescription`/`body` 필수
- 확인: CloudWatch Logs 해당 함수 로그

### DynamoDB 시간이 UTC로 저장
- 원인: 컨테이너에 tzdata/`TZ=Asia/Seoul` 누락 (Go 바이너리는 tzdata 미내장)
- 확인: 아이템 실측 `aws dynamodb scan --max-items 1`

### DynamoDB 숫자가 96.60000000000001
- 원인: float 연산 — boto3는 float 저장 자체를 거부하기도 함
- 조치: `Decimal("483")/Decimal("5")` 패턴

### ECR 스캔 High/Critical
- 원인: 당일 베이스 이미지 패치 상태
- 조치: `RUN apk upgrade --no-cache` 추가 후 재빌드·재push, 스캔 완료 대기

## IaC·환경

### terraform 순환/의존 오류 (LBC ALB 참조)
- 원인: CloudFront/버킷정책이 LBC가 만들 ALB에 의존
- 조치: 2회 apply 패턴 — 1차(CDN 제외) → 클러스터·ingress로 ALB 확보 → 2차 `-var enable_cdn=true`

### S3 KMS 키 정책 순환
- 원인: key→distribution→bucket→key 참조 고리
- 조치: 배포 ARN 대신 `aws:SourceAccount` 조건

### CloudShell 파일 소실
- 원인: VPC CloudShell 비영속 + 업로드 UI 없음
- 조치: S3 `_transfer/` 릴레이 + 멱등 셋업 스크립트 재실행. mark.sh는 heredoc 붙여넣기.

### PowerShell에서 깨짐
- 원인: `curl` 별칭 / `$` 확장 / CP949 인코딩(PS5.1)
- 조치: `curl.exe` 명시, 작은따옴표, PS7(UTF-8 no BOM)만 사용

### 이벤트/Config가 반응 없음
- 원인: CloudTrail·Config 첫 평가까지 5~10분, CloudTrail 경유 이벤트는 수십 초~1분 지연
- 조치: 대기 또는 `aws configservice start-config-rules-evaluation`. 네이티브 이벤트(수 초)와 경로 구분.

## 파괴/복구 훈련 매핑

모듈 12(break-fix)가 위 증상 12종을 고의로 재현한다 — 표가 손에 붙을 때까지.
