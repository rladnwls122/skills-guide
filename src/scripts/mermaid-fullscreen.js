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

	let scale = 1;
	let x = 0;
	let y = 0;

	// 화면에 딱 맞는 기준 폭. viewBox 비율로 높이도 넘치지 않게 맞춘다.
	const box = clone.viewBox?.baseVal;
	const ratio = box && box.width ? box.height / box.width : 0;
	const fitW = Math.min(innerWidth * 0.92, 1600);
	const maxH = innerHeight * 0.78;
	const baseW = ratio && fitW * ratio > maxH ? maxH / ratio : fitW;

	/*
	 * 확대는 transform: scale() 이 아니라 **레이아웃 폭**으로 한다.
	 * scale() 은 이미 그려진 래스터를 늘리는 합성 연산이라 SVG 인데도 확대하면
	 * 뭉개진다. 폭을 바꾸면 브라우저가 벡터를 그 해상도로 다시 그려서 몇 배를
	 * 키워도 선과 글자가 또렷하다. 이동(translate)은 래스터를 늘리지 않으므로
	 * 그대로 transform 에 둔다.
	 */
	const apply = () => {
		clone.style.width = `${baseW * scale}px`;
		clone.style.height = "auto";
		canvas.style.transform = `translate(${x}px, ${y}px)`;
	};
	apply();
	const zoom = (factor, originX, originY) => {
		const next = Math.min(8, Math.max(0.25, scale * factor));
		// 커서(또는 손가락) 아래 지점을 고정한 채 확대한다.
		if (originX !== undefined) {
			const rect = stage.getBoundingClientRect();
			const cx = originX - rect.left - rect.width / 2;
			const cy = originY - rect.top - rect.height / 2;
			x = cx - ((cx - x) * next) / scale;
			y = cy - ((cy - y) * next) / scale;
		}
		scale = next;
		apply();
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
		else if (e.key === "0") {
			scale = 1;
			x = 0;
			y = 0;
			apply();
		}
	};

	overlay.addEventListener("click", (e) => {
		const act = e.target.closest("[data-act]")?.dataset.act;
		if (act === "close" || e.target === stage || e.target === overlay) close();
		else if (act === "in") zoom(1.25);
		else if (act === "out") zoom(0.8);
		else if (act === "reset") {
			scale = 1;
			x = 0;
			y = 0;
			apply();
		}
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
			x += e.clientX - prev.clientX;
			y += e.clientY - prev.clientY;
			apply();
		}
	});
	const release = (e) => {
		pointers.delete(e.pointerId);
		if (pointers.size < 2) pinchDist = 0;
	};
	stage.addEventListener("pointerup", release);
	stage.addEventListener("pointercancel", release);

	document.addEventListener("keydown", onKey);
	document.documentElement.classList.add("mfs-open");
	document.body.appendChild(overlay);
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
	btn.addEventListener("click", () => openViewer(svg, caption));

	const frame = document.createElement("figure");
	frame.className = "mfs-frame";
	pre.replaceWith(frame);
	frame.append(pre, btn);
}

function scan() {
	document.querySelectorAll("pre.mermaid").forEach(decorate);
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
document.addEventListener("astro:page-load", scan);
