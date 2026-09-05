/**
 * mermaid 도식이 쓰는 아이콘 목록.
 *
 * 노드는 아이콘 팩 JSON(`@{ icon: "logos:aws-s3" }`)을, subgraph 는 CSS 클래스
 * (`<span class='icon--logos icon--logos--aws-s3'>`)를 쓴다. 둘 다 이 목록에서
 * 만든 URL로 받으므로 이름이 갈라지지 않는다.
 *
 * 목록에 없는 아이콘을 도식에서 쓰면 그 노드가 깨진다 —
 * scripts/check-mermaid-icons.mjs 가 그 회귀를 막는다.
 */
export const MERMAID_ICONS = {
  // 실제로 도식이 쓰는 것만 둔다. 이 목록이 그대로 서브셋 URL 이 되고 그 CSS 가
  // 모든 페이지에 걸리므로, 안 쓰는 이름 하나가 그대로 payload 다.
  // 새 아이콘은 여기 이름을 먼저 더한다 — ECR 처럼 팩에 없는 것은 범용 'aws'
  // 로고로 대체하되, 실제로 쓰게 되는 날 목록에 넣는다.
  logos: [
    'aws-kms', 'aws-s3', 'aws-vpc', 'aws-eks', 'aws-ec2', 'aws-lambda',
    'aws-dynamodb', 'aws-iam', 'aws-cloudfront', 'aws-cloudwatch', 'aws-elb',
    'aws-sqs', 'aws-sns', 'aws-eventbridge', 'aws-kinesis',
    'aws-fargate', 'aws-rds', 'aws-secrets-manager',
    'aws-step-functions', 'aws-waf', 'aws-cloudtrail',
    'aws-config', 'aws-msk', 'aws-documentdb',
    'kubernetes', 'docker-icon', 'terraform-icon', 'prometheus', 'grafana',
    'helm', 'opentelemetry',
  ],
  // AWS·제품 로고로 표현할 수 없는 개념(서브넷·계층·로그 등)에만 쓴다.
  mdi: ['lan-connect', 'layers-outline', 'console-line', 'web'],
  // logos 팩에 없는 브랜드 로고. 단색이라 mdi처럼 색을 박아야 한다.
  'simple-icons': ['fluentbit'],
};

/** Iconify 서브셋 엔드포인트 URL. 아이콘 개수와 무관하게 팩당 요청 1건. */
export const iconifyUrl = (pack, ext, params = '') =>
  `https://api.iconify.design/${pack}.${ext}?icons=${MERMAID_ICONS[pack].join(',')}${params}`;
