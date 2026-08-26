<script>
	/* 4주 척도 — 랜딩의 중심축.
	 *
	 * 커리큘럼은 Week 1 에서 Week 4 까지 이어지는 한 줄이다. 그래서 PART 를 카드로 흩지 않고
	 * 페이지 한가운데를 지나는 한 줄에 꿴다. 스크롤 위치가 곧 주차 위치다.
	 *
	 * GSAP ScrollTrigger 가 스크롤 진행(0~1)을 하나 만들고, 나머지는 전부 그 값에서
	 * 파생된다 — 지금 몇 주차인지, 어느 마디까지 지나왔는지. 마디마다 트리거를 달지
	 * 않는 이유다. 계산이 한 군데에만 있다.
	 *
	 * 주차 카운터가 이 컴포넌트가 자바스크립트를 쓰는 이유다. 선이 차는 것까지는 CSS
	 * 스크롤 구동 애니메이션으로도 되지만, 숫자를 세는 것은 안 된다.
	 */
	import { onMount } from 'svelte';

	/** ticks: 눈금 개수 = 모듈 수. from: 그 PART 가 시작하는 주차. */
	const STOPS = [
		{
			part: '시작',
			day: 'Week 1',
			from: 1,
			days: 1,
			title: '준비',
			body: '계정·도구·비용 가드레일을 세우고 선수 지식을 자가진단한다.',
			done: '자가진단 통과',
			href: '/start/',
		},
		{
			part: 'PART 0',
			day: 'Week 1',
			from: 1,
			days: 5,
			title: '컴퓨팅 기초',
			body: '운영체제·네트워크·DNS/HTTP·리눅스·컨테이너의 원리부터 쌓는다. AWS 계정 없이 돌아가고, 뒤의 모든 파트가 여기에 기댄다.',
			done: '개념 자가진단 통과',
			href: '/part-0/01-os-process/',
		},
		{
			part: 'PART 1',
			day: 'Week 2',
			from: 2,
			days: 5,
			title: 'Foundation · IaC',
			body: 'Terraform 으로 VPC·KMS·S3/CloudFront·컨테이너·Lambda·DynamoDB 를 한 스택에 올린다.',
			done: '미니 스택 배포',
			href: '/part-1/06-terraform-vpc/',
		},
		{
			part: 'PART 2',
			day: 'Week 2',
			from: 2,
			days: 5,
			title: '1과제 — EKS 와 관측성',
			body: 'eksctl·k8s·LBC·관측성을 거쳐 1과제를 완주한다. 커리큘럼의 중심축이고, 여기서 점수가 나와야 나머지가 의미를 갖는다.',
			done: 'mark.sh 80%+ · No Data 0개',
			href: '/part-2/11-eksctl-cluster/',
		},
		{
			part: 'PART 3',
			day: 'Week 3',
			from: 3,
			days: 1,
			title: 'Hard Mode',
			body: 'fully-private EKS·IAM 심화·CoreDNS 커스텀 도메인. 1과제가 어렵게 나올 때의 보험이다.',
			done: '부분 재현',
			href: '/part-3/16-private-eks-iam/',
		},
		{
			part: 'PART 4',
			day: 'Week 3',
			from: 3,
			days: 7,
			title: '2과제 모듈',
			body: '서버리스·스케일링·로깅·스트리밍에 DocumentDB·VPC Lattice·CDN Function 을 더한다.',
			done: '모듈별 1회 배포',
			href: '/part-4/17-serverless-event/',
		},
		{
			part: 'PART 5',
			day: 'Week 4',
			from: 4,
			days: 2,
			title: '3과제 운영',
			body: '부하 아래에서 가용성·성능·비용 ratio 를 지킨다. 배점 40점으로 세 과제 중 가장 크다.',
			done: '부하 드릴 3회',
			href: '/part-5/24-task3-load-ops/',
		},
	];

	/* 고정 주차가 없는 PART. 척도에서 떼어 놓는다 — 일정 안에 자리가 없다는 사실 그대로다. */
	const DETACHED = {
		part: 'PART 6',
		day: '고정 주차 없음',
		title: 'Battle Drills',
		body: '30% 변동 드릴·파괴/복구 12종·4시간 모의 대회. 주차를 따로 주지 않고 위 일정 안에 끼워 넣는다.',
		done: '모의 대회 90%+',
		href: '/part-6/26-mutation-drill/',
	};

	const LAST_WEEK = 4;

	let track = $state(null);
	let progress = $state(0);

	/* 지금 몇 주차인가. 정지 상태(움직임 최소화·스크립트 실패)에서는 1 이 아니라
	   끝까지 온 것으로 둔다 — 내용을 감추지 않는 쪽이 안전하다. */
	let day = $derived(1 + Math.round(progress * (LAST_WEEK - 1)));

	onMount(() => {
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (still) {
			progress = 1;
			return;
		}

		let trigger;
		let cancelled = false;

		/* 번들을 페이지 로드에서 떼어 낸다 — 척도가 보일 때만 받는다. */
		(async () => {
			const [{ gsap }, { ScrollTrigger }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger'),
			]);
			if (cancelled) return;
			gsap.registerPlugin(ScrollTrigger);

			trigger = ScrollTrigger.create({
				trigger: track,
				/* 마디가 읽는 줄(화면 가운데)에 닿을 때를 기준으로 센다 */
				start: 'top center',
				end: 'bottom center',
				scrub: true,
				onUpdate: (self) => (progress = self.progress),
			});
		})();

		return () => {
			cancelled = true;
			trigger?.kill();
		};
	});
