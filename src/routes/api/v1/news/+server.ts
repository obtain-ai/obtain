import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

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

// ------- RSS feeds for reliable AI news sources -------
const rssFeeds = [
  'https://feeds.feedburner.com/oreilly/radar', // O'Reilly Radar
  'https://feeds.feedburner.com/venturebeat/SZYF', // VentureBeat AI
  'https://techcrunch.com/feed/', // TechCrunch
  'https://feeds.feedburner.com/oreilly/radar', // O'Reilly Radar
  'https://www.artificialintelligence-news.com/feed/', // AI News
  'https://feeds.feedburner.com/oreilly/radar', // O'Reilly Radar
];

// ------- Parse RSS feed -------
async function parseRSSFeed(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    const xml = await response.text();
    
    // Simple XML parsing for RSS
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    return items.map(item => {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      const descriptionMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
      
      return {
        title: titleMatch ? titleMatch[1] : 'No title',
        url: linkMatch ? linkMatch[1] : '#',
        publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
        description: descriptionMatch ? descriptionMatch[1] : 'No description',
        source: url.includes('techcrunch') ? 'TechCrunch' : 
                url.includes('venturebeat') ? 'VentureBeat' : 
                url.includes('artificialintelligence') ? 'AI News' : 'RSS Feed'
      };
    });
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
}

// ------- Filter AI-related articles -------
function isAIRelated(article: any): boolean {
  const title = article.title.toLowerCase();
  const description = (article.description || '').toLowerCase();
  
  const aiKeywords = [
    'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
    'chatgpt', 'openai', 'claude', 'gemini', 'automation', 'robotics',
    'neural network', 'algorithm', 'data science', 'computer vision',
    'natural language processing', 'nlp', 'generative ai', 'llm',
    'large language model', 'transformer', 'gpt', 'anthropic'
  ];
  
  return aiKeywords.some(keyword => 
    title.includes(keyword) || description.includes(keyword)
  );
}

// ------- Fetch real AI news from RSS feeds -------
async function fetchRealAINews(targetWeek: Date): Promise<any[]> {
  console.log('🔍 Fetching real AI news from RSS feeds for week:', formatMonthDay(targetWeek));
  
  const allArticles: any[] = [];
  
  // Fetch from all RSS feeds
  for (const feedUrl of rssFeeds) {
    try {
      const articles = await parseRSSFeed(feedUrl);
      allArticles.push(...articles);
    } catch (error) {
      console.error(`Error fetching from ${feedUrl}:`, error);
    }
  }
  
  // Filter AI-related articles
  const aiArticles = allArticles.filter(isAIRelated);
  
  // Sort by date and take latest 10
  const sortedArticles = aiArticles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10);
  
  console.log(`✅ Found ${sortedArticles.length} AI articles from RSS feeds`);
  return sortedArticles;
}

// ------- Summarize articles with OpenAI -------
async function summarizeArticles(articles: any[]): Promise<any[]> {
  if (!articles.length || !OPENAI_API_KEY) return articles;
  
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  
  const content = articles.map((a, i) => 
    `${i + 1}. Title: ${a.title}\n   Description: ${a.description}\n   Source: ${a.source}`
  ).join('\n\n');

  try {
    const res = await fetch(openaiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `You are a news summarizer. For each article, write a concise 2-3 sentence summary that captures the key points and significance. 
            
IMPORTANT RULES:
- Do NOT copy-paste or closely paraphrase the original description
- Focus on the main story, key developments, and why it matters
- Write in your own words
- Keep summaries informative but concise
- Return each summary separated by "---" in the same order as the articles
- Do not include numbers, bullet points, or article titles in summaries` 
          },
          { role: 'user', content: `Summarize these ${articles.length} AI news articles:\n\n${content}` }
        ],
        max_tokens: 1000,
        temperature: 0.8
      })
    });
    
    if (!res.ok) return articles;
    
    const data: OpenAIResponse = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const summaries = raw.split('---').map(s => s.trim()).filter(Boolean);
    
    // Add summaries to articles
    return articles.map((article, index) => ({
      ...article,
      summary: summaries[index] || article.description
    }));
  } catch (e) {
    console.error('❌ OpenAI summarization failed:', e);
    return articles;
  }
}

// ------- in-memory cache (5 min) -------
const INMEM_TTL_MS = 5 * 60 * 1000;
let inmemWeekKey = '';
let inmemTimestamp = 0;
let inmemPayload: { articles: any[]; weekStart: string; isCurrentWeek: boolean } | null = null;

// ------- GET handler with week fallback -------
export const GET: RequestHandler = async ({ url }) => {
  console.log('🚀 /api/v1/news (RSS feeds)');
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

  // Fetch real AI news from RSS feeds
  console.log('📅 Fetching AI news from RSS feeds');
  let articles = await fetchRealAINews(currentWeek);
  let weekStart = currentWeekStart;
  let isCurrentWeek = true;

  // If no articles for current week, try previous week
  if (articles.length === 0) {
    console.log('📅 No articles for current week, trying previous week:', previousWeekStart);
    articles = await fetchRealAINews(previousWeek);
    weekStart = previousWeekStart;
    isCurrentWeek = false;
  }

  // Summarize articles with OpenAI
  if (articles.length > 0) {
    articles = await summarizeArticles(articles);
  }

  const processed = articles.map((a, i) => ({
    title: a.title,
    url: a.url,
    source: a.source,
    publishedAt: a.publishedAt,
    summary: a.summary || a.description || ''
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
