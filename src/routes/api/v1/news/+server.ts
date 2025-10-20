import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NEWS_API_KEY, OPENAI_API_KEY } from '$env/static/private';
import { promises as fs } from 'fs';
import path from 'path';

/* ------------ Types ------------ */
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
type CachedWeekData = {
  weekStart: string;           // e.g., "October 20"
  weekId: string;              // e.g., "2025-W43"
  articles: {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    summary: string;
  }[];
  createdAt: string;           // ISO timestamp
};

/* ------------ Utils: week + cache ------------ */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setHours(0, 0, 0, 0);
  return new Date(d.setDate(diff));
}
function getISOWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
function formatMonthDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/* Cache on disk: projectRoot/.data/news-cache.json */
const CACHE_DIR = path.resolve('.data');
const CACHE_FILE = path.join(CACHE_DIR, 'news-cache.json');

async function ensureCacheFile(): Promise<Record<string, CachedWeekData>> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    try {
      const txt = await fs.readFile(CACHE_FILE, 'utf8');
      return JSON.parse(txt) as Record<string, CachedWeekData>;
    } catch {
      await fs.writeFile(CACHE_FILE, JSON.stringify({}, null, 2), 'utf8');
      return {};
    }
  } catch {
    return {};
  }
}
async function readWeekFromCache(weekId: string): Promise<CachedWeekData | null> {
  const db = await ensureCacheFile();
  return db[weekId] ?? null;
}
async function writeWeekToCache(weekId: string, data: CachedWeekData): Promise<void> {
  const db = await ensureCacheFile();
  db[weekId] = data;
  await fs.writeFile(CACHE_FILE, JSON.stringify(db, null, 2), 'utf8');
}

/* ------------ Filtering (as you had, simplified) ------------ */
function isAIRelated(article: NewsApiArticle): boolean {
  const title = article.title.toLowerCase();
  const description = (article.description || '').toLowerCase();
  const ai = [
    'artificial intelligence','ai','machine learning','deep learning','neural network',
    'chatgpt','openai','claude','gemini','copilot','nlp','generative ai','llm',
    'large language model','transformer','gpt','anthropic','stable diffusion','midjourney'
  ];
  const exclude = ['football','soccer','sports','comic','marvel','dc','movie','film','music','celebrity','gossip'];
  const hasAI = ai.some(k => title.includes(k) || description.includes(k));
  const hasEx = exclude.some(k => title.includes(k) || description.includes(k));
  return hasAI && !hasEx;
}

/* ------------ News fetch (with soft handling of 429) ------------ */
async function getNewsArticles(): Promise<NewsApiArticle[]> {
  const searchTerms = [
    'artificial intelligence AI',
    'machine learning deep learning',
    'chatgpt OpenAI',
    'generative AI large language model',
    'AI automation robotics'
  ];
  let all: NewsApiArticle[] = [];
  for (const term of searchTerms) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(term)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWS_API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 429) {
          // Rate-limited for this term; try the next term
          continue;
        }
        continue;
      }
      const data: NewsApiResponse = await res.json();
      all = all.concat(data.articles || []);
      // small pause to be gentle
      await new Promise(r => setTimeout(r, 300));
    } catch {
      // ignore and continue
    }
  }
  // de-dupe by URL
  const unique = all.filter((a, i, s) => i === s.findIndex(x => x.url === a.url));
  // filter and keep freshest 10
  return unique.filter(isAIRelated).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 10);
}

/* ------------ One-shot summaries (optional; you can keep your version) ------------ */
async function getSummaries(articles: NewsApiArticle[]): Promise<string[]> {
  if (!articles.length) return [];
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const content = articles.map((a, i) => `Article ${i + 1}: ${(a.description || a.title)}`).join('\n\n');
  const res = await fetch(openaiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Summarize each article in 2-3 sentences. Return items separated by --- in order.' },
        { role: 'user', content }
      ],
      max_tokens: 800,
      temperature: 0.7
    })
  });
  if (!res.ok) return [];
  const data: OpenAIResponse = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  return raw.split('---').map(s => s.trim()).filter(Boolean);
}

/* ------------ GET: Weekly caching + graceful fallback ------------ */
export const GET: RequestHandler = async ({ url }) => {
  const forceRefresh = url.searchParams.get('refresh') === '1';

  // Define current week identity and display label
  const now = new Date();
  const currentMonday = getMondayOfWeek(now);
  const currentWeekId = getISOWeekId(currentMonday);
  const currentWeekLabel = formatMonthDay(currentMonday);

  // 1) Serve from cache unless refresh=1
  if (!forceRefresh) {
    const cached = await readWeekFromCache(currentWeekId);
    if (cached) {
      return json({ articles: cached.articles, weekStart: cached.weekStart, cached: true, weekId: cached.weekId });
    }
  }

  // 2) Try to fetch fresh
  let articles: NewsApiArticle[] = [];
  try {
    articles = await getNewsArticles();
  } catch {
    // ignore; will try fallback
  }

  // If fetched nothing (e.g., rate-limited), fall back to last cached week
  if (articles.length === 0) {
    const db = await ensureCacheFile();
    // Find the latest cached week (by createdAt)
    const entries = Object.values(db) as CachedWeekData[];
    if (entries.length > 0) {
      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = entries[0];
      return json({
        articles: latest.articles,
        weekStart: latest.weekStart,
        cached: true,
        weekId: latest.weekId,
        notice: 'Served from previous cached week due to source rate limit.'
      });
    }
    // No cache at all
    return json({ articles: [], weekStart: currentWeekLabel, cached: false, weekId: currentWeekId, notice: 'No data available yet.' });
  }

  // 3) Summaries (single call)
  let summaries: string[] = [];
  try {
    summaries = await getSummaries(articles);
  } catch {
    summaries = [];
  }

  const processed = articles.map((a, i) => ({
    title: a.title,
    url: a.url,
    source: a.source.name,
    publishedAt: a.publishedAt,
    summary: summaries[i] || a.description || ''
  }));

  // 4) Write to cache for the week
  const payload: CachedWeekData = {
    weekStart: currentWeekLabel,
    weekId: currentWeekId,
    articles: processed,
    createdAt: new Date().toISOString()
  };
  try { await writeWeekToCache(currentWeekId, payload); } catch {}

  // 5) Serve fresh
  return json({ articles: processed, weekStart: currentWeekLabel, cached: false, weekId: currentWeekId });
};
