<script lang="ts">
  import { onMount } from 'svelte';
  import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
  import type { NewsArticle } from './types';

  let articles: NewsArticle[] = [];
  let weekStart: string = '';
  let loading = true;
  let error = '';
  let refreshing = false;

  // Function to get Monday of current week
  function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Function to get the previous week's Monday
  function getPreviousWeekStart(): string {
    const now = new Date();
    const currentWeekStart = getMondayOfWeek(now);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    
    return previousWeekStart.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Function to check if articles are from current week
  function areArticlesCurrentWeek(articles: NewsArticle[], weekStart: string): boolean {
    if (!articles.length || !weekStart) return false;
    
    // Get current date
    const now = new Date();
    const currentWeekStart = getMondayOfWeek(now);
    const currentWeekStartStr = currentWeekStart.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Check if weekStart matches current week
    return weekStart === currentWeekStartStr;
  }

  async function fetchNews(forceRefresh = false) {
    if (forceRefresh) {
      refreshing = true;
    } else {
      loading = true;
    }
    error = '';
    
    try {
      const url = forceRefresh ? '/api/v1/news?refresh=1' : '/api/v1/news';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      articles = data.articles || [];
      weekStart = data.weekStart || '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  function handleRefresh() {
    fetchNews(true);
  }

  onMount(() => {
    fetchNews();
  });
</script>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width at all screen sizes -->
	<div class="w-[80%] mx-auto py-16">
		<!-- Title with gradient -->
		<div class="text-center mb-24">
			<h1 class="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
				PromptPress
			</h1>
			<!-- Tagline -->
			<p class="text-xl text-zinc-300 font-normal">
				Stay informed with AI news
			</p>
		</div>

		<!-- InfoDisplay components -->
		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					Why this Matters:
				{/snippet}
				{#snippet content()}
					Keeping up with AI news is important because new tools and features can make everyday tasks more efficient and help you stay ahead of technological trends.
				{/snippet}
			</InfoDisplay>
		</div>

		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					Instructions:
				{/snippet}
				{#snippet content()}
					Latest news on artificial intelligence will be updated weekly here! Click refresh to get the latest articles.
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- 64% wrapper for week header + refresh + articles -->
		<div class="w-[64%] mx-auto">
			<!-- Refresh Button and Week Header -->
			<div class="flex items-center justify-between mb-8 mt-8">
				{#if weekStart && !loading && !error}
					<h2 class="text-2xl font-bold text-zinc-200">
						{#if areArticlesCurrentWeek(articles, weekStart)}
							Week of {weekStart}
						{:else}
							Last Week's Articles ({getPreviousWeekStart()})
						{/if}
					</h2>
				{:else}
					<div class="text-2xl font-bold text-zinc-200">Loading...</div>
				{/if}
				
				<button 
					on:click={handleRefresh}
					disabled={refreshing || loading}
					class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
				>
					{#if refreshing}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
						Refreshing...
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						Refresh News
					{/if}
				</button>
			</div>

			<!-- Week Message -->
			{#if weekStart && !loading && !error}
				{#if !areArticlesCurrentWeek(articles, weekStart)}
					<div class="text-center mb-6">
						<p class="text-sm text-zinc-400">
							New articles will be available soon!
						</p>
					</div>
				{/if}
			{/if}

			{#if refreshing}
				<div class="text-center mb-6">
					<p class="text-sm text-zinc-400">Fetching latest AI news...</p>
				</div>
			{/if}

			<!-- News articles section -->
			<div class="mb-4">
				{#if loading}
					<div class="text-center">
						<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
						<p class="mt-2 text-zinc-400">Loading latest AI news...</p>
					</div>
				{:else if error}
					<div class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
						<p>Error: {error}</p>
					</div>
				{:else if articles.length === 0}
					<div class="text-center text-zinc-400">
						<p>No news articles available at the moment.</p>
					</div>
				{:else}
					<div class="space-y-6">
						{#each articles as article (article.url)}
							<!-- Individual article boxes -->
							<div class="mb-4 flex flex-col gap-2 rounded-md border border-zinc-600 bg-zinc-700 p-6 shadow-sm hover:shadow-md transition-all duration-200">
								<h2 class="flex flex-row items-center gap-2 font-bold text-lg text-zinc-200">
									<a 
										href={article.url} 
										target="_blank" 
										rel="noopener noreferrer"
										class="text-purple-400 hover:text-purple-300 hover:underline transition-colors duration-200"
									>
										{article.title}
									</a>
								</h2>
								
								{#if article.summary && article.summary !== 'No description available.'}
									<p class="text-zinc-300 leading-relaxed">
										{article.summary}
									</p>
								{/if}
								
								<div class="flex items-center justify-between text-sm text-zinc-400">
									<span class="font-medium">{article.source}</span>
									<span>{new Date(article.publishedAt).toLocaleDateString()}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
