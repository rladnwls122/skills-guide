// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
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
import rehypeExternalLinks from 'rehype-external-links';

import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import { iconifyUrl } from './src/mermaid-icons.mjs';
/* Iconify 에 없는 AWS 서비스·리소스용 자체 팩. scripts/build-aws-icons.mjs 가
   AWS 공식 아이콘 패키지에서 뽑아 만든다. */
import awsIcons from './src/icons/aws.json';
/* kubernetes 공식 리소스 아이콘. scripts/build-k8s-icons.mjs 가 만든다. */
import k8sIcons from './src/icons/k8s.json';

/** @type {import('astro').AstroIntegration} */
const mermaidFullscreen = {
  name: 'mermaid-fullscreen',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('page', `import '/src/scripts/mermaid-fullscreen.js';`);
    },
  },
};

/** @type {import('astro').AstroIntegration} */
const scrollbars = {
  name: 'scrollbars',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('page', `import '/src/scripts/scrollbars.js';`);
    },
  },
};

/** @type {import('astro').AstroIntegration} */
const splitView = {
  name: 'split-view',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('page', `import '/src/scripts/split-view.js';`);
    },
  },
};

/* GFM 이 잠가 놓은 체크박스를 살리고 진도를 브라우저에 남긴다. 문서 쪽은 손대지
   않는다 — 항목을 새로 쓸 때 문법을 따로 외우지 않아도 되게 하려는 것이다. */
/** @type {import('astro').AstroIntegration} */
const progress = {
  name: 'progress',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('page', `import '/src/scripts/progress.js';`);
    },
  },
};

/* 저장된 레일 폭·접힘 상태를 첫 페인트 전에 되돌린다. head 인라인이 아니면
   페이지를 넘길 때마다 기본 폭이 한 프레임 보였다가 바뀐다. */
/* 접혀 있는 레일에는 저장된 폭을 다시 얹지 않는다 — 인라인 커스텀 속성이
   html[data-*='closed'] 의 0rem 규칙을 이겨서, 패널만 숨고 폭은 그대로 남는다. */
const splitViewRestore = `(()=>{try{var r=document.documentElement,
w=JSON.parse(localStorage.getItem('sl-split-steps')||'{}'),
sc=localStorage.getItem('sl-sidebar-collapsed')==='1',
tc=localStorage.getItem('sl-toc-collapsed')==='1';
if(w.sidebar&&!sc)r.style.setProperty('--sl-sidebar-width',w.sidebar+'rem');
if(w.toc&&!tc)r.style.setProperty('--sl-exquisitus-toc-width',w.toc+'rem');
if(tc)r.dataset.toc='closed';}catch(e){}})()`;

