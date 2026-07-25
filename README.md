# skills-guide

전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드 — Astro Starlight 문서 사이트.

- 콘텐츠: `src/content/docs/` (시작 / part-1~6 / reference)
- 디자인: `src/styles/apple.css` (DESIGN-apple 토큰, 단일 액센트 #0066cc)
- 설계·계획: `docs/superpowers/`

## 개발

```bash
npm install
npm run dev      # 로컬 미리보기
npm run build    # 프로덕션 빌드 (links-validator 포함)
```

## 배포

Netlify — `netlify deploy --prod` (build: `npm run build`, publish: `dist/`).
