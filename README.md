# skills-guide

전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드 — Astro Starlight 문서 사이트.

**사이트: Vercel (도메인은 배포 후 확정)**

- 콘텐츠: `src/content/docs/` (시작 / part-1~6 / reference)
- 디자인: [starlight-theme-exquisitus](https://github.com/anaxite/starlight-theme-exquisitus) — 팔레트·서체는 테마가 전담
- 한글 서체: 제목·본문 조선일보명조 · UI Pretendard — `src/styles/korean-fonts.css`
- 설계·계획: `docs/superpowers/`

## 개발

```bash
npm install
npm run dev      # 로컬 미리보기
npm run build    # 프로덕션 빌드 (links-validator 포함)
```

## 한글 서체 재생성

테마의 라틴 서체(Alegreya Sans·Literata)에는 한글 글리프가 없어, 역할별로 한글 짝을
따로 싣는다. 원본 합계 15.8MB 를 문서에 실제로 쓰인 글자만 남겨 405KB 로 굽고,
결과물은 레포에 커밋한다 — 빌드에는 Python 이 필요 없다.

| 역할 | 서체 | 서브셋 |
| --- | --- | --- |
| 제목·본문 | 조선일보명조 ChosunSm | 97KB |
| UI 크롬 | Pretendard | 187KB |
| 코드블록 | Elice Digital Coding (Regular·Bold) | 121KB |

```bash
pip install fonttools brotli
npm run font
```

ChosunSm·Elice 원본은 `~/Downloads/` 아래를 본다(`scripts/subset-font.py` 의
`FONTS` 에서 경로 변경). Pretendard 는 `npm install` 로 받아진다.

문서에 **새 한글 음절**이 들어오면 다시 실행할 것. 안 하면 그 글자만 시스템 폰트로 떨어진다.

## 배포

Vercel — 리포를 Vercel 프로젝트로 연결하면 Astro 를 자동 인식해 `main` push 마다
빌드·배포한다(설정 파일 불필요, 빌드 커맨드 `npm run build`, 출력 `dist`). GitHub
Pages 와 달리 리포를 public 으로 바꿀 필요가 없고, 도메인이 루트라 Astro `base`
도 안 건드린다.
