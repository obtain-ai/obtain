<script lang="ts">
  import { onMount } from 'svelte';
  import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
  import type { NewsArticle } from './types';

  let articles: NewsArticle[] = [];
  let weekStart: string = '';
  let loading = true;
  let error = '';

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

<!-- Weekly date header -->
{#if weekStart && !loading && !error}
  <div class="container mx-auto px-4 py-4">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-800 mb-2">
        Week of {weekStart}
      </h2>
      <div class="w-24 h-1 bg-blue-600 mx-auto rounded"></div>
    </div>
  </div>
{/if}

<!-- News articles section -->
<div class="container mx-auto px-4 py-8">
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
      <p>No AI news articles available for this week.</p>
    </div>
  {:else}
    <div class="space-y-6">
      {#each articles as article (article.url)}
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
          <h2 class="text-xl font-bold mb-3 leading-tight">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {article.title}
            </a>
          </h2>
          
          {#if article.summary && article.summary !== 'No description available.'}
            <p class="text-gray-700 leading-relaxed mb-3">
              {article.summary}
            </p>
          {/if}
          
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span class="font-medium">{article.source}</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
