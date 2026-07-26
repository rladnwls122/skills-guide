---
paths:
  - "src/content/docs/**/*.mdx"
---

```` ```mermaid ```` 블록을 건드릴 때만 해당한다. 전체 규약은 `src/content/docs/reference/style.mdx` 의 "D. 도식" 절에 있다.

## 문법

- 라벨 줄바꿈은 `<br/>` 다. `\n` 은 mermaid 11 에서 줄바꿈이 아니라 **글자로 렌더된다**.
- AWS 서비스·제품 노드는 아이콘 셰이프로 쓴다. 규격은 전 도식 공통:

  ```
  S3@{ icon: "logos:aws-s3", form: "square", label: "S3 버킷<br/>정적 호스팅", pos: "b", h: 46, w: 46 }
  ```

- **아이콘 셰이프는 엣지 문장 안에 못 쓴다.** `A["x"] -->|"라벨"| B["y"]` 를 아이콘화하려면 노드를 각자 줄에 선언하고 엣지는 id 로만 잇는다.
- subgraph 에는 `@{ icon: }` 문법이 없다. 클래스로 붙인다:

  ```
  subgraph EKS["<span class='icon--logos icon--logos--aws-eks'></span> EKS 클러스터"]
  ```

- 개념·데이터·판단 노드(`{"…?"}` 마름모, `"실제 데이터"` 등)는 아이콘 없이 둔다.
- `sequenceDiagram` 은 mermaid 가 아이콘을 지원하지 않는다. 손대지 않는다.
- `graph` 와 `flowchart` 는 아이콘 문법을 똑같이 처리한다. 둘을 통일하려고 기존 도식을 고치지 않는다.

## 아이콘 고르는 순서

1. `logos:aws-*` — Iconify 의 AWS 로고
2. `aws:*` — Iconify 에 없는 것(ECR·CloudShell·NAT Gateway·서브넷·리전 등). 공식 AWS 패키지에서 뽑은 자체 팩
3. `logos:*` — kubernetes·docker-icon·terraform-icon·helm·prometheus·grafana 등
4. `mdi:*` — 위 어디에도 없는 개념일 때만

새 이름을 쓰려면 먼저 `src/mermaid-icons.mjs` 목록에 추가한다. `aws:*` 는 생성물이라 `scripts/build-aws-icons.mjs` 의 `WANTED` 에 항목을 넣고 다시 돌려야 한다.

## 확인

```bash
npm run check:icons
```

목록에 없는 아이콘을 쓰면 그 노드만 조용히 깨지고 **빌드는 통과한다**. 이 스크립트가 유일한 방어선이다.

렌더는 클라이언트에서 일어난다. 노드 개수만 세는 확인으로는 "아이콘이 빈 사각형으로 그려지는" 실패를 못 잡는다 — 실제로 그 사고가 있었다. 브라우저로 볼 때는 아이콘의 `path` 가 실제로 들어있는지까지 본다.