export default defineConfig({
  /* Vercel 은 프로젝트를 도메인 루트에 그대로 배포한다 — base 불필요, 문서의
     `/part-1/...` 절대 링크가 손 안 대고 그대로 산다. 커스텀 도메인을 붙이면
     여기 site 를 그 도메인으로 채울 것(사이트맵·canonical URL 용). */
  /* GFM 의 취소선은 기본으로 홑물결(~)도 구분자로 먹는다 — "D4~7", "8~10h" 같은
     범위 표기가 문단 안에서 짝 지어져 그 사이 전체가 취소선으로 렌더된다.
     내장 gfm 을 끄고 remark-gfm 을 singleTilde:false 로 직접 넣어 겹물결(~~)만
     취소선으로 남긴다 — 나머지 GFM 기능(표·작업 목록 등)은 그대로다. */
  site: 'https://skills-2026-learn-module.vercel.app',
  /* 문서 139쪽은 그대로 정적으로 굽는다. 어댑터는 `/api/*` 만 함수로 만들기 위한 것이고,
     그 경로들이 각자 `prerender = false` 를 선언한다. 진도 동기화가 쓰는 곳이다. */
  adapter: vercel(),
  /* 외부 링크는 새 탭으로 연다 — 공식 문서를 열어 값을 찾다가 읽던 자리를
     잃지 않게 한다. 사이트 안 링크(`/part-1/...`)와 앵커는 대상이 아니다.
     `rel` 은 새 탭이 원본 창을 조작하지 못하게 막는 표준 조합이다. */
  markdown: {
    gfm: false,
    remarkPlugins: [[remarkGfm, { singleTilde: false }]],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
  /* autoTheme 를 끈다 — 도식 색은 src/styles/mermaid-theme.css 가 CSS 변수로 낸다.
     켜두면 astro-mermaid 가 data-theme 를 지켜보다가 값이 바뀔 때마다 모든 도식의
     data-processed 를 떼고 mermaid 를 통째로 다시 돌린다: 테마를 누를 때마다 도식이
     전부 빈 칸이 됐다 수백 ms 뒤 돌아오고, 게다가 Starlight 의 ThemeSelect 가 헤더와
     모바일 메뉴 두 곳에서 같은 값을 다시 쓰는 탓에 페이지를 열 때마다 무의미한 렌더가
     두 벌 더 붙었다. 끄면 mermaid 는 항상 'default' 테마로 한 번만 그리고, 다크/라이트
     차이는 브라우저의 CSS 값 재계산으로 끝난다. */
  integrations: [mermaid({
    autoTheme: false,
    mermaidConfig: {
      themeVariables: {
        fontSize: '18px',
      },
    },
    iconPacks: [
      { name: 'logos', url: iconifyUrl('logos', 'json') },
      { name: 'mdi', url: iconifyUrl('mdi', 'json') },
      { name: 'simple-icons', url: iconifyUrl('simple-icons', 'json') },
      /* IconifyJSON 전체를 넘긴다 — 안쪽 icons 맵만 주면 크기만 잡히고
         body 가 비어 아이콘이 빈 사각형으로 그려진다. */
      { name: 'aws', icons: awsIcons },
      { name: 'k8s', icons: k8sIcons },
    ],
  }), mermaidFullscreen, splitView, scrollbars, progress, starlight({
    title: 'skills-guide',
    /* 안 주면 Starlight 가 /favicon.svg 를 가리키는데 그 파일이 없어 페이지마다
       404 가 하나씩 났다. 대회 로고에서 구운 180px PNG 를 쓴다. */
    favicon: '/favicon.png',
    description: '전국기능경기대회 클라우드컴퓨팅 한 달 완성 가이드',
    defaultLocale: 'root',
    locales: { root: { label: '한국어', lang: 'ko' } },
    /* 상단바 오른쪽 GitHub 아이콘. SocialIcons 오버라이드가 <Default /> 를 그대로
       렌더하므로, 여기 넣은 항목이 로그인 단추 왼쪽에 붙는다. */
    social: [
      {
        icon: 'github',
        label: 'GitHub',
        href: 'https://github.com/rladnwls122/skills-guide',
      },
    ],
    customCss: [
      /* 레이어 순서를 먼저 선언해야 한다 — 뒤에 오는 파일들이 그 순서를 전제한다.
         자세한 것은 파일 안 주석. */
      './src/styles/tailwind.css',
      './src/styles/korean-fonts.css',
      './src/styles/mermaid.css',
      './src/styles/mermaid-theme.css',
      './src/styles/mermaid-aws-icons.css',
      './src/styles/mermaid-k8s-icons.css',
      './src/styles/diagram-note.css',
      './src/styles/build-step.css',
      './src/styles/mobile.css',
      './src/styles/sidebar-toggle.css',
      './src/styles/layout.css',
      './src/styles/scrollbar.css',
      './src/styles/codeblock-fullscreen.css',
      './src/styles/progress.css',
      './src/styles/landing.css',
    ],
    /* subgraph 라벨의 <span class='icon--logos--*'> 를 정의하는 CSS.
       아이콘이 데이터 URI 로 들어 있어 아이콘 개수와 무관하게 요청은 팩당 1건이다.
       mdi 는 단색이라 색을 박아야 한다 — 다크·라이트 양쪽에서 읽히는 중간톤으로 고정. */
    head: [
      { tag: 'link', attrs: { rel: 'stylesheet', href: iconifyUrl('logos', 'css') } },
      { tag: 'link', attrs: { rel: 'stylesheet', href: iconifyUrl('mdi', 'css', '&color=%238ab') } },
      { tag: 'script', content: splitViewRestore },
    ],
    /* 목차 오버라이드 둘은 starlight-quiz 의 것을 감싼 것이다 — 배지를 목차
       패널에서만 감춘다(본문 제목에는 그대로 남는다). 파일 안 주석 참고. */
    components: {
      SiteTitle: './src/components/SiteTitle.astro',
      /* 상단바 오른쪽에 로그인 단추를 붙이려고 감싼 것이다. 기본 소셜 아이콘은 그대로 렌더한다. */
      SocialIcons: './src/components/SocialIcons.astro',
      TableOfContents: './src/components/TableOfContents.astro',
      MobileTableOfContents: './src/components/MobileTableOfContents.astro',
    },
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
          /* 주제마다 아이콘을 하나씩 준다. 사이드바 주제 목록은 글자만 보면 전부 "PART N"
             으로 시작해 구분이 안 된다 — 아이콘이 그 자리에서 무엇을 다루는지 말한다. */
          label: 'PART 0 — 컴퓨팅 기초',
          link: '/part-0/01-os-process/',
          icon: 'laptop',
          items: [{ label: 'Week 1', items: [{ autogenerate: { directory: 'part-0' } }] }],
        },
        {
          label: '시작 · 선수 지식',
          link: '/start/',
          icon: 'rocket',
          items: [{ label: 'Week 1', items: [{ autogenerate: { directory: 'start' } }] }],
        },
        {
          label: 'PART 1 — Foundation·IaC',
          link: '/part-1/06-terraform-vpc/',
          icon: 'document',
          items: [{ label: 'Week 2', items: [{ autogenerate: { directory: 'part-1' } }] }],
        },
        {
          label: 'PART 2 — 1과제 · EKS·관측성',
          link: '/part-2/09-eksctl-cluster/',
          icon: 'server',
          items: [{ label: 'Week 2', items: [{ autogenerate: { directory: 'part-2' } }] }],
        },
        {
          label: 'PART 3 — Hard Mode',
          link: '/part-3/13-private-eks-iam/',
          icon: 'padlock',
          items: [{ label: 'Week 3', items: [{ autogenerate: { directory: 'part-3' } }] }],
        },
        {
          label: 'PART 4 — 2과제 모듈',
          link: '/part-4/14-serverless-event/',
          icon: 'puzzle',
          items: [{ label: 'Week 3', items: [{ autogenerate: { directory: 'part-4' } }] }],
        },
        {
          label: 'PART 5 — 3과제 운영',
          link: '/part-5/21-task3-deploy/',
          icon: 'analytics',
          items: [{ label: 'Week 4', items: [{ autogenerate: { directory: 'part-5' } }] }],
        },
        {
          label: 'PART 6 — Battle Drills',
          link: '/part-6/23-mutation-drill/',
          icon: 'random',
          items: [{ label: 'Week 4', items: [{ autogenerate: { directory: 'part-6' } }] }],
        },
        {
          label: 'Reference',
          link: '/reference/cheatsheet/',
          icon: 'open-book',
          items: [{ label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] }],
        },
        /* 문서가 아니라 도구다. Diátaxis 네 유형 어디에도 안 들어가므로 주제를 따로 준다. */
        {
          label: '진도',
          link: '/progress/',
          icon: 'approve-check',
          items: [
            {
              label: '진도',
              items: [
                { label: '저장 상태', link: '/progress/' },
                { label: '로그인', link: '/login/' },
              ],
            },
          ],
        },
      ]),
      /* `#roadmap` 은 DayRail 컴포넌트가 다는 id 다. 검증기는 마크다운 제목에서만
         앵커를 모으므로 컴포넌트가 만든 id 를 보지 못한다 — 링크는 실제로 살아 있다. */
      starlightLinksValidator({ errorOnRelativeLinks: false, exclude: ['#roadmap'] }),
    ],
  }), mdx(), svelte()],
  vite: { plugins: [tailwindcss()] },
});
