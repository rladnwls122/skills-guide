/**
 * mermaid 도식 전체화면 뷰어.
 *
 * astro-mermaid 는 `<pre class="mermaid">` 안의 텍스트를 클라이언트에서 SVG 로
 * 바꾼다. 아키텍처 도식이 커서 본문 폭에 눌리면 라벨이 안 읽히므로, 도식마다
 * 확대 버튼을 붙이고 오버레이에서 확대·이동해 볼 수 있게 한다.
 *
 * Fullscreen API 대신 고정 오버레이를 쓴다 — iOS Safari 는 video 가 아닌 요소의
 * 전체화면을 지원하지 않아 모바일에서 그대로 죽는다.
 */

const RENDERED = "data-mfs-ready";
const SIZED = "data-mfs-sized";

/*
 * mermaid 는 svg 에 width="100%" 만 박아둔다(height 는 없음). viewBox 만 있고
 * width/height 속성이 없는 인라인 svg 는, width:auto 를 줘도 "고유 크기 없음 +
 * 고유 비율 있음" 규칙에 따라 컨테이너 폭을 그대로 채워버린다 — CSS 만으로는
 * 못 막는다. viewBox 폭을 그대로 읽어 실제 픽셀 width 로 박아야 도식이 원래
 * 크기로 그려지고, 넘치는 부분은 프레임의 overflow-x:auto 가 스크롤한다.
 */
function sizeSvg(svg) {
	if (svg.hasAttribute(SIZED)) return;
	const box = svg.viewBox?.baseVal;
	if (box && box.width) {
		svg.style.width = `${box.width}px`;
	}
	svg.setAttribute(SIZED, "");
}

