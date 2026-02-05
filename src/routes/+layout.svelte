<script lang="ts">
	import '../app.css';
	import { page, navigating } from '$app/stores';
	import { fly } from 'svelte/transition';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import BackButton from '$lib/ui/BackButton.svelte';

	let { children } = $props();

	// Scroll all possible containers to top
	function scrollToTop() {
		// Scroll window (most common)
		window.scrollTo(0, 0);
		// Scroll document element (html)
		document.documentElement.scrollTop = 0;
		// Scroll body
		document.body.scrollTop = 0;
	}

	// Reset scroll immediately before navigation starts
	beforeNavigate(() => {
		scrollToTop();
	});

	// Also reset after navigation completes (backup)
	afterNavigate(async (nav) => {
		if (nav.type !== 'popstate') {
			scrollToTop();
			await tick();
			scrollToTop();
			// One more time after transitions might settle
			setTimeout(scrollToTop, 50);
		}
	});
</script>

<!-- overflow-x-hidden clips the fly transition, overflow-y-visible lets body handle vertical scroll -->
<div class="relative min-h-screen overflow-x-hidden bg-zinc-800 text-zinc-200">
	{#key $page.url.pathname}
		<div in:fly={{ x: 300, duration: 300 }} out:fly={{ x: -300, duration: 300 }} class="relative">
			<div class="relative flex items-center justify-center">
				{#if $page.url.pathname != '/'}
					<div class="absolute left-10 top-16">
						<BackButton href="/" />
					</div>
				{/if}
				<header class="p-8 text-center">
					<h1 class="title">{$page.data.title ?? 'Default Title'}</h1>
				</header>
			</div>

			{@render children?.()}

			{#if $navigating && $navigating.to?.pathname?.startsWith('/news')}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
					<div class="rounded-lg bg-zinc-800/90 px-6 py-5 text-center shadow-lg border border-zinc-700">
						<div
							class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-b-purple-600"
						></div>
						<p class="text-zinc-200 font-medium">Loading AI News…</p>
						<p class="text-xs text-zinc-400 mt-1">This may take a few seconds.</p>
					</div>
				</div>
			{/if}
		</div>
	{/key}
</div>
