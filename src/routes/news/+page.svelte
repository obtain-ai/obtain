<script lang="ts">
  import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
  export let data: { articles: any[]; error: string | null; title?: string; pageTitle?: string; subtitle?: string };

  const { articles, error } = data;

  // If your layout reads from $page.data.title, it will now show “AI News”.
  // (No extra work needed here.)
</script>

{#snippet title()}
  <span>AI News</span>
{/snippet}

{#snippet content()}
  <div class="flex flex-col gap-6">
    <!-- small subtitle / weekly update notice -->
    {#if data.subtitle}
      <div class="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
        {data.subtitle}
      </div>
    {/if}

    {#if error}
      <div class="rounded-lg border border-red-400/40 bg-red-900/30 p-3 text-red-200 text-center">
        <strong>Couldn’t load news:</strong> {error}
      </div>
    {/if}

    <!-- Why this matters (updated copy) -->
    <div class="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm text-gray-200">
      <p class="text-base leading-relaxed">
        <span class="font-bold">Why this matters:</span>
        Keeping up with AI news is important because new tools and features can make everyday tasks easier,
        from organizing your schedule to learning new skills. Staying informed helps you take advantage of
        these updates and use AI safely and effectively in your daily life.
      </p>
    </div>

    {#if articles.length === 0 && !error}
      <div class="rounded-lg border border-white/10 bg-white/5 p-4 text-gray-300 text-center">
        No articles available right now. Try again shortly.
      </div>
    {/if}

    <!-- News blocks -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each articles as a}
        <article class="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition hover:shadow-md">
          {#if a.imageUrl}
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              <img src={a.imageUrl} alt={a.title} class="h-40 w-full object-cover" />
            </a>
          {/if}

          <div class="p-4">
            <a href={a.url} target="_blank" rel="noopener noreferrer" class="block">
              <h2 class="line-clamp-2 text-base font-semibold text-white group-hover:underline">
                {a.title}
              </h2>
            </a>
            <p class="mt-1 text-xs text-gray-400">
              {a.source}{#if a.publishedAt} • {new Date(a.publishedAt).toLocaleString()}{/if}
            </p>

            <p class="mt-2 line-clamp-4 text-sm text-gray-200">
              {a.summary || a.description || 'Summary unavailable.'}
            </p>

            <div class="mt-3">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-gray-200 hover:bg-white/5"
              >
                Read full article →
              </a>
            </div>
          </div>
        </article>
      {/each}
    </div>
  </div>

  <style>
    .line-clamp-2 {
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .line-clamp-4 {
      display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
    }
  </style>
{/snippet}

<!-- Use your base UI shell -->
<InfoDisplay {title} {content} />
