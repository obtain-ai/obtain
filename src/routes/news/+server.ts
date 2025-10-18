
import type { RequestHandler } from './$types';
import { NEWSAPI_KEY, TLDR_RAPIDAPI_KEY } from '$env/static/private';

const NEWS_API_URL =
  `https://newsapi.org/v2/top-headlines?country=us&category=technology&q=artificial%20intelligence&apiKey=${NEWSAPI_KEY}`;

const TLDR_API_URL =
  'https://tldrthis.p.rapidapi.com/v1/model/abstractive/summarize-text/';

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export const GET: RequestHandler = async () => {
  try {
    // 1) Fetch news
    const newsRes = await fetch(NEWS_API_URL);
    const newsText = await newsRes.text();
    const newsData = safeJson(newsText);

    if (!newsRes.ok || !newsData || !Array.isArray(newsData.articles)) {
      return new Response(JSON.stringify({
        articles: [],
        error: `News API error (${newsRes.status})`
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const raw = newsData.articles.slice(0, 6);

    // 2) Summarize (tolerate failures; fall back to description)
    const articles = await Promise.all(
      raw.map(async (a: any) => {
        const base = {
          title: a?.title ?? 'Untitled Article',
          url: a?.url ?? '#',
          description: a?.description ?? '',
          source: a?.source?.name ?? 'Unknown Source'
        };

        try {
          const sumRes = await fetch(TLDR_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-RapidAPI-Key': TLDR_RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'tldrthis.p.rapidapi.com'
            },
            body: JSON.stringify({
              text: base.description || a?.content || '',
              min_length: 50,
              max_length: 150
            })
          });

          const sumText = await sumRes.text();
          const sumData = safeJson(sumText);

          const summary =
            sumRes.ok && typeof sumData?.summary === 'string' && sumData.summary.trim()
              ? sumData.summary.trim()
              : (base.description || 'Summary unavailable.');

          return { ...base, summary };
        } catch {
          return { ...base, summary: base.description || 'Summary unavailable.' };
        }
      })
    );

    return new Response(JSON.stringify({ articles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({
      articles: [],
      error: e?.message || 'Server route failed'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};
