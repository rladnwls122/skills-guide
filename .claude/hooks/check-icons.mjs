/**
 * PostToolUse(Edit|Write): 콘텐츠 mdx 를 고쳤을 때만 아이콘 이름을 검증한다.
 *
 * 도식이 쓰는 아이콘 이름이 목록에 없으면 그 노드만 조용히 깨지고 빌드는 통과한다.
 * 편집 직후에 잡아야 어느 편집이 원인인지 바로 안다.
 *
 * node 로 쓴 이유: 이 레포는 Windows 에서 개발한다. 셸 스크립트는 Git Bash 유무를
 * 타지만 node 는 프로젝트 전제라 항상 있다.
 */
import { spawnSync } from 'node:child_process';

const input = await new Promise((resolve) => {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => resolve(raw));
});

let filePath = '';
try {
  filePath = JSON.parse(input || '{}')?.tool_input?.file_path ?? '';
} catch {
  process.exit(0); // 입력을 못 읽으면 훅이 작업을 막지 않는다
}

const normalized = filePath.replace(/\\/g, '/');
const isContentMdx = normalized.includes('src/content/docs/') && normalized.endsWith('.mdx');
if (!isContentMdx) process.exit(0);

const result = spawnSync(process.execPath, ['scripts/check-mermaid-icons.mjs'], {
  cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
  encoding: 'utf8',
});

if (result.status !== 0) {
  // 훅의 stderr 는 Claude 에게 전달된다 — 무엇이 왜 막혔는지 그대로 보여준다.
  process.stderr.write(
    '아이콘 검증 실패 — 목록에 없는 아이콘을 썼다. ' +
      'src/mermaid-icons.mjs 에 이름을 추가하거나 오타를 고칠 것.\n' +
      (result.stderr || result.stdout || '')
  );
  process.exit(2);
}
