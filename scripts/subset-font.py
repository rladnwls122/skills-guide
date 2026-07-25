"""한글 서체 서브셋 생성.

테마의 라틴 서체(Alegreya Sans·Literata)에는 한글 글리프가 없어, 한글이 전부
시스템 폰트로 떨어진다. 역할별로 한글 짝을 붙이되 원본이 6~23MB라 그대로 실을 수
없으므로, 문서에 실제로 쓰인 글자만 남겨 woff2 로 굽는다.

    pip install fonttools brotli
    npm run font

결과물(src/fonts/*.woff2)은 레포에 커밋되므로 빌드에는 Python 이 필요 없다.
문서에 새 한글 음절이 들어오면 다시 실행할 것 — 안 하면 그 글자만 시스템 폰트로
떨어진다.
"""

import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "src" / "fonts"

# 역할 → 원본 서체
FONTS = [
    {
        # 제목·본문(reading column) — 조선일보명조. 단일 굵기라 CSS 에서 400 만
        # 선언하고 700 은 브라우저 합성에 맡긴다(korean-fonts.css 주석 참고).
        "name": "chosun-sm",
        "src": Path.home() / "Downloads" / "ChosunSm.TTF",
        "hint": "ChosunSm.TTF 를 Downloads 에 두거나 이 경로를 고칠 것",
    },
    {
        # UI 크롬 — Alegreya Sans(산세리프)의 한글 짝. 가변 굵기.
        "name": "pretendard",
        "src": ROOT
        / "node_modules/pretendard/dist/public/variable/PretendardVariable.ttf",
        "hint": "`npm install` 로 받아진다",
    },
    {
        # 코드블록 — JetBrains Mono 에 한글이 없어 주석이 시스템 폰트로 떨어진다.
        # 고정폭 한글 코딩 서체로 받는다. 굵기가 파일로 갈려 있어 두 벌.
        "name": "elice-coding-400",
        "src": Path.home()
        / "Downloads/EliceDigitalCoding_TTF/EliceDigitalCodingverH_Regular.ttf",
        "hint": "EliceDigitalCoding_TTF 를 Downloads 에 두거나 이 경로를 고칠 것",
    },
    {
        "name": "elice-coding-700",
        "src": Path.home()
        / "Downloads/EliceDigitalCoding_TTF/EliceDigitalCodingverH_Bold.ttf",
        "hint": "EliceDigitalCoding_TTF 를 Downloads 에 두거나 이 경로를 고칠 것",
    },
]

# 콘텐츠에 없어도 항상 포함 — 제목·UI 라벨이 나중에 이 글자들을 쓸 수 있다.
ALWAYS = set(
    "".join(chr(c) for c in range(0x20, 0x7F))  # ASCII 인쇄 가능
    + "—–…·×÷±°∼~《》「」『』〈〉【】"
    + "₩€£¥→←↑↓⇒⇔≤≥≠≈"
)


def used_chars() -> set[str]:
    chars: set[str] = set()
    for pattern in ("src/content/docs/**/*.mdx", "*.md", "astro.config.mjs"):
        for path in ROOT.glob(pattern):
            chars |= set(path.read_text(encoding="utf-8"))
    return chars


def ensure_src(font: dict) -> Path:
    src: Path = font["src"]
    if not src.exists():
        sys.exit(f"원본 서체가 없다: {src}\n  ({font['hint']})")
    return src


def axis_range(font: TTFont) -> str:
    fvar = font.get("fvar")
    if not fvar:
        return "단일 굵기"
    wght = next((a for a in fvar.axes if a.axisTag == "wght"), None)
    return f"wght {wght.minValue:g}–{wght.maxValue:g}" if wght else "가변"


def main() -> None:
    # 윈도우 콘솔 기본 코드페이지(cp949)로는 출력 문자가 깨지거나 죽는다.
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    text = "".join(sorted(used_chars() | ALWAYS))
    hangul = sum(1 for c in text if "가" <= c <= "힣")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"대상 글자 {len(text)}자 (한글 {hangul}음절)\n")

    for spec in FONTS:
        src = ensure_src(spec)
        font = TTFont(src)
        axes = axis_range(font)

        options = Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.drop_tables += ["DSIG"]
        subsetter = Subsetter(options=options)
        subsetter.populate(text=text)
        subsetter.subset(font)

        out = OUT_DIR / f"{spec['name']}.woff2"
        font.flavor = "woff2"
        font.save(out)
        print(
            f"  {out.name:<22} {out.stat().st_size / 1024:6.0f}KB"
            f"   (원본 {src.stat().st_size / 1024 / 1024:.1f}MB, {axes})"
        )


if __name__ == "__main__":
    main()
