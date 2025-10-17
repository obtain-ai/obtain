<script>
  import { onMount } from "svelte";

  // API keys
  const NEWS_API_KEY = "77e8384e7a904f32ad361125e7eca51e";   // from newsapi.org
  const TLDR_API_KEY = "3c76be2327msh1b64fd0333cfa89p12f633jsn0902f3474f62";   // from RapidAPI (tldrthis)

  // API endpoints
  const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=us&category=technology&q=artificial%20intelligence&apiKey=${NEWS_API_KEY}`;
  const TLDR_API_URL = "https://tldrthis.p.rapidapi.com/v1/model/abstractive/summarize-text/";

  let articles = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      // Fetch AI-related news
      const res = await fetch(NEWS_API_URL);
      const data = await res.json();
      if (!data.articles) throw new Error("No articles found.");

      // Summarize each article via TLDR API
      const summarized = await Promise.all(
        data.articles.map(async (article) => {
          try {
            const sumRes = await fetch(TLDR_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": TLDR_API_KEY,
                "X-RapidAPI-Host": "tldrthis.p.rapidapi.com",
              },
              body: JSON.stringify({
                text: article.description || article.content || "",
                min_length: 50,
                max_length: 150,
              }),
            });

            const sumData = await sumRes.json();

            return {
              title: article.title || "Untitled Article",
              url: article.url || "#",
              description: article.description || "",
              summary: sumData.summary || "Summary unavailable.",
              source: article.source?.name || "Unknown Source",
            };
          } catch {
            return {
              title: article.title,
              url: article.url,
              description: article.description || "",
              summary: "Failed to summarize this article.",
              source: article.source?.name || "Unknown Source",
            };
          }
        })
      );

      articles = summarized;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<h1>AI News</h1>

<section class="news-card">
  <h2>Why this Matters</h2>
  <p>
    Keeping up with AI news is important because new tools and features can make everyday
    tasks easier, from organizing your schedule to learning new skills. Staying informed
    helps you take advantage of these updates and use AI safely and effectively in your daily life.
  </p>
</section>

<section class="update-card">
  <p><strong>Latest news on artificial intelligence — updated automatically from trusted sources.</strong></p>
</section>

{#if loading}
  <p class="status">Loading news articles...</p>
{:else if error}
  <p class="status error">{error}</p>
{:else}
  <div class="articles">
    {#each articles as article}
      <article class="article-card">
        <a href={article.url} target="_blank" rel="noopener noreferrer" class="article-title">
          {article.title}
        </a>
        <p class="article-source">{article.source}</p>
        {#if article.description}
          <p class="article-description">{article.description}</p>
        {/if}
        <p class="article-summary">{article.summary}</p>
      </article>
    {/each}
  </div>
{/if}

<style>
  h1 {
    margin: 2rem 0 1.5rem;
    text-align: center;
    font-size: 2rem;
    font-weight: 700;
  }

  /* Shared base style for cards */
  .news-card,
  .update-card,
  .article-card {
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

  .news-card h2 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .update-card {
    font-weight: 600;
  }

  .status {
    text-align: center;
    color: #ccc;
    margin-top: 2rem;
  }

  .error {
    color: #ff7777;
  }

  /* Article cards */
  .article-card {
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .article-card:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.35);
  }

  .article-title {
    font-weight: bold;
    font-size: 1.1rem;
    color: #fff;
    text-decoration: none;
  }

  .article-title:hover {
    text-decoration: underline;
  }

  .article-source {
    font-size: 0.8rem;
    opacity: 0.8;
    margin-bottom: 0.5rem;
  }

  .article-description {
    color: #ddd;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }

  .article-summary {
    color: #ccc;
    font-size: 0.95rem;
    margin-top: 0.3rem;
  }

  @media (max-width: 768px) {
    .news-card,
    .update-card,
    .article-card {
      width: 90%;
      padding: 0.75rem;
    }

    .article-title {
      font-size: 1rem;
    }
  }
</style>
