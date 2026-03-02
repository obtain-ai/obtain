<script lang="ts">
	import { auth } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
	import {
		getSavedPromptagonistSessions,
		getSavedPromptifySessions,
		deletePromptagonistSession,
		deletePromptifySession,
		type SavedPromptagonistSession,
		type SavedPromptifySession
	} from '$lib/stores/savedSessionsStore';

	let promptagonistSessions: SavedPromptagonistSession[] = [];
	let promptifySessions: SavedPromptifySession[] = [];
	let activeTab: 'promptagonist' | 'promptify' = 'promptagonist';

	onMount(() => {
		if (!$auth) {
			goto('/login');
			return;
		}
		void loadSessions();
	});

	async function loadSessions() {
		if (!$auth) return;
		promptagonistSessions = await getSavedPromptagonistSessions($auth.username);
		promptifySessions = await getSavedPromptifySessions($auth.username);
	}

	async function handleDeletePromptagonist(sessionId: string) {
		if (confirm('Are you sure you want to delete this adventure?')) {
			await deletePromptagonistSession(sessionId);
			await loadSessions();
		}
	}

	async function handleDeletePromptify(sessionId: string) {
		if (confirm('Are you sure you want to delete this session?')) {
			await deletePromptifySession(sessionId);
			await loadSessions();
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getMessagePreview(messages: { content?: string; text?: string }[]): string {
		const userMessages = messages.filter((m: any) => m.type === 'user' || m.user === 'you');
		if (userMessages.length === 0) return 'No messages yet';
		const first = userMessages[0];
		const text = first.content || first.text || '';
		return text.length > 80 ? text.slice(0, 80) + '…' : text;
	}
</script>

<svelte:head>
	<title>Saved Sessions - ObtAIn</title>
</svelte:head>

<div class="min-h-screen bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 w-full">
	<div class="w-[92%] md:w-[80%] mx-auto py-8 md:py-16">
		<!-- Header -->
		<div class="text-center mb-6 md:mb-8">
			<h1 class="text-3xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent leading-normal pb-1">
				Saved Sessions
			</h1>
			<p class="text-base md:text-lg text-zinc-600 dark:text-zinc-300">
				{#if $auth}
					Welcome back, {$auth.displayName}! Here are your saved sessions.
				{:else}
					Please log in to view your saved sessions.
				{/if}
			</p>
		</div>

		{#if $auth}
			<!-- Tab Switcher -->
			<div class="flex flex-col sm:flex-row justify-center gap-2 mb-6 md:mb-8">
				<button
					class="px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-all duration-200 {activeTab === 'promptagonist'
						? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
						: 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600'}"
					on:click={() => (activeTab = 'promptagonist')}
				>
					Promptagonist Adventures ({promptagonistSessions.length})
				</button>
				<button
					class="px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-all duration-200 {activeTab === 'promptify'
						? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
						: 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600'}"
					on:click={() => (activeTab = 'promptify')}
				>
					Promptify Sessions ({promptifySessions.length})
				</button>
			</div>

			<!-- Promptagonist Sessions -->
			{#if activeTab === 'promptagonist'}
				{#if promptagonistSessions.length === 0}
					<div class="text-center py-16">
						<p class="text-xl font-semibold text-zinc-600 dark:text-zinc-300 mb-2">No saved adventures yet</p>
						<p class="text-zinc-500 dark:text-zinc-400 mb-6">Start a Promptagonist adventure and save it to see it here!</p>
						<a
							href="/promptagonist"
							class="inline-block px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
						>
							Start an Adventure
						</a>
					</div>
				{:else}
					<div class="grid gap-4">
						{#each promptagonistSessions as session (session.id)}
							<div class="bg-white dark:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-600 p-5 shadow-sm hover:shadow-md transition-shadow">
								<div class="flex justify-between items-start">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg text-zinc-800 dark:text-zinc-100 truncate">{session.name}</h3>
										<div class="flex items-center gap-3 mt-1">
											<span class="text-sm text-purple-600 dark:text-purple-400 font-medium">{session.scenarioTitle}</span>
											<span class="text-xs text-zinc-400">•</span>
											<span class="text-xs text-zinc-500 dark:text-zinc-400">{session.scenarioGenre}</span>
										</div>
										<p class="text-sm text-zinc-500 dark:text-zinc-400 mt-2 truncate">{getMessagePreview(session.messages)}</p>
										<p class="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
											{session.messages.length} messages • Saved {formatDate(session.savedAt)}
										</p>
									</div>
									<div class="flex gap-2 ml-4">
										<a
											href="/promptagonist?load={session.id}"
											class="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
										>
											Load
										</a>
										<button
											on:click={() => handleDeletePromptagonist(session.id)}
											class="px-3 py-1.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-colors"
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/if}

			<!-- Promptify Sessions -->
			{#if activeTab === 'promptify'}
				{#if promptifySessions.length === 0}
					<div class="text-center py-16">
						<p class="text-4xl mb-4">✨</p>
						<p class="text-xl font-semibold text-zinc-600 dark:text-zinc-300 mb-2">No saved sessions yet</p>
						<p class="text-zinc-500 dark:text-zinc-400 mb-6">Use Promptify to improve your prompts and save your conversations!</p>
						<a
							href="/promptify"
							class="inline-block px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
						>
							Try Promptify
						</a>
					</div>
				{:else}
					<div class="grid gap-4">
						{#each promptifySessions as session (session.id)}
							<div class="bg-white dark:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-600 p-5 shadow-sm hover:shadow-md transition-shadow">
								<div class="flex justify-between items-start">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg text-zinc-800 dark:text-zinc-100 truncate">{session.name}</h3>
										<p class="text-sm text-zinc-500 dark:text-zinc-400 mt-2 truncate">{getMessagePreview(session.messages)}</p>
										<p class="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
											{session.messages.length} messages • Saved {formatDate(session.savedAt)}
										</p>
									</div>
									<div class="flex gap-2 ml-4">
										<a
											href="/promptify?load={session.id}"
											class="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
										>
											Load
										</a>
										<button
											on:click={() => handleDeletePromptify(session.id)}
											class="px-3 py-1.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-colors"
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		{:else}
			<div class="text-center py-16">
				<p class="text-xl text-zinc-500 dark:text-zinc-400 mb-6">You need to be logged in to view saved sessions.</p>
				<a
					href="/login"
					class="inline-block px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
				>
					Log In
				</a>
			</div>
		{/if}
	</div>
</div>
