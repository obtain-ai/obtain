<script lang="ts">
  // Define article type
  type Article = {
    title: string;
    url: string;
    description?: string;
    summary?: string;
    source?: string;
  };

  // Receive articles from +page.ts
  export let data: { articles: Article[] };
  const articles: Article[] = data?.articles ?? [];
</script>

<!-- ✅ Page Title -->
<h1 class="page-title">AI News</h1>

<!-- ✅ "Why this Matters" section -->
<section class="card card--primary">
  <h2 class="bold-heading">Why this Matters</h2>
  <p>
    Keeping up with AI news is important because new tools and features can make everyday
    tasks easier, from organizing your schedule to learning new skills. Staying informed
    helps you take advantage of these updates and use AI safely and effectively in your daily life.
  </p>
</section>

<!-- ✅ Update box -->
<section class="card card--update">
  <p><strong>Latest news on artificial intelligence — updated automatically from trusted sources.</strong></p>
</section>

<!-- ✅ Articles -->
{#if !articles.length}
  <p class="status">No articles available right now.</p>
{:else}
  <div class="articles">
    {#each articles as a}
      <article class="card card--article">
        <a
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          class="article__title"
        >
          {a.title}
        </a>

        {#if a.source}
          <div class="article__meta"><span class="chip">{a.source}</span></div>
        {/if}

        {#if a.description}
          <p class="article__description">{a.description}</p>
        {/if}

        {#if a.summary}
          <p class="article__summary">{a.summary}</p>
        {/if}
      </article>
    {/each}
  </div>
{/if}

<style>
  /* ✅ Page title styling */
  .page-title {
    margin: 2rem 0 1.5rem;
    text-align: center;
    font-size: 2.2rem;
    font-weight: 800;
    color: #fff;
  }

  /* Shared card styles */
  .card {
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    width: 80%;
    max-width: 800px;
    margin: 1rem auto;
    padding: 1rem 1.25rem;
    color: #f3f3f3;
    text-align: left;
    line-height: 1.5;
  }

  /* ✅ Make “Why this Matters” bold */
  .bold-heading {
    font-weight: 800;
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
  }

  .card--update {
    font-weight: 600;
  }

  .status {
    text-align: center;
    color: #ccc;
    margin: 2rem 0;
  }

  .articles {
    margin-top: 1rem;
  }

  .card--article {
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .card--article:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.35);
  }

  .article__title {
    display: inline-block;
    font-weight: 800;
    font-size: 1.125rem;
    color: #fff;
    text-decoration: none;
    margin-bottom: 0.35rem;
  }

  .article__title:hover {
    text-decoration: underline;
  }

  .article__meta {
    margin: 0.1rem 0 0.5rem 0;
  }

  .chip {
    display: inline-block;
    font-size: 0.75rem;
    opacity: 0.9;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
    margin-right: 0.35rem;
  }

  .article__description {
    color: #ddd;
    font-size: 0.95rem;
    margin: 0.25rem 0 0.4rem 0;
  }

  .article__summary {
    color: #ccc;
    font-size: 0.95rem;
    margin: 0.15rem 0 0;
  }

  @media (max-width: 768px) {
    .card {
      width: 90%;
      padding: 0.85rem;
    }
    .page-title {
      font-size: 1.8rem;
    }
  }
</style>
