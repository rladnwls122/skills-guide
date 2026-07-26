/* 스플릿 뷰 — 인덱스·목차 레일 폭을 스플릿 바 드래그로 조절한다.
 *
 * 레일 폭은 토큰 두 개(--sl-sidebar-width, --sl-exquisitus-toc-width)가 전부이고
 * band(3단 전체 폭)를 고정해 뒀으므로(src/styles/layout.css) 토큰만 바꾸면 읽는
 * 칸이 그만큼 줄고 늘어난다. 바깥 여백은 움직이지 않는다 — 스플릿 뷰가 기대하는
 * 동작이다.
 *
 * 접기는 새로 만들지 않고 인덱스 토글이 쓰던 상태(html[data-sidebar="closed"] +
 * localStorage 'sl-sidebar-collapsed')를 그대로 쓴다. 목차 쪽만 같은 모양으로
 * 하나 더 뒀다.
 *
 * 폭 복원은 head 의 인라인 스크립트가 맡는다(astro.config.mjs) — 여기서 하면
 * 페이지를 넘길 때마다 기본 폭이 한 프레임 보였다가 바뀐다.
 */

const BAND = 82.5; /* layout.css 의 --sl-exquisitus-shell-band 와 같은 값 */
const GUTTER = 2.5;
const MIN_MEASURE = 24; /* 읽는 칸이 이보다 좁아지면 표가 깨진다 */
const MIN_RAIL = 8;
const SNAP = 6; /* 이보다 좁게 밀면 접힌다 */
const WIDTH_KEY = 'sl-split-widths';

const RAILS = {
  sidebar: {
    prop: '--sl-sidebar-width',
    fallback: 16.5,
    attr: 'sidebar',
    key: 'sl-sidebar-collapsed',
    /* 오른쪽으로 끌면 넓어진다 */
    sign: 1,
  },
  toc: {
    prop: '--sl-exquisitus-toc-width',
    fallback: 15,
    attr: 'toc',
    key: 'sl-toc-collapsed',
    /* 왼쪽으로 끌면 넓어진다 */
    sign: -1,
  },
};

const root = document.documentElement;
const rem = () => parseFloat(getComputedStyle(root).fontSize) || 16;

const readWidths = () => {
  try {
    return JSON.parse(localStorage.getItem(WIDTH_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeWidths = (widths) => {
  try {
    localStorage.setItem(WIDTH_KEY, JSON.stringify(widths));
  } catch {}
};

const isClosed = (rail) => root.dataset[rail.attr] === 'closed';

const setClosed = (rail, closed) => {
  root.dataset[rail.attr] = closed ? 'closed' : 'open';
  try {
    localStorage.setItem(rail.key, closed ? '1' : '0');
  } catch {}
  /* 헤더의 인덱스 토글 버튼과 상태를 맞춘다 */
  for (const btn of document.querySelectorAll(`[aria-controls="starlight__${rail.attr}"]`)) {
    btn.setAttribute('aria-expanded', String(!closed));
  }
};

/** 화면에 지금 적용된 레일 폭(rem). 접혀 있으면 0 이다. */
const currentWidth = (rail) =>
  parseFloat(getComputedStyle(root).getPropertyValue(rail.prop)) || 0;

const setWidth = (name, value) => {
  const rail = RAILS[name];
  root.style.setProperty(rail.prop, `${value}rem`);
  const widths = readWidths();
  widths[name] = value;
  writeWidths(widths);
};

/** 반대쪽 레일과 읽는 칸의 최소 폭을 빼고 남는 만큼이 이 레일의 상한이다. */
const maxWidth = (name) => {
  const other = name === 'sidebar' ? 'toc' : 'sidebar';
  return BAND - 2 * GUTTER - MIN_MEASURE - currentWidth(RAILS[other]);
};

const reset = (name) => {
  const rail = RAILS[name];
  const widths = readWidths();
  delete widths[name];
  writeWidths(widths);
  root.style.removeProperty(rail.prop);
  if (isClosed(rail)) setClosed(rail, false);
};

function startDrag(name, handle, event) {
  const rail = RAILS[name];
  const px = rem();
  const startX = event.clientX;
  const startWidth = currentWidth(rail);

  handle.setPointerCapture(event.pointerId);
  handle.dataset.dragging = '';
  /* 드래그 중에는 본문 텍스트가 딸려 선택되지 않게 한다 */
  root.style.userSelect = 'none';

  const onMove = (moveEvent) => {
    const delta = ((moveEvent.clientX - startX) * rail.sign) / px;
    const raw = startWidth + delta;

    if (raw < SNAP) {
      if (!isClosed(rail)) setClosed(rail, true);
      return;
    }
    if (isClosed(rail)) setClosed(rail, false);
    setWidth(name, Math.min(Math.max(raw, MIN_RAIL), maxWidth(name)));
  };

  const onUp = () => {
    delete handle.dataset.dragging;
    root.style.removeProperty('user-select');
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
    handle.removeEventListener('pointercancel', onUp);
  };

  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
  handle.addEventListener('pointercancel', onUp);
}

for (const name of Object.keys(RAILS)) {
  const handle = document.createElement('div');
  handle.className = `split-handle split-handle--${name}`;
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute(
    'aria-label',
    name === 'sidebar' ? '인덱스 패널 폭 조절' : '목차 패널 폭 조절',
  );

  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    startDrag(name, handle, event);
  });
  handle.addEventListener('dblclick', () => reset(name));

  document.body.append(handle);
}
