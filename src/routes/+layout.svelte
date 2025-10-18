<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="relative min-h-[100vh] overflow-y-auto bg-zinc-800 text-zinc-200">
	{#key page.url.pathname}
		<div
			in:fly={{ x: 300, duration: 300 }}
			out:fly={{ x: -300, duration: 300 }}
			class="absolute inset-0"
		>
			<div class="relative flex items-center justify-center">
				{#if page.url.pathname != '/'}
					<a class="absolute left-8 text-xl" href="/"> &lt </a>
				{/if}
				<header class="p-8 text-center">
					<h1 class="title">{page.data.title ?? 'Default Title'}</h1>
				</header>
			</div>
			{@render children?.()}
		</div>
	{/key}
</div>
