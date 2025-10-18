import type { RequestHandler } from './$types';

// --- Load environment variables ---
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const TLDR_KEY = process.env.TLDR_RAPIDAPI_KEY;

// --- API URLs ---
const NEWS_URL = `https://newsapi.org/v2/everything?q=artificial%20intelligence&language=en&sortBy=publishedAt&pageSize=6&apiKey=${NEWSAPI_KEY}`;
const TLDR_URL = "https://tldrthis.p.rapidapi.com/v1/model/abstractive/summarize-text/";

export const GET: RequestHandler = async ({ url }) => {
  const debug = url.searchParams.get("debug");

  // --- Validate env keys ---
  if (!NEWSAPI_KEY) {
    return new Response(JSON.stringify({ error: "Missing NEWSAPI_KEY in .env" }), { status: 500 });
  }
  if (!TLDR_KEY) {
    return new Response(JSON.stringify({ error: "Missing TLDR_RAPIDAPI_KEY in .env" }), { status: 500 });
  }

  try {
    // --- Fetch AI-related news from NewsAPI ---
    const newsRes = await fetch(NEWS_URL);
    const newsJson = await newsRes.json();

    if (!newsRes.ok || !newsJson.articles) {
      return new Response(JSON.stringify({
        error: `NewsAPI failed: ${newsJson.message || newsRes.statusText}`,
        raw: newsJson
      }), { status: 500 });
    }

    const topArticles = newsJson.articles.slice(0, 5);

    // --- Summarize each article using TLDR API ---
    const summarized = await Promise.all(
      topArticles.map(async (a: any) => {
        try {
          const res = await fetch(TLDR_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": TLDR_KEY,
              "X-RapidAPI-Host": "tldrthis.p.rapidapi.com",
            },
            body: JSON.stringify({
              text: a.description || a.content || "",
              min_length: 50,
              max_length: 150,
            }),
          });

          const sum = await res.json();

          return {
            title: a.title || "Untitled Article",
            url: a.url || "#",
            description: a.description || "",
            summary: sum.summary || "Summary unavailable.",
            source: a.source?.name || "Unknown Source",
          };
        } catch (err) {
          return {
            title: a.title || "Untitled Article",
            url: a.url || "#",
            description: a.description || "",
            summary: "Failed to summarize this article.",
            source: a.source?.name || "Unknown Source",
          };
        }
      })
    );

    if (debug) {
      return new Response(JSON.stringify({ debug: true, articles: summarized }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ articles: summarized }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), { status: 500 });
  }
};
