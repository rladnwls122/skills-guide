/**
 * lab·drill 의 이행 절이 계약을 지키는지 검사한다.
 *
 * style.mdx H 절: 이행 절에 절차 지시를 쓰지 않는다. 무엇이 달라졌는지만 주고
 * 방법은 학습자가 정한다. 명령을 그대로 쳐서 성공하는 경험은 역량을 만들지 않는다.
 *
 * 이 검사를 손으로 두 번 틀렸다. 처음엔 `## 이행` 부터 다음 `## ` 까지를 재서
 * 통과 기준·복기의 명령까지 셌고, 다음엔 번호 목록을 무조건 절차로 봤다.
 * 그래서 범위와 판정을 여기에 박아 둔다.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const CONTENT_DIR = 'src/content/docs';

/** 이행 단계의 제목. 타이머가 붙은 절만 이행 "단계"다. */
const STEP_HEADING = /^(#{2,3}) .*이행.*타이머/;

/** 실행 명령으로 보는 것 — 코드 펜스 안에서만 센다. */
const COMMAND = /^\s*(terraform|kubectl|aws|eksctl|helm|docker|git|curl|npm)\s/;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name === 'lab.mdx' || e.name === 'drill.mdx') out.push(p);
  }
  return out;
}

/** 제목 줄부터 같은 수준 이상의 다음 제목 전까지. */
function sectionBody(lines, start) {
  const level = lines[start].match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6}) /);
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end);
}

const files = (await walk(CONTENT_DIR)).sort();
const violations = [];
let sections = 0;

for (const file of files) {
  const lines = (await readFile(file, 'utf8')).replace(/\r/g, '').split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!STEP_HEADING.test(lines[i])) continue;
    sections++;

    let inFence = false;
    const commands = [];
    for (const line of sectionBody(lines, i)) {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence && COMMAND.test(line)) commands.push(line.trim());
    }

    /* 번호 목록은 세지 않는다. 이행 절의 번호 목록은 "종이에 순서를 적는다" 같은
       사고 훈련이지 실행 절차가 아니다 — 모듈 12 가 그 예다. 실행 명령만 본다. */
    if (commands.length) {
      violations.push({ file, heading: lines[i].trim(), commands });
    }
  }
}

console.log(`이행 절 ${sections}개 · 문서 ${files.length}개`);

if (violations.length === 0) {
  console.log('통과 — 이행 절에 실행 명령이 없다.');
  process.exit(0);
}

for (const v of violations) {
  console.error(`\n${v.file}\n  ${v.heading}`);
  for (const c of v.commands.slice(0, 5)) console.error(`    ${c}`);
  if (v.commands.length > 5) console.error(`    … 외 ${v.commands.length - 5}줄`);
}
console.error(
  `\n이행 절은 무엇이 달라졌는지만 주고 방법은 학습자가 정한다(style.mdx H 절).\n` +
    `명령이 필요하면 통과 기준이나 복기 절로 옮긴다.`,
);
process.exit(1);
