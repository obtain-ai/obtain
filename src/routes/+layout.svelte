<script lang="ts">
  import '../app.css';
  import { page, navigating } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import { fly } from 'svelte/transition';

  let { children } = $props();

  let scroller: HTMLDivElement | null = null;

  afterNavigate((nav) => {
    // Only force scroll-to-top on normal navigations (not back/forward)
    if (nav.type !== 'popstate') {
      scroller?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  });
</script>

<div
  bind:this={scroller}
  class="relative min-h-screen overflow-y-auto bg-zinc-800 text-zinc-200"
>
  {#key $page.url.pathname}
    <div in:fly={{ x: 300, duration: 300 }} out:fly={{ x: -300, duration: 300 }} class="relative">
      <!-- header + content -->
      {@render children?.()}

			{#if $navigating && $navigating.to?.pathname?.startsWith('/news')}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
					<div class="rounded-lg bg-zinc-800/90 px-6 py-5 text-center shadow-lg border border-zinc-700">
						<div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-b-purple-600"></div>
						<p class="text-zinc-200 font-medium">Loading AI News…</p>
						<p class="text-xs text-zinc-400 mt-1">This may take a few seconds.</p>
					</div>
				</div>
			{/if}
		</div>
	{/key}
</div>

