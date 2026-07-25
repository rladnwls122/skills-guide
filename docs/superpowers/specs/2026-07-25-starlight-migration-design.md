# skills-guide → Astro Starlight 이관 설계 (Apple 스타일)

날짜: 2026-07-25 · 상태: 승인됨

## 목표

skills-guide(58개 md, PART 0~6 + reference)를 레포 루트에서 Astro Starlight 사이트로 전환.
콘텐츠는 mdx로 형식 변환만(리라이트 없음), 디자인은 `DESIGN-apple.md` 토큰 전면 적용,
Netlify 배포.

## 결정 사항

| 항목 | 결정 |
|---|---|
| 사이트 위치 | skills-2026-learn_module 레포 루트를 Astro 프로젝트로 전환 |
| 문서 형식 | 전부 `.mdx` + frontmatter |
| 배포 | Netlify (기존 set-06 사이트와 별개) |
| 스타일 범위 | 랜딩 + 문서 전체 Apple 토큰 |
| 테마 | 기성 테마 없음 — DESIGN-apple.md 기반 커스텀 CSS |

## 구조

```
skills-2026-learn_module/
├── astro.config.mjs        # Starlight + 플러그인 10종
├── package.json
├── netlify.toml            # build: astro build, publish: dist
├── src/
│   ├── content/docs/
│   │   ├── index.mdx       # Apple 랜딩 (기존 README 내용, splash)
│   │   ├── start/          # 00-prerequisites 7문서
│   │   ├── part-1/ ~ part-6/
│   │   └── reference/      # 치트시트·트러블슈팅·AI 가이드 + STYLE
│   └── styles/apple.css
└── (기존 루트 md 폴더는 이관 후 삭제 — 히스토리 보존)
```

사이드바: `starlight-sidebar-topics` — 시작 / PART 1~6 / Reference 탭.

## 플러그인 (10종)

astro-mermaid · starlight-quiz · starlight-links-validator · starlight-heading-badges
· starlight-sidebar-topics · starlight-fullview-mode · starlight-scroll-to-top
· starlight-image-zoom · starlight-copy-button · starlight-codeblock-fullscreen

호환 안 되는 플러그인은 그것만 제외하고 보고.

## Apple 디자인 (DESIGN-apple.md 준수)

### 랜딩 (index.mdx)

- 히어로: 56px/600 네거티브 자간 헤드라인 + 28px 태그라인 + 파란 pill CTA 2개.
- PART 0~6 = 풀블리드 타일 7장, 라이트(#fff/#f5f5f7) ↔ 다크(#272729/#2a2a2c) 교차.
  색 전환이 구분선 — 보더·그림자·그라디언트 금지.
- 파치먼트 푸터 — reference 덴스 링크 (line-height 2.41).

### 문서 전체 (CSS 토큰 오버라이드)

- 단일 액센트 #0066cc (다크 모드 #2997ff). Starlight 보라 완전 대체.
- Inter (SF Pro 대체, `font-feature-settings: "ss03"`, 디스플레이 자간 -0.01em 보정).
- 본문 17px/1.47, 헤드라인 weight 600 (700 금지, 500 부재).
- 카드 그림자 제거 → 헤어라인 #e0e0e0 1px, radius 18px. pill 버튼.
- 다크 모드: Starlight 토글 유지, Apple 다크 타일 팔레트(#1d1d1f 계열) 매핑.

## 콘텐츠 변환 규칙

1. 본문 무수정 이관 — 형식만 변환.
2. frontmatter: title(기존 h1), description, sidebar order.
3. 상대 링크 `*.md` → 라우트 링크.
4. theory 자기 점검 퀴즈 → starlight-quiz 컴포넌트.
5. "함정"·"실측" 마커 → heading-badges.
6. mermaid 코드블록 무변경.

## 리스크

- 커뮤니티 플러그인 Starlight 최신 호환 — 설치 시 검증.
- 58개 일괄 변환 → PART별 에이전트 분산 (opus/high).
