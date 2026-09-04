<script>
	/* 상단바의 로그인 단추.
	 *
	 * 로그인 화면을 따로 띄우지 않는다. 진도 화면이 곧 로그인 화면이라 그리로 보낸다 —
	 * 로그인만 하고 아무것도 못 보는 화면을 만들 이유가 없다.
	 *
	 * 상태를 모르는 동안에는 아무것도 그리지 않는다. "로그인"을 먼저 그렸다가 아이디로
	 * 바꾸면 페이지를 열 때마다 글자가 한 번 튄다.
	 */
	import { onMount } from 'svelte';
	import { sessionId } from '../scripts/sync.js';

	let id = $state(undefined);

	onMount(() => {
		sessionId().then((value) => (id = value));

		const onSession = (event) => (id = event.detail);
		window.addEventListener('skills-guide:session', onSession);
		return () => window.removeEventListener('skills-guide:session', onSession);
	});
</script>

{#if id !== undefined}
	<a class="header-auth" href="/progress/" title={id ? `${id} 으로 로그인함` : '로그인하고 진도 잇기'}>
		{#if id}
			<span class="header-auth__dot" aria-hidden="true"></span>
			<span class="header-auth__id">{id}</span>
		{:else}
			로그인
		{/if}
	</a>
{/if}