function openViewer(svg, caption) {
	const overlay = document.createElement("div");
	overlay.className = "mfs-overlay";
	overlay.innerHTML = `
		<div class="mfs-bar">
			<span class="mfs-caption"></span>
			<div class="mfs-actions">
				<button type="button" class="mfs-btn" data-act="out" aria-label="축소">−</button>
				<button type="button" class="mfs-btn" data-act="reset" aria-label="원래 크기">100%</button>
				<button type="button" class="mfs-btn" data-act="in" aria-label="확대">+</button>
				<button type="button" class="mfs-btn mfs-close" data-act="close" aria-label="닫기">✕</button>
			</div>
		</div>
		<div class="mfs-stage"><div class="mfs-canvas"></div></div>
	`;
	overlay.querySelector(".mfs-caption").textContent = caption || "";
	const canvas = overlay.querySelector(".mfs-canvas");
	const stage = overlay.querySelector(".mfs-stage");
	const clone = svg.cloneNode(true);
	// mermaid 가 박아둔 고정 크기를 걷어내야 자유롭게 키울 수 있다(viewBox 는 남긴다).
	clone.removeAttribute("width");
	clone.removeAttribute("height");
	clone.style.maxWidth = "none";
	clone.style.maxHeight = "none";
	canvas.appendChild(clone);
	// 무대 크기를 재려면 먼저 문서에 붙어 있어야 한다.
	document.documentElement.classList.add("mfs-open");
	document.body.appendChild(overlay);

	/*
	 * 기준 크기는 **도식의 원래 크기(viewBox)** 다. 예전처럼 화면 폭에 맞추면
	 * 가로로 긴 아키텍처 도식이 좁은 화면에서 그대로 쪼그라들어(모바일에선 1/5 토막)
	 * 확대해 보려고 연 전체화면이 오히려 더 작아진다.
	 */
	const box = clone.viewBox?.baseVal;
	const natW = box && box.width ? box.width : clone.getBoundingClientRect().width || 1;
	const natH = box && box.height ? box.height : 1;

	/*
	 * 확대는 transform: scale() 이 아니라 **레이아웃 폭**으로 한다.
	 * scale() 은 이미 그려진 래스터를 늘리는 합성 연산이라 SVG 인데도 확대하면
	 * 뭉개진다. 폭을 바꾸면 브라우저가 벡터를 그 해상도로 다시 그려서 몇 배를
	 * 키워도 선과 글자가 또렷하다.
	 */
	const apply = () => {
		clone.style.width = `${natW * scale}px`;
		clone.style.height = "auto";
	};

	// 화면보다 작은 도식만 무대에 꽉 차게 키운다. 큰 도식은 원래 크기(1배)로 두고
	// 넘치는 만큼은 스크롤·드래그로 본다 — 축소해서 안 보이게 만드는 것보다 낫다.
	const fitScale = () => {
		const r = stage.getBoundingClientRect();
		return Math.min(r.width / natW, r.height / natH);
	};
	let scale = Math.max(1, fitScale());
	apply();
	// 원래 크기가 무대보다 크면 가운데부터 보여준다(왼쪽 위 귀퉁이는 대개 여백).
	const center = () => {
		stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
		stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
	};
	center();

	/*
	 * 이동은 무대의 **네이티브 스크롤**로 한다. 예전엔 canvas 를 translate 로 밀었는데,
	 * 가운데 정렬된 채로 넘친 영역은 스크롤로 되돌아올 수 없어서 넓은 도식의 좌우가
	 * 잘린 채 못 보는 구간이 생겼다. 스크롤이면 스크롤바가 곧 "여기 더 있다" 는 표시다.
	 */
	const zoom = (factor, originX, originY) => {
		const next = Math.min(8, Math.max(0.1, scale * factor));
		const r = stage.getBoundingClientRect();
		// 커서(또는 두 손가락 가운데) 아래 지점을 고정한 채 확대한다.
		const px = (originX ?? r.left + r.width / 2) - r.left;
		const py = (originY ?? r.top + r.height / 2) - r.top;
		const cx = (stage.scrollLeft + px) / scale;
		const cy = (stage.scrollTop + py) / scale;
		scale = next;
		apply();
		stage.scrollLeft = cx * scale - px;
		stage.scrollTop = cy * scale - py;
	};
	const reset = () => {
		scale = Math.max(1, fitScale());
		apply();
		center();
	};

	const close = () => {
		overlay.remove();
		document.removeEventListener("keydown", onKey);
		document.documentElement.classList.remove("mfs-open");
	};
	const onKey = (e) => {
		if (e.key === "Escape") close();
		else if (e.key === "+" || e.key === "=") zoom(1.25);
		else if (e.key === "-") zoom(0.8);
		else if (e.key === "0") reset();
	};

	overlay.addEventListener("click", (e) => {
		const act = e.target.closest("[data-act]")?.dataset.act;
		// stage 는 드래그로 도식을 옮기는 영역이다 — 빈 배경을 그냥 눌러도
		// 닫히면 안 된다(닫기는 ✕ 버튼이나 Esc 로만). act==="close" 만 닫는다.
		if (act === "close") close();
		else if (act === "in") zoom(1.25);
		else if (act === "out") zoom(0.8);
		else if (act === "reset") reset();
	});

	stage.addEventListener(
		"wheel",
		(e) => {
			e.preventDefault();
			zoom(e.deltaY < 0 ? 1.12 : 0.89, e.clientX, e.clientY);
		},
		{ passive: false },
	);

	// 드래그 이동 + 두 손가락 핀치. 포인터 이벤트라 마우스·터치·펜이 같은 경로다.
	const pointers = new Map();
	let pinchDist = 0;
	stage.addEventListener("pointerdown", (e) => {
		pointers.set(e.pointerId, e);
		stage.setPointerCapture(e.pointerId);
		if (pointers.size === 2) pinchDist = 0;
	});
	stage.addEventListener("pointermove", (e) => {
		if (!pointers.has(e.pointerId)) return;
		const prev = pointers.get(e.pointerId);
		pointers.set(e.pointerId, e);

		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
			if (pinchDist) {
				zoom(dist / pinchDist, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
			}
			pinchDist = dist;
		} else if (pointers.size === 1) {
			// 잡아끄는 방향으로 도식이 따라오도록 스크롤은 반대로 민다.
			stage.scrollLeft -= e.clientX - prev.clientX;
			stage.scrollTop -= e.clientY - prev.clientY;
		}
	});
	const release = (e) => {
		pointers.delete(e.pointerId);
		if (pointers.size < 2) pinchDist = 0;
	};
	stage.addEventListener("pointerup", release);
	stage.addEventListener("pointercancel", release);

	document.addEventListener("keydown", onKey);
	overlay.querySelector(".mfs-close").focus();
}