</script>

<div class="not-content" id="roadmap">
	<!-- 지금 몇 주차인지. 스크롤을 따라 올라간다.
	     배경을 깔아야 한다 — 카드가 이 아래를 지나가므로 글자끼리 겹친다. -->
	<p
		class="sticky top-[calc(var(--sl-nav-height))] z-20 m-0 py-3 text-center
			bg-[linear-gradient(to_bottom,var(--sl-color-bg)_65%,transparent)]"
	>
		<span
			class="inline-block rounded-full border border-[var(--sl-color-gray-5)]
				bg-[var(--sl-color-bg)] px-3 py-1 font-mono text-xs tracking-widest
				text-[var(--sl-color-gray-3)]"
		>
			<span class="text-[var(--sl-color-text-accent)]">Week {day}</span> / Week {LAST_WEEK}
		</span>
	</p>

	<div bind:this={track} class="relative mt-6">
		<!-- 남은 자리 -->
		<div
			class="pointer-events-none absolute inset-y-3 left-1/2 w-0.5 -translate-x-1/2
				bg-[var(--sl-color-gray-5)]"
			aria-hidden="true"
		></div>
		<!-- 지나온 자리. 카드가 배경색으로 덮으므로 눈에는 빈칸에만 보인다. -->
		<div
			class="pointer-events-none absolute inset-y-3 left-1/2 w-0.5 origin-top -translate-x-1/2
				bg-[var(--sl-color-text-accent)]"
			style="scale: 1 {progress}"
			aria-hidden="true"
		></div>

		<ol class="m-0 list-none p-0">
			{#each STOPS as stop (stop.part)}
				<li class="relative pb-16 text-center last:pb-0">
					<span
						class="mx-auto block size-3 rounded-full border-2 transition-colors duration-200
							{day >= stop.from
							? 'border-[var(--sl-color-text-accent)] bg-[var(--sl-color-text-accent)]'
							: 'border-[var(--sl-color-gray-4)] bg-[var(--sl-color-bg)]'}"
						aria-hidden="true"
					></span>

					<!-- 배경색을 깔아 선이 글을 관통하지 않게 한다 -->
					<div class="relative z-10 mx-auto max-w-[34rem] bg-[var(--sl-color-bg)] pt-5">
						<p class="m-0 flex items-center justify-center gap-2.5 font-mono text-xs leading-none">
							<span class="tracking-widest text-[var(--sl-color-gray-3)]">{stop.part}</span>
							<span class="text-[var(--sl-color-text-accent)]">{stop.day}</span>
							<!-- 눈금 하나가 모듈 하나다 -->
							<span class="flex gap-[3px]" aria-hidden="true">
								{#each { length: stop.days } as _, i (i)}
									<i class="block h-2 w-0.5 bg-[var(--sl-color-gray-4)]"></i>
								{/each}
							</span>
						</p>

						<h3 class="mt-2.5 mb-0 text-2xl leading-tight">
							<a
								href={stop.href}
								class="text-[var(--sl-color-white)] no-underline
									hover:text-[var(--sl-color-text-accent)] hover:underline hover:underline-offset-4"
							>
								{stop.title}
							</a>
						</h3>
						<p class="mt-2 mb-0 text-pretty text-[var(--sl-color-gray-2)]">{stop.body}</p>
						<p class="mt-3 mb-0 font-mono text-xs text-[var(--sl-color-gray-3)]">
							<span class="mr-2 text-[var(--sl-color-gray-4)]">종료 조건 ·</span>{stop.done}
						</p>
					</div>
				</li>
			{/each}
		</ol>
	</div>

	<!-- 척도 밖 -->
	<div class="mt-12 text-center">
		<span
			class="mx-auto block size-3 rounded-full border-2 border-dashed border-[var(--sl-color-gray-4)]"
			aria-hidden="true"
		></span>
		<div class="mx-auto max-w-[34rem] pt-5">
			<p class="m-0 flex items-center justify-center gap-2.5 font-mono text-xs leading-none">
				<span class="tracking-widest text-[var(--sl-color-gray-3)]">{DETACHED.part}</span>
				<span class="text-[var(--sl-color-text-accent)]">{DETACHED.day}</span>
			</p>
			<h3 class="mt-2.5 mb-0 text-2xl leading-tight">
				<a
					href={DETACHED.href}
					class="text-[var(--sl-color-white)] no-underline
						hover:text-[var(--sl-color-text-accent)] hover:underline hover:underline-offset-4"
				>
					{DETACHED.title}
				</a>
			</h3>
			<p class="mt-2 mb-0 text-pretty text-[var(--sl-color-gray-2)]">{DETACHED.body}</p>
			<p class="mt-3 mb-0 font-mono text-xs text-[var(--sl-color-gray-3)]">
				<span class="mr-2 text-[var(--sl-color-gray-4)]">종료 조건 ·</span>{DETACHED.done}
			</p>
		</div>
	</div>

	<p class="mt-12 text-center font-mono text-xs text-[var(--sl-color-gray-3)]">
		하루 8~10h 기준 — 이론 2h + 실습 6~7h + 회고·정리 1h(고정).
	</p>
</div>
