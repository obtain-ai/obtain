<script lang="ts">
	import '../app.css';
	import { page, navigating } from '$app/stores';
	import { fly } from 'svelte/transition';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { tick, onMount } from 'svelte';
	import BackButton from '$lib/ui/BackButton.svelte';
	import ThemeToggle from '$lib/ui/ThemeToggle.svelte';
	import { theme } from '$lib/stores/themeStore';
	import { auth, isLoggedIn } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';

	let { children } = $props();
	let dropdownOpen = $state(false);
	let dropdownRef: HTMLDivElement | undefined = $state(undefined);

	onMount(() => {
		theme.initialize();
		auth.initialize();

		// Close dropdown when clicking outside
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
				dropdownOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	// Scroll all possible containers to top
	function scrollToTop() {
		window.scrollTo(0, 0);
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	}

	beforeNavigate(() => {
		scrollToTop();
		dropdownOpen = false;
	});

	afterNavigate(async (nav) => {
		if (nav.type !== 'popstate') {
			scrollToTop();
			await tick();
			scrollToTop();
			setTimeout(scrollToTop, 50);
		}
	});

	async function handleLogout() {
		await auth.logout();
		dropdownOpen = false;
		goto('/');
	}

	function toggleDropdown(event: MouseEvent) {
		event.stopPropagation();
		dropdownOpen = !dropdownOpen;
	}
</script>

<!-- overflow-x-hidden clips the fly transition, overflow-y-visible lets body handle vertical scroll -->
<div class="relative min-h-screen overflow-x-hidden bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
	<!-- Top bar controls -->
	<div class="fixed top-4 left-4 right-4 md:left-10 md:right-10 z-50 flex items-start justify-between pointer-events-none">
		<div class="pointer-events-auto">
			{#if $page.url.pathname != '/'}
				<BackButton href="/" />
			{/if}
		</div>
		<div class="pointer-events-auto flex items-center gap-3">
			{#if $isLoggedIn}
				<!-- User Dropdown -->
				<div class="relative" bind:this={dropdownRef}>
					<button
						onclick={toggleDropdown}
						class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-white/80 dark:bg-zinc-700/80 backdrop-blur border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-600 transition-colors shadow-sm cursor-pointer"
					>
						<span class="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
							{$auth?.displayName?.charAt(0).toUpperCase()}
						</span>
						<span>{$auth?.displayName}</span>
						<svg class="w-3.5 h-3.5 transition-transform {dropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if dropdownOpen}
						<div class="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 shadow-xl overflow-hidden" transition:fly={{ y: -8, duration: 150 }}>
							<!-- User info header -->
							<div class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-600">
								<p class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{$auth?.displayName}</p>
								<p class="text-xs text-zinc-500 dark:text-zinc-400">@{$auth?.username}</p>
							</div>

							<div class="py-1">
								<a
									href="/saved"
									onclick={() => dropdownOpen = false}
									class="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
								>
										Saved Sessions
								</a>
								<a
									href="/promptagonist"
									onclick={() => dropdownOpen = false}
									class="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
								>
										Promptagonist
								</a>
								<a
									href="/promptify"
									onclick={() => dropdownOpen = false}
									class="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
								>
										Promptify
								</a>
							</div>

							<div class="border-t border-zinc-100 dark:border-zinc-600 py-1">
								<button
									onclick={handleLogout}
									class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
								>
										Log Out
								</button>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<a
					href="/login"
					class="px-4 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-sm"
				>
					Log In
				</a>
			{/if}
			<ThemeToggle />
		</div>
	</div>

	{#key $page.url.pathname}
		<div in:fly={{ x: 300, duration: 300 }} out:fly={{ x: -300, duration: 300 }} class="relative pt-20 md:pt-24">
			<div class="relative flex items-center justify-center">
				<header class="p-4 md:p-8 text-center">
					<h1 class="title">{$page.data.title ?? 'Default Title'}</h1>
				</header>
			</div>

			{@render children?.()}

			{#if $navigating && $navigating.to?.pathname?.startsWith('/news')}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
					<div class="rounded-lg bg-white/90 dark:bg-zinc-800/90 px-6 py-5 text-center shadow-lg border border-zinc-200 dark:border-zinc-700 transition-none">
						<div
							class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-400 border-b-purple-600"
						></div>
						<p class="text-zinc-800 dark:text-zinc-200 font-medium">Loading AI News…</p>
						<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">This may take a few seconds.</p>
					</div>
				</div>
			{/if}
		</div>
	{/key}
</div>
