import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

interface OpenAIResponse {
  choices: { message: { content: string } }[];
}

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  description: string;
  authority: number;
  eventType: string;
  entities: string[];
  relevanceScore: number;
  summary?: string;
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

// ------- Direct RSS feeds from legitimate news sources -------
const newsRSSFeeds = [
  // Tech News
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', authority: 1.2 },
  { url: 'https://www.wired.com/feed/rss', source: 'Wired', authority: 1.2 },
  { url: 'https://feeds.arstechnica.com/arstechnica/index/', source: 'Ars Technica', authority: 1.2 },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', authority: 1.2 },
  { url: 'https://feeds.feedburner.com/oreilly/radar', source: 'O\'Reilly Radar', authority: 1.2 },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF', source: 'VentureBeat', authority: 1.2 },
  
  // Business News
  { url: 'https://feeds.reuters.com/reuters/technologyNews', source: 'Reuters', authority: 2.0 },
  { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg', authority: 2.0 },
  { url: 'https://feeds.feedburner.com/zdnet', source: 'ZDNet', authority: 1.2 },
  { url: 'https://www.forbes.com/innovation/feed2/', source: 'Forbes', authority: 1.2 },
  
  // AI-Specific
  { url: 'https://www.artificialintelligence-news.com/feed/', source: 'AI News', authority: 1.0 }
];

// ------- Event Type Weights -------
const eventTypeWeights = {
  'policy_safety': 1.0,
  'product_launch': 0.9,
  'funding_major': 0.85,
  'research_sota': 0.85,
  'security_incident': 0.8,
  'lawsuit': 0.8,
  'chip_infra': 0.8,
  'funding_minor': 0.6,
  'opinion': 0.5,
  'unknown': 0.3
};

// ------- Parse RSS Feed -------
async function parseRSSFeed(feedUrl: string, source: string, authority: number): Promise<any[]> {
  try {
    console.log(`📡 Fetching from ${source}: ${feedUrl}`);
    const response = await fetch(feedUrl, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch ${source}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    
    // Simple XML parsing for RSS
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    const articles = items.map(item => {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) || item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      const descriptionMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
      
      return {
        title: titleMatch ? titleMatch[1] : 'No title',
        url: linkMatch ? linkMatch[1] : '#',
        publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
        description: descriptionMatch ? descriptionMatch[1] : 'No description',
        source: source,
        authority: authority
      };
    });
    
    console.log(`✅ ${source}: Found ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error(`❌ Error parsing ${source}:`, error);
    return [];
  }
}

// ------- Detect Event Type -------
function detectEventType(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  // Policy/Safety indicators
  if (text.match(/\b(policy|regulation|law|bill|congress|senate|eu|gdp|safety|alignment|risk)\b/)) {
    return 'policy_safety';
  }
  
  // Product launch indicators
  if (text.match(/\b(launch|release|announce|unveil|introduce|debut|rollout)\b/)) {
    return 'product_launch';
  }
  
  // Funding indicators
  if (text.match(/\b(funding|investment|raise|series|round|million|billion|valuation)\b/)) {
    const hasMajorAmount = text.match(/\b(\d+[bm]|\$[\d.]+[bm])\b/);
    return hasMajorAmount ? 'funding_major' : 'funding_minor';
  }
  
  // Research indicators
  if (text.match(/\b(research|study|paper|arxiv|conference|sota|breakthrough|discovery)\b/)) {
    return 'research_sota';
  }
  
  // Security indicators
  if (text.match(/\b(security|breach|vulnerability|cve|hack|attack|threat)\b/)) {
    return 'security_incident';
  }
  
  // Lawsuit indicators
  if (text.match(/\b(lawsuit|sue|court|legal|settlement|fine|penalty)\b/)) {
    return 'lawsuit';
  }
  
  // Chip/Infrastructure indicators
  if (text.match(/\b(chip|gpu|tpu|infrastructure|data center|server|hardware)\b/)) {
    return 'chip_infra';
  }
  
  return 'unknown';
}

// ------- Extract AI Entities -------
function extractAIEntities(title: string, description: string): string[] {
  const text = (title + ' ' + description).toLowerCase();
  const entities: string[] = [];
  
  // AI Companies
  const companies = ['openai', 'google', 'microsoft', 'meta', 'anthropic', 'cohere', 'hugging face', 'stability ai', 'midjourney', 'nvidia', 'intel', 'amd'];
  companies.forEach(company => {
    if (text.includes(company)) entities.push(company);
  });
  
  // AI Products
  const products = ['chatgpt', 'claude', 'gemini', 'copilot', 'dall-e', 'midjourney', 'stable diffusion', 'gpt-4', 'gpt-3.5'];
  products.forEach(product => {
    if (text.includes(product)) entities.push(product);
  });
  
  // AI Technologies
  const technologies = ['llm', 'transformer', 'neural network', 'machine learning', 'deep learning', 'computer vision', 'nlp'];
  technologies.forEach(tech => {
    if (text.includes(tech)) entities.push(tech);
  });
  
  return entities;
}

// ------- Calculate Relevance Score -------
function calculateRelevanceScore(item: NewsItem): number {
  const weights = {
    authority: 0.30,
    semantic_relevance: 0.25,
    event_type: 0.15,
    recency: 0.15,
    novelty: 0.10,
    source_diversity: 0.05
  };
  
  // Authority score (already calculated)
  const authorityScore = item.authority / 2.0; // Normalize to [0,1]
  
  // Event type score
  const eventTypeScore = eventTypeWeights[item.eventType] || 0.3;
  
  // Recency score (exponential decay with 7-day half-life)
  const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.exp(-ageHours / (7 * 24)); // 7-day half-life
  
  // Semantic relevance (simplified - based on AI entity count)
  const semanticScore = Math.min(item.entities.length / 3, 1.0);
  
  // Novelty (simplified - assume all items are novel for now)
  const noveltyScore = 1.0;
  
  // Source diversity (simplified - assume good diversity)
  const diversityScore = 1.0;
  
  return (
    weights.authority * authorityScore +
    weights.semantic_relevance * semanticScore +
    weights.event_type * eventTypeScore +
    weights.recency * recencyScore +
    weights.novelty * noveltyScore +
    weights.source_diversity * diversityScore
  );
}

// ------- AI Content Filter -------
function isAIRelated(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase();
  
  const aiKeywords = [
    'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
    'chatgpt', 'openai', 'claude', 'gemini', 'automation', 'robotics',
    'neural network', 'algorithm', 'data science', 'computer vision',
    'natural language processing', 'nlp', 'generative ai', 'llm',
    'large language model', 'transformer', 'gpt', 'anthropic'
  ];
  
  return aiKeywords.some(keyword => text.includes(keyword));
}

// ------- Summarize Articles -------
async function summarizeArticles(articles: NewsItem[]): Promise<NewsItem[]> {
  if (!articles.length || !OPENAI_API_KEY) return articles;
  
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  
  const content = articles.map((a, i) => 
    `${i + 1}. Title: ${a.title}\n   Description: ${a.description}\n   Source: ${a.source}\n   Event Type: ${a.eventType}`
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
    
    return articles.map((article, index) => ({
      ...article,
      summary: summaries[index] || article.description
    }));
  } catch (e) {
    console.error('❌ OpenAI summarization failed:', e);
    return articles;
  }
}

// ------- Main News Fetching Function -------
async function fetchAINews(): Promise<NewsItem[]> {
  console.log('🔍 Fetching AI news from direct RSS feeds');
  
  const allArticles: any[] = [];
  
  // Fetch from all RSS feeds
  for (const feed of newsRSSFeeds) {
    try {
      const articles = await parseRSSFeed(feed.url, feed.source, feed.authority);
      allArticles.push(...articles);
    } catch (error) {
      console.error(`Error fetching from ${feed.source}:`, error);
    }
  }
  
  // Remove duplicates based on title
  const uniqueArticles = allArticles.filter((article, index, self) => 
    index === self.findIndex(a => a.title === article.title)
  );
  
  console.log(`📰 Found ${uniqueArticles.length} unique articles`);
  
  // Filter for AI-related content
  const aiArticles = uniqueArticles.filter(article => 
    isAIRelated(article.title, article.description)
  );
  
  console.log(`🤖 Found ${aiArticles.length} AI-related articles`);
  
  // Process each article
  const processedArticles: NewsItem[] = aiArticles.map(article => {
    const eventType = detectEventType(article.title, article.description);
    const entities = extractAIEntities(article.title, article.description);
    
    return {
      ...article,
      eventType,
      entities,
      relevanceScore: 0 // Will be calculated after processing
    };
  });
  
  // Calculate relevance scores
  const scoredArticles = processedArticles.map(article => ({
    ...article,
    relevanceScore: calculateRelevanceScore(article)
  }));
  
  // Sort by relevance score and take top 10
  const sortedArticles = scoredArticles
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);
  
  console.log(`✅ Returning ${sortedArticles.length} top AI articles`);
  return sortedArticles;
}

// ------- in-memory cache (5 min) -------
const INMEM_TTL_MS = 5 * 60 * 1000;
let inmemWeekKey = '';
let inmemTimestamp = 0;
let inmemPayload: { articles: any[]; weekStart: string; isCurrentWeek: boolean } | null = null;

// ------- GET handler -------
export const GET: RequestHandler = async ({ url }) => {
  console.log('🚀 /api/v1/news (Direct RSS Feeds)');
  console.log('  - OPENAI_API_KEY exists:', !!OPENAI_API_KEY);

  const now = new Date();
  const currentWeek = getMondayOfWeek(now);
  const previousWeek = getPreviousWeek(now);
  
  const currentWeekStart = formatMonthDay(currentWeek);
  const previousWeekStart = formatMonthDay(previousWeek);
  
  const currentWeekKey = `${currentWeek.getFullYear()}-${currentWeek.getMonth() + 1}-${currentWeek.getDate()}`;
  const forceRefresh = url.searchParams.get('refresh') === '1';

  // Check cache only if NOT forcing refresh
  if (!forceRefresh && inmemPayload && inmemWeekKey === currentWeekKey && Date.now() - inmemTimestamp < INMEM_TTL_MS) {
    console.log('📦 Returning cached data');
    return json(inmemPayload);
  }

  // Fetch AI news
  console.log('📅 Fetching AI news from RSS feeds');
  let articles = await fetchAINews();
  let weekStart = currentWeekStart;
  let isCurrentWeek = true;

  // If no articles for current week, try previous week
  if (articles.length === 0) {
    console.log('📅 No articles for current week, trying previous week:', previousWeekStart);
    // For now, just use current week data but mark as previous week
    weekStart = previousWeekStart;
    isCurrentWeek = false;
  }

  // Summarize articles
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
  
  // Update cache
  inmemPayload = payload;
  inmemWeekKey = currentWeekKey;
  inmemTimestamp = Date.now();

  return json(payload);
};
