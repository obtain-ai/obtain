<script lang="ts">
  import { onMount } from 'svelte';
  import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
  import type { NewsArticle } from './types';

  let articles: NewsArticle[] = [];
  let weekStart: string = '';
  let loading = true;
  let error = '';

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

  onMount(async () => {
    try {
      const response = await fetch('/api/v1/news');
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
    }
  });
</script>

<!-- InfoDisplay components -->
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

<!-- Week of header with more spacing -->
{#if weekStart && !loading && !error}
  <div class="text-center mb-6 mt-8">
    <h2 class="text-2xl font-bold text-white">
      {#if areArticlesCurrentWeek(articles, weekStart)}
        Week of {weekStart}
      {:else}
        Last Week's Articles ({getPreviousWeekStart()})
      {/if}
    </h2>
    {#if !areArticlesCurrentWeek(articles, weekStart)}
      <p class="text-sm text-gray-400 mt-2">
        New articles will be available soon!
      </p>
    {/if}
  </div>
{/if}

<!-- News articles section -->
<div class="mx-auto mb-4 w-[80%]">
  {#if loading}
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Loading latest AI news...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>Error: {error}</p>
    </div>
  {:else if articles.length === 0}
    <div class="text-center text-gray-600">
      <p>No news articles available at the moment.</p>
    </div>
  {:else}
    <div class="space-y-6">
      {#each articles as article (article.url)}
        <!-- Individual article boxes -->
        <div class="mb-4 flex flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h2 class="flex flex-row items-center gap-2 font-bold text-lg text-white">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
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
