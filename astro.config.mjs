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

import mdx from '@astrojs/mdx';
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

/* Starlight 의 ThemeSelect 는 헤더와 모바일 메뉴 두 곳에 렌더된다. 커스텀 요소가
   생성될 때마다 생성자가 onThemeChange(loadTheme()) 를 부르는데, 그 값은 head 의
   ThemeProvider 가 이미 박아둔 값과 같다 — 즉 data-theme 에 같은 값을 두 번 더 쓴다.

   astro-mermaid 는 값이 실제로 바뀌었는지 보지 않고 data-theme '쓰기'마다 모든
   도식의 data-processed 를 떼고 initMermaid() 를 다시 부른다. 그래서 페이지를 열
   때마다 렌더가 3벌(최초 1 + 무의미한 쓰기 2) 동시에 돈다 — 도식 6개짜리 페이지면
   18번이다. 모바일에서는 그 3배가 그대로 CPU 시간이 되어, 다 그려질 때까지 도식
   자리가 한참 빈 칸으로 남는다.

   같은 값 쓰기를 dataset 단계에서 삼킨다. setAttribute 를 가로채는 걸로는 안 된다 —
   Starlight 도 우리 스크립트도 `dataset.theme = ...` 로 쓰고, DOMStringMap 의 네이티브
   세터는 JS 로 덮어쓴 setAttribute 를 타지 않는다. 커스텀 요소들은 모듈 스크립트라
   defer 되므로, head 인라인인 이 스크립트가 항상 먼저 돈다. */
const dedupeThemeWrites = `(()=>{try{var e=document.documentElement,d=e.dataset;
Object.defineProperty(e,'dataset',{configurable:true,value:new Proxy(d,{
get:function(t,k){var v=t[k];return typeof v==='function'?v.bind(t):v},
set:function(t,k,v){if(k==='theme'&&t[k]===String(v))return true;t[k]=v;return true}})})}catch(e){}})()`;

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
    iconPacks: [
      { name: 'logos', url: iconifyUrl('logos', 'json') },
      { name: 'mdi', url: iconifyUrl('mdi', 'json') },
      { name: 'simple-icons', url: iconifyUrl('simple-icons', 'json') },
      /* IconifyJSON 전체를 넘긴다 — 안쪽 icons 맵만 주면 크기만 잡히고
         body 가 비어 아이콘이 빈 사각형으로 그려진다. */
      { name: 'aws', icons: awsIcons },
      { name: 'k8s', icons: k8sIcons },
    ],
  }), mermaidFullscreen, splitView, scrollbars, starlight({
    title: 'skills-guide',
    description: '전국기능경기대회 클라우드컴퓨팅 2주 완성 가이드',
    defaultLocale: 'root',
    locales: { root: { label: '한국어', lang: 'ko' } },
    customCss: [
      /* 레이어 순서를 먼저 선언해야 한다 — 뒤에 오는 파일들이 그 순서를 전제한다.
         자세한 것은 파일 안 주석. */
      './src/styles/tailwind.css',
      './src/styles/korean-fonts.css',
      './src/styles/mermaid.css',
      './src/styles/mermaid-aws-icons.css',
      './src/styles/mermaid-k8s-icons.css',
      './src/styles/mobile.css',
      './src/styles/sidebar-toggle.css',
      './src/styles/layout.css',
      './src/styles/scrollbar.css',
      './src/styles/landing.css',
    ],
    /* subgraph 라벨의 <span class='icon--logos--*'> 를 정의하는 CSS.
       아이콘이 데이터 URI 로 들어 있어 아이콘 개수와 무관하게 요청은 팩당 1건이다.
       mdi 는 단색이라 색을 박아야 한다 — 다크·라이트 양쪽에서 읽히는 중간톤으로 고정. */
    head: [
      { tag: 'link', attrs: { rel: 'stylesheet', href: iconifyUrl('logos', 'css') } },
      { tag: 'link', attrs: { rel: 'stylesheet', href: iconifyUrl('mdi', 'css', '&color=%238ab') } },
      { tag: 'script', content: dedupeThemeWrites },
      { tag: 'script', content: splitViewRestore },
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
          label: 'PART 2 — 1과제 · EKS·관측성',
          link: '/part-2/04-eksctl-cluster/',
          items: [{ label: 'D4~8', items: [{ autogenerate: { directory: 'part-2' } }] }],
        },
        {
          label: 'PART 3 — Hard Mode',
          link: '/part-3/08-private-eks-iam/',
          items: [{ label: 'D9', items: [{ autogenerate: { directory: 'part-3' } }] }],
        },
        {
          label: 'PART 4 — 2과제 모듈',
          link: '/part-4/09-serverless-event/',
          items: [{ label: 'D10~12', items: [{ autogenerate: { directory: 'part-4' } }] }],
        },
        {
          label: 'PART 5 — 3과제 운영',
          link: '/part-5/14-task3-load-ops/',
          items: [{ label: 'D13~14', items: [{ autogenerate: { directory: 'part-5' } }] }],
        },
        {
          label: 'PART 6 — Battle Drills',
          link: '/part-6/15-mutation-drill/',
          items: [{ label: '일차 없음', items: [{ autogenerate: { directory: 'part-6' } }] }],
        },
        {
          label: 'Reference',
          link: '/reference/cheatsheet/',
          icon: 'open-book',
          items: [{ label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] }],
        },
      ]),
      /* `#roadmap` 은 DayRail 컴포넌트가 다는 id 다. 검증기는 마크다운 제목에서만
         앵커를 모으므로 컴포넌트가 만든 id 를 보지 못한다 — 링크는 실제로 살아 있다. */
      starlightLinksValidator({ errorOnRelativeLinks: false, exclude: ['#roadmap'] }),
    ],
  }), mdx(), svelte()],
  vite: { plugins: [tailwindcss()] },
});
