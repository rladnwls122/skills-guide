/**
 * 도식이 쓰는 아이콘이 src/mermaid-icons.mjs 목록에 있는지 검사한다.
 *
 * 목록에 없는 아이콘을 쓰면 그 노드가 조용히 깨진다 — 빌드는 통과하고
 * 브라우저에서만 티가 나므로 자동 검사가 필요하다.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MERMAID_ICONS } from '../src/mermaid-icons.mjs';

const CONTENT_DIR = 'src/content/docs';

/** 노드 아이콘: icon: "logos:aws-s3" · subgraph 아이콘: icon--logos--aws-s3 */
const NODE_ICON = /icon:\s*["']([a-z0-9-]+):([a-z0-9-]+)["']/g;
const SPAN_ICON = /icon--([a-z0-9]+)--([a-z0-9-]+)/g;

async function* mdxFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* mdxFiles(path);
    else if (entry.name.endsWith('.mdx')) yield path;
  }
}

const used = new Map(); // "pack:name" -> Set<file>

for await (const file of mdxFiles(CONTENT_DIR)) {
  const text = await readFile(file, 'utf8');
  for (const re of [NODE_ICON, SPAN_ICON]) {
    for (const [, pack, name] of text.matchAll(re)) {
      const key = `${pack}:${name}`;
      if (!used.has(key)) used.set(key, new Set());
      used.get(key).add(file);
    }
  }
}

const missing = [];
for (const [key, files] of used) {
  const [pack, name] = key.split(':');
  if (!MERMAID_ICONS[pack]?.includes(name)) {
    missing.push(`  ${key}  ←  ${[...files].join(', ')}`);
  }
}

const declared = Object.entries(MERMAID_ICONS).flatMap(([p, names]) => names.map((n) => `${p}:${n}`));
const unused = declared.filter((key) => !used.has(key));

if (unused.length) {
  console.warn(`목록에만 있고 아무 도식도 안 쓰는 아이콘 ${unused.length}개:\n  ${unused.join(', ')}`);
}

if (missing.length) {
  console.error(`목록에 없는 아이콘 ${missing.length}개 — src/mermaid-icons.mjs 에 추가할 것:\n${missing.join('\n')}`);
  process.exit(1);
}

console.log(`아이콘 ${used.size}종 전부 목록에 있음.`);
