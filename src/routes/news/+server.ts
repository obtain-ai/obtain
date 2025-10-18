import type { RequestHandler } from './$types';
import { NEWSAPI_KEY, TLDR_RAPIDAPI_KEY } from '$env/static/private';

const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=us&category=technology&pageSize=6&q=${encodeURIComponent(
  '(AI OR "artificial intelligence" OR "machine learning")'
)}&apiKey=${NEWSAPI_KEY}`;

const TLDR_API_URL =
  'https://tldrthis.p.rapidapi.com/v1/model/abstractive/summarize-text/';

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const GET: RequestHandler = async () => {
  try {
    // 1) Fetch news
    const newsRes = await fetch(NEWS_API_URL, { redirect: 'follow' });
    const newsText = await newsRes.text();
    const newsData = safeJson(newsText);

    if (!newsRes.ok) {
      const message = (newsData as any)?.message || `News API error (${newsRes.status})`;
      return json({ articles: [], error: message }, newsRes.status);
    }
    if (!newsData || !Array.isArray(newsData.articles)) {
      return json({ articles: [], error: 'Unexpected News API payload' }, 502);
    }

    const raw = (newsData.articles as any[]).slice(0, 6);

    // 2) Summarize (skip when not enough text)
    const articles = await Promise.all(
      raw.map(async (a: any) => {
        const base = {
          title: a?.title ?? 'Untitled Article',
          url: a?.url ?? '#',
          description: a?.description ?? '',
          source: a?.source?.name ?? 'Unknown Source',
          publishedAt: a?.publishedAt ?? null,
          imageUrl: a?.urlToImage ?? null
        };

        const candidate = (base.description || a?.content || '').toString().trim();

        if (!candidate || candidate.length < 40 || !TLDR_RAPIDAPI_KEY) {
          return { ...base, summary: base.description || 'Summary unavailable.' };
        }

        try {
          const sumRes = await fetch(TLDR_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-RapidAPI-Key': TLDR_RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'tldrthis.p.rapidapi.com'
            },
            body: JSON.stringify({
              text: candidate,
              min_length: 40,
              max_length: 140
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

    // newest first just in case
    articles.sort((a: any, b: any) =>
      (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
    );

    return new Response(JSON.stringify({ articles }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60'
      }
    });
  } catch (e: any) {
    return json({ articles: [], error: e?.message || 'Server route failed' }, 500);
  }
};
