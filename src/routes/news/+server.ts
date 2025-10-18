// TEMP: prove NewsAPI works without summarization
import type { RequestHandler } from './$types';
import { NEWSAPI_KEY } from '$env/static/private';

const EVERYTHING_URL = (k: string) =>
  `https://newsapi.org/v2/everything?q=artificial%20intelligence%20OR%20AI&language=en&sortBy=publishedAt&pageSize=6&apiKey=${k}`;

function safeParse(t: string) { try { return JSON.parse(t); } catch { return null; } }

export const GET: RequestHandler = async () => {
  const res = await fetch(EVERYTHING_URL(NEWSAPI_KEY));
  const text = await res.text();
  const json = safeParse(text);

  if (!res.ok || !json?.articles) {
    return new Response(JSON.stringify({ articles: [], error: `NewsAPI ${res.status}` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const articles = json.articles.slice(0, 6).map((a: any) => ({
    title: a?.title ?? 'Untitled Article',
    url: a?.url ?? '#',
    description: a?.description ?? '',
    summary: a?.description ?? 'Summary unavailable.',
    source: a?.source?.name ?? 'Unknown Source'
  }));

  return new Response(JSON.stringify({ articles }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
