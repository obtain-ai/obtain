<script lang="ts">
	import { theme } from '$lib/stores/themeStore';
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		theme.initialize();
		mounted = true;
	});

	function handleToggle() {
		theme.toggle();
	}
</script>

{#if mounted}
	<button
		on:click={handleToggle}
		class="group relative flex h-10 w-10 items-center justify-center rounded-full 
			   bg-zinc-200 dark:bg-zinc-700 
			   hover:bg-zinc-300 dark:hover:bg-zinc-600 
			   border border-zinc-300 dark:border-zinc-600
			   transition-all duration-300 ease-out
			   shadow-sm hover:shadow-md"
		aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
	>
		<!-- Sun icon (shown in dark mode) -->
		<svg
			class="absolute h-5 w-5 text-amber-400 transition-all duration-300 ease-out
				   {$theme === 'dark' 
				   	? 'rotate-0 scale-100 opacity-100' 
				   	: 'rotate-90 scale-0 opacity-0'}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>

		<!-- Moon icon (shown in light mode) -->
		<svg
			class="absolute h-5 w-5 text-indigo-600 transition-all duration-300 ease-out
				   {$theme === 'light' 
				   	? 'rotate-0 scale-100 opacity-100' 
				   	: '-rotate-90 scale-0 opacity-0'}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	</button>
{/if}