function decorate(pre) {
	const svg = pre.querySelector("svg");
	if (!svg || pre.hasAttribute(RENDERED)) return;
	pre.setAttribute(RENDERED, "");

	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = "mfs-open-btn";
	btn.setAttribute("aria-label", "도식 전체화면으로 보기");
	btn.innerHTML =
		"<span aria-hidden='true'>⤢</span><span class='mfs-label'>크게 보기</span>";
	// 도식 앞의 가장 가까운 문단을 설명 캡션으로 재활용한다.
	const caption = pre.previousElementSibling?.textContent?.trim().slice(0, 80) || "";
	btn.addEventListener("click", () => {
		const current = pre.querySelector("svg");
		if (current) openViewer(current, caption);
	});

	const frame = document.createElement("figure");
	frame.className = "mfs-frame";
	pre.replaceWith(frame);
	frame.append(pre, btn);
}

/*
 * astro-mermaid 는 렌더 시작 시점에 data-theme 를 한 번만 읽는다. 그 1회를 놓치면
 * 다크모드인데 라이트 테마로 그려져 글자가 검은색으로 남고, 재렌더는 data-theme 가
 * '바뀔 때'만 일어나므로 사용자가 테마를 건드리기 전까지 복구되지 않는다.
 *
 * 렌더 결과의 실제 테마를 svg 루트 fill 밝기로 읽어(다크 테마는 밝은 글자색) 문서
 * 테마와 어긋날 때만 data-theme 를 동기적으로 뒤집었다 되돌린다. 두 번의 변경이
 * 한 번의 MutationObserver 콜백으로 합쳐져 최종값으로 재렌더된다.
 *
 * 무조건 재렌더시키지 않는 이유: 정상인 페이지에서도 mermaid 작업이 2배가 된다.
 */
let themeRepairDone = false;

function isLightFill(color) {
	const [r, g, b] = (color.match(/\d+/g) || []).map(Number);
	if (r === undefined) return null;
	return 0.299 * r + 0.587 * g + 0.114 * b > 128;
}

function syncTheme() {
	// 페이지당 한 번만 시도한다. 재렌더된 svg 에는 표시가 없어 다시 검사 대상이 되므로,
	// 판별이 틀리면(또는 mermaid 가 예상과 다른 색을 쓰면) 재렌더가 무한히 반복된다.
	if (themeRepairDone) return;

	const html = document.documentElement;
	if (!html.dataset.theme) return;
	const wantDark = html.dataset.theme === "dark";

	const rendered = document.querySelectorAll("pre.mermaid[data-processed]");
	if (!rendered.length) return;

	// data-diagram 이 없는 도식이 하나라도 있으면 손대지 않는다 — 재렌더가 걸리면
	// astro-mermaid 가 렌더된 SVG 를 소스로 덮어써 그 도식이 영구히 깨진다.
	for (const pre of rendered) {
		if (!pre.getAttribute("data-diagram")) return;
	}

	const svg = rendered[0].querySelector("svg");
	if (!svg) return;

	const light = isLightFill(getComputedStyle(svg).fill);
	if (light === null) return;
	themeRepairDone = true;
	if (light === wantDark) return; // 밝은 글자 = 다크 테마. 일치하면 할 일 없음

	const current = html.dataset.theme;
	html.dataset.theme = current === "dark" ? "light" : "dark";
	html.dataset.theme = current;
}

function scan() {
	document.querySelectorAll("pre.mermaid").forEach(decorate);
	document.querySelectorAll("pre.mermaid svg").forEach(sizeSvg);
	syncTheme();
}

function init() {
	scan();
	// mermaid 는 비동기로 SVG 를 채워 넣는다 — 삽입될 때마다 다시 훑는다.
	const observer = new MutationObserver(scan);
	observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
// Starlight 의 뷰 트랜지션으로 페이지가 갈릴 때도 다시 건다.
document.addEventListener("astro:page-load", () => {
	themeRepairDone = false;
	scan();
});
