<script lang="ts">
  export let data: { articles: any[]; error: string | null };

  const { articles, error } = data;
</script>

<!-- Top section: AI News -->
<section class="mx-auto max-w-5xl px-4 py-6">
  <h1 class="text-2xl font-semibold tracking-tight">AI News</h1>
  <p class="mt-1 text-sm text-gray-500">
    Fresh headlines on artificial intelligence from trusted tech outlets.
  </p>

  {#if error}
    <div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
      <strong>Couldn’t load news.</strong> {error}
    </div>
  {/if}
</section>

<!-- “Why this matters” block (bold label as requested) -->
<section class="mx-auto max-w-5xl px-4">
  <div class="rounded-2xl border bg-white p-5 shadow-sm">
    <p class="text-base leading-relaxed">
      <span class="font-bold">Why this matters:</span>
      Staying current on AI helps you spot real trends (not hype), track new
      model capabilities, and understand policy/regulatory shifts that impact product work.
    </p>
  </div>
</section>

<!-- News cards (keep your boxes at the bottom of the page) -->
<section class="mx-auto max-w-5xl px-4 py-6">
  {#if articles.length === 0 && !error}
    <div class="rounded-lg border bg-white p-4 text-gray-600">
      No articles available right now. Try again shortly.
    </div>
  {/if}

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each articles as a}
      <article class="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
        {#if a.imageUrl}
          <a href={a.url} target="_blank" rel="noopener noreferrer">
            <img src={a.imageUrl} alt={a.title} class="h-40 w-full object-cover" />
          </a>
        {/if}

        <div class="p-4">
          <a href={a.url} target="_blank" rel="noopener noreferrer" class="block">
            <h2 class="line-clamp-2 text-base font-semibold group-hover:underline">
              {a.title}
            </h2>
          </a>
          <p class="mt-1 text-xs text-gray-500">
            {a.source}{#if a.publishedAt} • {new Date(a.publishedAt).toLocaleString()}{/if}
          </p>

          <p class="mt-2 line-clamp-4 text-sm text-gray-700">
            {a.summary || a.description || 'Summary unavailable.'}
          </p>

          <div class="mt-3">
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium hover:bg-gray-50"
            >
              Read full article →
            </a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</section>

<style>
  /* if your base UI already has Tailwind, this is minimal */
  .line-clamp-2 {
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .line-clamp-4 {
    display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
  }
</style>
