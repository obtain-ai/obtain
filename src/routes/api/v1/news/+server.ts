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
function getPreviousWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const prevWeek = new Date(monday);
  prevWeek.setDate(prevWeek.getDate() - 7);
  return prevWeek;
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

  // First check if content contains obvious non-English characters
  if (isObviouslyNonEnglish(article.title) || (article.description && isObviouslyNonEnglish(article.description))) {
    return false;
  }

  // Exclude non-news sources (package repositories, aggregators, etc.)
  const excludeSources = [
    'bleeding cool', 'onefootball', 'hoover.org', 'espn', 'tmz', 'eonline',
    'pypi.org', 'pypi', 'github.com', 'github', 'npmjs.com', 'npm',
    'crates.io', 'rubygems.org', 'packagist.org', 'nuget.org',
    'biztoc.com', 'biztoc', 'reddit.com', 'reddit', 'hackernews',
    'stackoverflow.com', 'stackoverflow', 'medium.com', 'dev.to',
    'producthunt.com', 'producthunt', 'indiehackers.com'
  ];

  const badSrc = excludeSources.some(s => source.includes(s));
  if (badSrc) {
    console.log(`🚫 Excluded non-news source: ${article.source.name}`);
    return false;
  }

  // Prefer established news sources
  const preferredSources = [
    'reuters', 'ap news', 'associated press', 'bbc', 'cnn', 'nbc', 'abc', 'cbs',
    'the guardian', 'the new york times', 'washington post', 'wall street journal',
    'techcrunch', 'wired', 'ars technica', 'the verge', 'engadget', 'mashable',
    'forbes', 'bloomberg', 'cnbc', 'business insider', 'axios', 'politico',
    'the atlantic', 'new yorker', 'time', 'newsweek', 'usatoday',
    'venturebeat', 'zdnet', 'computerworld', 'infoworld', 'networkworld'
  ];

  const isPreferredSource = preferredSources.some(s => source.includes(s));

  const ai = [
    'artificial intelligence','ai','machine learning','ml','deep learning','neural network',
    'chatgpt','openai','claude','gemini','copilot','automation','robotics','algorithm',
    'data science','computer vision','natural language processing','nlp','generative ai',
    'llm','large language model','transformer','gpt','anthropic','midjourney','dall-e','stable diffusion'
  ];
  const exclude = ['football','soccer','sports','comic','marvel','dc','movie','film','music','celebrity','gossip','weather','politics'];

  const hasAI = ai.some(k => title.includes(k) || description.includes(k));
  const hasEx = exclude.some(k => title.includes(k) || description.includes(k));

  // If it's from a preferred news source and has AI keywords, include it
  if (isPreferredSource && hasAI && !hasEx) {
    return true;
  }

  // For other sources, be more strict - require stronger AI relevance
  if (!isPreferredSource) {
    const strongAIKeywords = ['artificial intelligence', 'ai', 'chatgpt', 'openai', 'machine learning', 'generative ai'];
    const hasStrongAI = strongAIKeywords.some(k => title.includes(k) || description.includes(k));
    return hasStrongAI && !hasEx;
  }

  return hasAI && !hasEx;
}

// ------- in-memory cache (5 min) -------
const INMEM_TTL_MS = 5 * 60 * 1000;
let inmemWeekKey = '';
let inmemTimestamp = 0;
let inmemPayload: { articles: any[]; weekStart: string; isCurrentWeek: boolean } | null = null;

// ------- NewsAPI fetch with week fallback -------
async function getNewsArticles(targetWeek: Date): Promise<NewsApiArticle[]> {
  console.log('🔍 Fetching NewsAPI for week:', formatMonthDay(targetWeek));
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

  const monday = getMondayOfWeek(targetWeek);
  const fromISO = new Date(monday).toISOString();
  const toISO = new Date(new Date(monday).setDate(monday.getDate() + 6)).toISOString();

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', q);
  url.searchParams.set('searchIn', 'title,description');
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('from', fromISO);
  url.searchParams.set('to', toISO);
  url.searchParams.set('pageSize', '50');

  try {
    const res = await fetch(url.toString(), { headers: { 'X-Api-Key': NEWS_API_KEY } });
    console.log('📡 NewsAPI status:', res.status);
    if (res.status === 429 || !res.ok) return [];

    const data: NewsApiResponse = await res.json();
    console.log(`📰 Raw articles from NewsAPI: ${data.articles?.length || 0}`);
    
    const unique = (data.articles || []).filter((a, i, s) => i === s.findIndex(x => x.url === a.url));
    console.log(`📰 After deduplication: ${unique.length}`);

    const filtered = unique
      .filter(isAIRelatedAndEnglish)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    console.log(`✅ Returning ${filtered.length} filtered articles for week ${formatMonthDay(targetWeek)}`);
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
          { role: 'system', content: 'Summarize each article in 2-3 sentences. Return items separated by --- in the same order. Do not include numbers or bullet points in your summaries.' },
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

// ------- GET handler with week fallback -------
export const GET: RequestHandler = async ({ url }) => {
  console.log('🚀 /api/v1/news');
  console.log('  - NEWS_API_KEY exists:', !!NEWS_API_KEY);
  console.log('  - OPENAI_API_KEY exists:', !!OPENAI_API_KEY);

  const now = new Date();
  const currentWeek = getMondayOfWeek(now);
  const previousWeek = getPreviousWeek(now);
  
  const currentWeekStart = formatMonthDay(currentWeek);
  const previousWeekStart = formatMonthDay(previousWeek);
  
  const currentWeekKey = `${currentWeek.getFullYear()}-${currentWeek.getMonth() + 1}-${currentWeek.getDate()}`;
  const forceRefresh = url.searchParams.get('refresh') === '1';

  if (!forceRefresh && inmemPayload && inmemWeekKey === currentWeekKey && Date.now() - inmemTimestamp < INMEM_TTL_MS) {
    return json(inmemPayload);
  }

  // Try current week first
  console.log('📅 Trying current week:', currentWeekStart);
  let articles = await getNewsArticles(currentWeek);
  let weekStart = currentWeekStart;
  let isCurrentWeek = true;

  // If no articles for current week, try previous week
  if (articles.length === 0) {
    console.log('📅 No articles for current week, trying previous week:', previousWeekStart);
    articles = await getNewsArticles(previousWeek);
    weekStart = previousWeekStart;
    isCurrentWeek = false;
  }

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

  const payload = { 
    articles: processed, 
    weekStart: weekStart,
    isCurrentWeek: isCurrentWeek
  };
  
  inmemPayload = payload;
  inmemWeekKey = currentWeekKey;
  inmemTimestamp = Date.now();

  return json(payload);
};
