// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightQuiz from 'starlight-quiz';
import starlightHeadingBadges from 'starlight-heading-badges';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightFullViewMode from 'starlight-fullview-mode';
import starlightScrollToTop from 'starlight-scroll-to-top';
import starlightLlmActions from 'starlight-llm-actions';
import starlightCodeblockFullscreen from 'starlight-codeblock-fullscreen';
import starlightLinksValidator from 'starlight-links-validator';
import starlightThemeExquisitus from 'starlight-theme-exquisitus';
import remarkGfm from 'remark-gfm';

import mdx from '@astrojs/mdx';

/** @type {import('astro').AstroIntegration} */
const mermaidFullscreen = {
  name: 'mermaid-fullscreen',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('page', `import '/src/scripts/mermaid-fullscreen.js';`);
    },
  },
};

export default defineConfig({
  /* Vercel 은 프로젝트를 도메인 루트에 그대로 배포한다 — base 불필요, 문서의
     `/part-1/...` 절대 링크가 손 안 대고 그대로 산다. 커스텀 도메인을 붙이면
     여기 site 를 그 도메인으로 채울 것(사이트맵·canonical URL 용). */
  /* GFM 의 취소선은 기본으로 홑물결(~)도 구분자로 먹는다 — "D4~7", "8~10h" 같은
     범위 표기가 문단 안에서 짝 지어져 그 사이 전체가 취소선으로 렌더된다.
     내장 gfm 을 끄고 remark-gfm 을 singleTilde:false 로 직접 넣어 겹물결(~~)만
     취소선으로 남긴다 — 나머지 GFM 기능(표·작업 목록 등)은 그대로다. */
  markdown: {
    gfm: false,
    remarkPlugins: [[remarkGfm, { singleTilde: false }]],
  },
  integrations: [mermaid({
    mermaidConfig: {
      themeVariables: {
        fontSize: '18px',
      },
    },
  }), mermaidFullscreen, starlight({
    title: 'skills-guide',
    description: '전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드',
    defaultLocale: 'root',
    locales: { root: { label: '한국어', lang: 'ko' } },
    customCss: [
      './src/styles/korean-fonts.css',
      './src/styles/mermaid.css',
      './src/styles/mobile.css',
      './src/styles/sidebar-toggle.css',
    ],
    components: { SiteTitle: './src/components/SiteTitle.astro' },
    plugins: [
      starlightThemeExquisitus(),
      starlightQuiz(),
      starlightHeadingBadges(),
      starlightFullViewMode(),
      starlightScrollToTop(),
      starlightLlmActions(),
      starlightCodeblockFullscreen(),
      starlightSidebarTopics([
        {
          label: '시작 (D0)',
          link: '/start/',
          icon: 'rocket',
          items: [{ label: '선수 지식', items: [{ autogenerate: { directory: 'start' } }] }],
        },
        {
          label: 'PART 1 — Foundation·IaC',
          link: '/part-1/01-terraform-vpc/',
          items: [{ label: 'D1~3', items: [{ autogenerate: { directory: 'part-1' } }] }],
        },
        {
          label: 'PART 2 — EKS Core',
          link: '/part-2/04-eksctl-cluster/',
          items: [{ label: 'D4~7', items: [{ autogenerate: { directory: 'part-2' } }] }],
        },
        {
          label: 'PART 3 — 관측성·Hard Mode',
          link: '/part-3/07-observability/',
          items: [{ label: 'D8~9', items: [{ autogenerate: { directory: 'part-3' } }] }],
        },
        {
          label: 'PART 4 — 2과제 패턴',
          link: '/part-4/09-serverless-event/',
          items: [{ label: 'D10~11', items: [{ autogenerate: { directory: 'part-4' } }] }],
        },
        {
          label: 'PART 5 — Battle Drills',
          link: '/part-5/11-mutation-drill/',
          items: [{ label: 'D12~14', items: [{ autogenerate: { directory: 'part-5' } }] }],
        },
        {
          label: 'PART 6 — 3과제 운영',
          link: '/part-6/14-task3-load-ops/',
          items: [{ label: '3과제', items: [{ autogenerate: { directory: 'part-6' } }] }],
        },
        {
          label: 'Reference',
          link: '/reference/cheatsheet/',
          icon: 'open-book',
          items: [{ label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] }],
        },
      ]),
      starlightLinksValidator({ errorOnRelativeLinks: false }),
    ],
  }), mdx()],
});
