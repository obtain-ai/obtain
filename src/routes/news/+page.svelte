<script lang="ts">
  import { onMount } from 'svelte';
  import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
  import ThemeToggle from '$lib/ui/ThemeToggle.svelte';
  import Button from '$lib/ui/Button.svelte';
  import type { NewsArticle } from './types';

  let articles: NewsArticle[] = [];
  let weekStart: string = '';
  let loading = false; // Start with false - no automatic loading
  let error = '';

  // This function ONLY runs when manually called (refresh button)
  async function fetchNews() {
    loading = true;
    error = '';
    try {
      const response = await fetch('/api/v1/news');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      console.log('📊 API Response data:', data);
      articles = data.articles || [];
      weekStart = data.weekStart || '';
      console.log('📅 Week start received:', weekStart);
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  }

  // NO onMount - news is truly static until refresh button is pressed
</script>

<svelte:head>
  <title>AI News - ObtAin</title>
</svelte:head>

<div class="min-h-screen bg-zinc-900 text-white dark:bg-zinc-900 dark:text-white transition-colors duration-300">
  <!-- Back Button -->
  <div class="absolute top-4 left-4 z-10">
    <a href="/" class="p-3 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-all duration-200 transform hover:scale-110 border border-zinc-700">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
  </div>

  <!-- Theme Toggle -->
  <div class="absolute top-4 right-4 z-10">
    <ThemeToggle />
  </div>

  <!-- Header -->
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
      AI News
    </h1>
  </div>

  <!-- Your existing InfoDisplay components -->
  <InfoDisplay>
    {#snippet title()}
      Why this Matters:
    {/snippet}
    {#snippet content()}
      Keeping up with AI news is important because new tools and features can make everyday tasks more efficient and help you stay ahead of technological trends.
    {/snippet}
  </InfoDisplay>

  <InfoDisplay>
    {#snippet title()}
      Instructions:
    {/snippet}
    {#snippet content()}
      Latest news on artificial intelligence will be updated weekly here!
    {/snippet}
  </InfoDisplay>

  <!-- Weekly date header - EXACT same styling as InfoDisplay -->
  {#if weekStart && !loading && !error}
    <div class="mx-auto mb-4 flex w-[80%] flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-6 shadow-sm
                dark:border-zinc-700 dark:bg-zinc-800 transition-colors duration-300">
      <span class="flex flex-row items-center gap-2 font-bold text-lg text-white dark:text-white">
        Week of {weekStart}
      </span>
    </div>
  {/if}

  <!-- Refresh Button - EXACT same styling as InfoDisplay -->
  <div class="mx-auto mb-4 flex w-[80%] flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-6 shadow-sm
              dark:border-zinc-700 dark:bg-zinc-800 transition-colors duration-300">
    <Button on:click={fetchNews} variant="primary">
      {loading ? 'Loading...' : 'Load News'}
    </Button>
  </div>

  <!-- News articles section -->
  <div class="container mx-auto px-4 py-8">
    {#if loading}
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-zinc-400 dark:text-zinc-400">Loading latest AI news...</p>
      </div>
    {:else if error}
      <div class="mx-auto mb-4 flex w-[80%] flex-col gap-2 rounded-md border border-red-500 bg-red-900 p-6 shadow-sm
                  dark:bg-red-900 dark:border-red-500 transition-colors duration-300">
        <span class="flex flex-row items-center gap-2 font-bold text-lg text-red-100 dark:text-red-100">
          Error
        </span>
        <p class="text-red-200 dark:text-red-200">Error: {error}</p>
      </div>
    {:else if articles.length === 0}
      <div class="mx-auto mb-4 flex w-[80%] flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-6 shadow-sm
                  dark:border-zinc-700 dark:bg-zinc-800 transition-colors duration-300">
        <span class="flex flex-row items-center gap-2 font-bold text-lg text-white dark:text-white">
          No Articles Loaded
        </span>
        <p class="text-zinc-300 dark:text-zinc-300">
          Click the "Load News" button above to load the latest AI news articles.
        </p>
      </div>
    {:else}
      <div class="space-y-6">
        {#each articles as article (article.url)}
          <!-- EXACT same styling as InfoDisplay components -->
          <div class="mx-auto mb-4 flex w-[80%] flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-200
                      dark:border-zinc-700 dark:bg-zinc-800">
            <h2 class="flex flex-row items-center gap-2 font-bold text-lg text-white dark:text-white">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200
                       dark:text-blue-400 dark:hover:text-blue-300"
              >
                {article.title}
              </a>
            </h2>
            
            {#if article.summary && article.summary !== 'No description available.'}
              <p class="text-zinc-300 dark:text-zinc-300 leading-relaxed">
                {article.summary}
              </p>
            {/if}
            
            <div class="flex items-center justify-between text-sm text-zinc-400 dark:text-zinc-400">
              <span class="font-medium">{article.source}</span>
              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
