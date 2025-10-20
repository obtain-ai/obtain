import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NEWS_API_KEY, OPENAI_API_KEY } from '$env/static/private';
import { promises as fs } from 'fs';
import path from 'path';

interface NewsApiArticle {
  title: string;
  url: string;
  source: {
    name: string;
  };
  publishedAt: string;
  description?: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

type CachedWeekData = {
  weekStart: string;    // "October 20"
  weekId: string;       // "2025-W43"
  articles: {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    summary: string;
  }[];
  createdAt: string;    // ISO
};

// ---------- Week helpers ----------
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
function fmtMonthDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// ---------- Cache (file-based) ----------
const CACHE_DIR = path.resolve('.data');
const CACHE_FILE = path.join(CACHE_DIR, 'news-cache.json');

async function readCacheDb(): Promise<Record<string, CachedWeekData>> {
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
async function writeCacheDb(db: Record<string, CachedWeekData>): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch {}
}
async function readWeek(weekId: string): Promise<CachedWeekData | null> {
  const db = await readCacheDb();
  return db[weekId] ?? null;
}
async function writeWeek(weekId: string, data: CachedWeekData): Promise<void> {
  const db = await readCacheDb();
  db[weekId] = data;
  await writeCacheDb(db);
}
async function getLatestCached(): Promise<CachedWeekData | null> {
  const db = await readCacheDb();
  const arr = Object.values(db);
  if (!arr.length) return null;
  arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return arr[0];
}

// ---------- Language + relevance filters ----------
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
    /[\uac00-\ud7af]/, // Hangul
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
  const exclude = ['football','soccer','sports','comic','marvel','dc','movie','film','music','celebrity','gossip','weather'];
  const excludeSources = ['bleeding cool','onefootball','hoover.org','espn','tmz','eonline'];

  const hasAI = ai.some(k => title.includes(k) || description.includes(k));
  const hasEx = exclude.some(k => title.includes(k) || description.includes(k));
  const badSrc = excludeSources.some(s => source.includes(s));

  return hasAI && !hasEx && !badSrc;
}

// ---------- News fetch with soft handling of 429 ----------
async function getNewsArticles(): Promise<NewsApiArticle[]> {
  console.log('🔍 Fetching NewsAPI…');
  const terms = [
    'artificial intelligence AI',
    'machine learning deep learning',
    'chatgpt OpenAI',
    'generative AI large language model',
    'AI automation robotics'
  ];
  let all: NewsApiArticle[] = [];
  for (const term of terms) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(term)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWS_API_KEY}`;
    try {
      const res = await fetch(url);
      console.log(`📡 ${term} -> ${res.status}`);
      if (!res.ok) {
        if (res.status === 429) continue; // rate-limited for this term; try next
        continue;
      }
      const data: NewsApiResponse = await res.json();
      all = all.concat(data.articles || []);
      await new Promise(r => setTimeout(r, 250));
    } catch {
      // ignore and continue
    }
  }
  const unique = all.filter((a, i, s) => i === s.findIndex(x => x.url === a.url));
  return unique
    .filter(isAIRelatedAndEnglish)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10);
}

// ---------- One OpenAI call for all summaries ----------
async function getSummaries(articles: NewsApiArticle[]): Promise<string[]> {
  if (!articles.length) return [];
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  const content = articles.map(a => (a.description || a.title)).join('\n\n');

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

  if (!res.ok) {
    console.log('⚠️ OpenAI summarization failed:', res.status);
    return [];
  }

  const data: OpenAIResponse = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  return raw.split('---').map(s => s.trim()).filter(Boolean);
}

// ---------- GET with weekly cache + fallback ----------
export const GET: RequestHandler = async ({ url }) => {
  console.log('🚀 /api/v1/news');
  console.log('  - NEWS_API_KEY exists:', !!NEWS_API_KEY);
  console.log('  - OPENAI_API_KEY exists:', !!OPENAI_API_KEY);

  const forceRefresh = url.searchParams.get('refresh') === '1';

  const now = new Date();
  const monday = getMondayOfWeek(now);
  const weekId = getISOWeekId(monday);
  const weekStart = fmtMonthDay(monday);

  // 1) serve cached unless refresh requested
  if (!forceRefresh) {
    const cached = await readWeek(weekId);
    if (cached) {
      return json({ articles: cached.articles, weekStart: cached.weekStart, cached: true, weekId: cached.weekId });
    }
  }

  // 2) fetch fresh from NewsAPI (might 429)
  let articles: NewsApiArticle[] = [];
  try {
    articles = await getNewsArticles();
  } catch {}

  // 3) if nothing fetched (likely 429), fallback to latest cached week
  if (articles.length === 0) {
    const latest = await getLatestCached();
    if (latest) {
      return json({
        articles: latest.articles,
        weekStart: latest.weekStart,
        cached: true,
        weekId: latest.weekId,
        notice: 'Served from cached week due to source rate limit.'
      });
    }
    // no cache to serve
    return json({ articles: [], weekStart, cached: false, weekId, notice: 'No data available yet.' });
  }

  // 4) summaries in one call (best-effort)
  let summaries: string[] = [];
  try {
    summaries = await getSummaries(articles);
  } catch {}

  const processed = articles.map((a, i) => ({
    title: a.title,
    url: a.url,
    source: a.source.name,
    publishedAt: a.publishedAt,
    summary: summaries[i] || a.description || ''
  }));

  // 5) write this week to cache
  const payload: CachedWeekData = {
    weekStart,
    weekId,
    articles: processed,
    createdAt: new Date().toISOString()
  };
  try { await writeWeek(weekId, payload); } catch {}

  // 6) serve fresh
  return json({ articles: processed, weekStart, cached: false, weekId });
};
