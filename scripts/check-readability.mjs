import fs from 'node:fs';
import path from 'node:path';

/**
 * 초심자가 읽다 끊기는 문장을 센다.
 *
 * style.mdx E 절이 문장당 한글 약 45자를 넘기지 말라고 한다. 그 두 배인 80자부터는
 * 절이 셋 이상 붙어 읽는 사람이 앞을 잊는다 — 여기서는 그 선을 본다.
 *
 * 세지 않는 것: 코드 펜스, 표, 목록, 제목, frontmatter, 그리고 퀴즈 문항.
 * 퀴즈는 시나리오를 담느라 길 수 있고 그것이 결함이 아니다.
 *
 *   npm run check:read            전체
 *   npm run check:read start/     선수 학습만
 *   npm run check:read part-1/ 80 -v   문장까지 본다
 */
const LIMIT = Number(process.argv[3] || 80);
const FILTER = process.argv[2] || '';

const plain = (s) =>
  s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`[^`]*`/g, '□')
    .replace(/\*\*|__|~~/g, '')
    .trim();

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.mdx')) files.push(p);
  }
})('src/content/docs');

const picked = files.filter((f) => f.split(path.sep).join('/').includes(FILTER)).sort();
let total = 0;
for (const f of picked) {
  const t = fs.readFileSync(f, 'utf8').replace(/\r/g, '');
  let inFence = false;
  let inQuiz = false;
  const hits = [];
  const lines = t.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^<Quiz/.test(l)) { inQuiz = true; continue; }
    if (/^<\/Quiz>/.test(l)) { inQuiz = false; continue; }
    if (inQuiz) continue;                       // 퀴즈 문항은 시나리오라 길 수 있다
    if (i < 8 && /^(title|description):/.test(l)) continue;  // frontmatter
    if (/^\s*(\||[-*+] |\d+\. |#{1,6} |import |<|:::|>)/.test(l) || !l.trim()) continue;
    for (const s of plain(l).split(/(?<=[.!?다])\s+/)) {
      const x = s.trim();
      if (x.length > LIMIT) hits.push(`  L${i + 1} ${x.length}자 · ${x.slice(0, 60)}…`);
    }
  }
  if (hits.length) {
    console.log(`${f.split(path.sep).slice(3).join('/')}  — ${hits.length}건`);
    if (process.argv[4] === '-v') hits.forEach((h) => console.log(h));
    total += hits.length;
  }
}
console.log(`\n${LIMIT}자 초과 ${total}건 · 문서 ${picked.length}개 중`);
