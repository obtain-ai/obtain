import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NEWS_API_KEY, OPENAI_API_KEY } from '$env/static/private';

interface NewsApiArticle {
  title: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  description?: string;
}
interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}
interface OpenAIResponse {
  choices: { message: { content: string } }[];
}

// ------- week helpers -------
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setHours(0, 0, 0, 0);
  return new Date(d.setDate(diff));
}
function formatMonthDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// ------- language + relevance filters (conservative) -------
function isObviouslyNonEnglish(text: string): boolean {
  const pats = [
    /[\u4e00-\u9fff]/, // Chinese
    /[\u3040-\u309f]/, // Hiragana
    /[\u30a0-\u30ff]/, // Katakana
    /[\u0400-\u04ff]/, // Cyrillic
    /[\u0590-\u05ff]/, // Hebrew
    /[\u0600-\u06ff]/, // Arabic
    /[\u0900-\u097f]/, // Devanagari
    /[\u0e00-\u0e7f]/, // Thai
    /[\u1100-\u11ff]/, // Hangul Jamo
    /[\uac00-\ud7af]/  // Hangul
  ];
  return pats.some(p => p.test(text));
}
function isAIRelatedAndEnglish(article: NewsApiArticle): boolean {
  const title = article.title.toLowerCase();
  const description = (article.description || '').toLowerCase();
  const source = article.source.name.toLowerCase();

  if (isObviouslyNonEnglish(article.title) || (article.description && isObviouslyNonEnglish(article.description))) {
    return false;
  }
  const ai = [
    'artificial intelligence','ai','machine learning','ml','deep learning','neural network',
    'chatgpt','openai','claude','gemini','copilot','automation','robotics','algorithm',
    'data science','computer vision','natural language processing','nlp','generative ai',
    'llm','large language model','transformer','gpt','anthropic','midjourney','dall-e','stable diffusion'
  ];
  const exclude = ['football','soccer','sports','comic','marvel','dc','movie','film','music','celebrity','gossip','weather','politics'];
  const excludeSources = ['bleeding cool','onefootball','hoover.org','espn','tmz','eonline'];

  const hasAI = ai.some(k => title.includes(k) || description.includes(k));
  const hasEx = exclude.some(k => title.includes(k) || description.includes(k));
  const badSrc = excludeSources.some(s => source.includes(s));

  return hasAI && !hasEx && !badSrc;
}

// ------- in-memory cache (5 min) -------
const INMEM_TTL_MS = 5 * 60 * 1000;
let inmemWeekKey = '';
let inmemTimestamp = 0;
let inmemPayload: { articles: any[]; weekStart: string } | null = null;

// ------- single NewsAPI request -------
async function getNewsArticles(): Promise<NewsApiArticle[]> {
  console.log('🔍 Fetching NewsAPI (single consolidated query)…');
  if (!NEWS_API_KEY) return [];

  const q = [
    '"artificial intelligence"',
    '"machine learning"',
    'chatgpt',
    'openai',
    '"large language model"',
    '"generative ai"',
    'robotics'
  ].join(' OR ');

  const monday = getMondayOfWeek(new Date());
  const fromISO = new Date(monday).toISOString();

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', q);
  url.searchParams.set('searchIn', 'title,description');
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('from', fromISO);
  url.searchParams.set('pageSize', '50');

  try {
    const res = await fetch(url.toString(), { headers: { 'X-Api-Key': NEWS_API_KEY } });
    console.log('📡 NewsAPI status:', res.status);
    if (res.status === 429 || !res.ok) return [];

    const data: NewsApiResponse = await res.json();
    const unique = (data.articles || []).filter((a, i, s) => i === s.findIndex(x => x.url === a.url));

    const filtered = unique
      .filter(isAIRelatedAndEnglish)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    console.log(`✅ Returning ${filtered.length} filtered articles`);
    return filtered;
  } catch (e) {
    console.error('❌ NewsAPI fetch failed:', e);
    return [];
  }
}

// ------- one OpenAI call for all summaries -------
async function getSummaries(articles: NewsApiArticle[]): Promise<string[]> {
  if (!articles.length || !OPENAI_API_KEY) return [];
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const content = articles.map(a => (a.description || a.title)).join('\n\n');

  try {
    const res = await fetch(openaiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Summarize each article in 2-3 sentences. Return items separated by --- in the same order.' },
          { role: 'user', content: `Summarize these ${articles.length} AI news articles:\n\n${content}` }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });
    if (!res.ok) return [];
    const data: OpenAIResponse = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    return raw.split('---').map(s => s.trim()).filter(Boolean);
  } catch (e) {
    console.error('❌ OpenAI summarization failed:', e);
    return [];
  }
}

// ------- GET handler -------
export const GET: RequestHandler = async ({ url }) => {
  console.log('🚀 /api/v1/news');
  console.log('  - NEWS_API_KEY exists:', !!NEWS_API_KEY);
  console.log('  - OPENAI_API_KEY exists:', !!OPENAI_API_KEY);

  const monday = getMondayOfWeek(new Date());
  const weekStart = formatMonthDay(monday);
  const weekKey = `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
  const forceRefresh = url.searchParams.get('refresh') === '1';

  if (!forceRefresh && inmemPayload && inmemWeekKey === weekKey && Date.now() - inmemTimestamp < INMEM_TTL_MS) {
    return json(inmemPayload);
  }

  const articles = await getNewsArticles();

  let summaries: string[] = [];
  if (articles.length) {
    summaries = await getSummaries(articles);
  }

  const processed = articles.map((a, i) => ({
    title: a.title,
    url: a.url,
    source: a.source.name,
    publishedAt: a.publishedAt,
    summary: summaries[i] || a.description || ''
  }));

  const payload = { articles: processed, weekStart };
  inmemPayload = payload;
  inmemWeekKey = weekKey;
  inmemTimestamp = Date.now();

  return json(payload);
};
