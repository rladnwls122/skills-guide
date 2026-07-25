"""제목용 한글 서체(ChosunSm) 서브셋 생성.

Literata·Alegreya Sans 에는 한글 글리프가 없어 한글 제목이 시스템 폰트로 떨어진다.
원본 TTF 는 7.4MB — 문서에 실제로 쓰인 글자만 남겨 woff2 로 굽는다.

    python scripts/subset-font.py [원본TTF경로]

문서에 새 한글 음절이 들어오면 다시 실행할 것. 결과물(src/fonts/chosun-sm.woff2)은
레포에 커밋되므로 빌드에는 Python 이 필요 없다.
"""

import glob
import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "fonts" / "chosun-sm.woff2"
DEFAULT_SRC = Path.home() / "Downloads" / "ChosunSm.TTF"

# 콘텐츠에 없어도 항상 포함 — 제목이 나중에 이 글자들을 쓸 수 있다.
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


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.exists():
        sys.exit(f"원본 서체를 찾을 수 없다: {src}")

    chars = used_chars() | ALWAYS
    font = TTFont(src)
    options = Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.drop_tables += ["DSIG"]
    subsetter = Subsetter(options=options)
    subsetter.populate(text="".join(sorted(chars)))
    subsetter.subset(font)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(OUT)

    hangul = sum(1 for c in chars if "가" <= c <= "힣")
    print(
        f"{OUT.relative_to(ROOT)}  "
        f"{OUT.stat().st_size / 1024:.0f}KB  "
        f"(원본 {src.stat().st_size / 1024 / 1024:.1f}MB, 글자 {len(chars)}자 / 한글 {hangul}음절)"
    )


if __name__ == "__main__":
    main()
