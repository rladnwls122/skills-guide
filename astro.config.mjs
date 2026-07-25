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

/** mermaid 도식에 전체화면 뷰어를 붙인다 (src/scripts/mermaid-fullscreen.js). */
const mermaidFullscreen = {
  name: 'mermaid-fullscreen',
  hooks: {
    'astro:config:setup'({ injectScript }) {
      injectScript('page', `import '/src/scripts/mermaid-fullscreen.js';`);
    },
  },
};

export default defineConfig({
  /* GitHub Pages 사용자 사이트(리포 이름 = rladnwls122.github.io)라 루트에 붙는다.
     base 는 '/' 기본값 그대로 — 문서의 `/part-1/...` 절대 링크가 손 안 대고 그대로 산다.
     프로젝트 리포로 되돌리면 base 가 생기고 그 링크들이 전부 깨진다. */
  site: 'https://rladnwls122.github.io',
  integrations: [
    mermaid(),
    mermaidFullscreen,
    starlight({
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
    }),
  ],
});
