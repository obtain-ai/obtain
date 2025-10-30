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
  { url: 'https://www.forbes.com/innovation/feed2/', source: 'Forbes', authority: 1.2 }
  
  // REMOVED: { url: 'https://www.artificialintelligence-news.com/feed/', source: 'AI News', authority: 1.0 }
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
    console.log(`Fetching from ${source}: ${feedUrl}`);
    
    // Add timeout and abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(feedUrl, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Failed to fetch ${source}: ${response.status}`);
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
    
    console.log(`${source}: Found ${articles.length} articles`);
    return articles;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Timeout fetching ${source}`);
    } else {
      console.error(`Error parsing ${source}:`, error);
    }
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

// ------- Source Diversity Filter -------
function applySourceDiversity(articles: NewsItem[], maxPerSource: number = 2): NewsItem[] {
  const sourceCount: { [key: string]: number } = {};
  const diversified: NewsItem[] = [];
  
  for (const article of articles) {
    const source = article.source;
    const count = sourceCount[source] || 0;
    
    if (count < maxPerSource) {
      diversified.push(article);
      sourceCount[source] = count + 1;
    }
    
    if (diversified.length >= 10) break;
  }
  
  console.log('Source diversity applied:', sourceCount);
  return diversified;
}

// ------- Summarize Articles -------
async function summarizeArticles(articles: NewsItem[]): Promise<NewsItem[]> {
  if (!articles.length || !OPENAI_API_KEY) return articles;

  const items = articles.map((a, i) => ({
    id: i + 1,
    title: a.title,
    description: decodeEntities(
      (a.description || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').slice(0, 600)
    ),
    source: a.source
  }));

  const systemPrompt = [
    'You are a strict news summarizer.',
    'For EACH article, write a SHORT 2–3 sentence summary in your own words.',
    'Rules:',
    '- Do NOT copy or closely paraphrase the original text.',
    '- Do NOT include the article title, links, HTML, or bullet points.',
    '- Max ~120 words per summary; be concise and factual.',
    '- Focus on the core event, who/what/when/why it matters.',
    'Output ONLY valid JSON array: [{"id": 1, "summary": "..."}, ...] with one object per input id in the same order.'
  ].join('\n');

  const userPrompt = 'Summarize these articles and return JSON array as specified:\n\n' + JSON.stringify(items, null, 2);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 900,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!res.ok) {
      console.error('OpenAI API error:', res.status, res.statusText);
      return fallbackSummaries(articles);
    }

    const data: OpenAIResponse = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';

    // Parse JSON (even if wrapped in text)
    let parsed: Array<{ id: number; summary: string }> | null = null;
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (!parsed || !Array.isArray(parsed)) {
      console.warn('Summarizer returned non-JSON or invalid shape. Using fallback.');
      return fallbackSummaries(articles);
    }

    const idToSummary = new Map<number, string>();
    for (const row of parsed) {
      if (!row || typeof row.id !== 'number' || typeof row.summary !== 'string') continue;
      let s = row.summary.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (s.length > 700) s = s.slice(0, 700) + '…';
      s = decodeEntities(s);
      idToSummary.set(row.id, s);
    }

    return articles.map((article, idx) => {
      const id = idx + 1;
      let s = idToSummary.get(id) || '';

      // Guardrails: never title-as-summary; never long copy-paste; ensure content present
      if (!s || s.length < 20) s = makeExtractiveSummary(article.description || article.title || '');
      if (isTooSimilar(s, article.title)) s = makeExtractiveSummary(article.description || article.title || '');
      if (isCopyLike(s, article.description || '')) s = makeExtractiveSummary(article.description || '');

      return { ...article, summary: s };
    });
  } catch (e) {
    console.error('Summarization call failed:', e);
    return fallbackSummaries(articles);
  }
}

// ------- Helpers for summarization fallbacks -------
function decodeEntities(s: string): string {
  if (!s) return '';
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/');
}

function splitSentences(text: string): string[] {
  const clean = (text || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  return clean.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function makeExtractiveSummary(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return '';
  const pick = sentences.slice(0, 2).join(' ');
  return pick.length > 700 ? pick.slice(0, 700) + '…' : pick;
}

function normalized(s: string): string {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function isTooSimilar(a: string, b: string): boolean {
  const A = normalized(a);
  const B = normalized(b);
  if (!A || !B) return false;
  const shorter = A.length < B.length ? A : B;
  const longer = A.length < B.length ? B : A;
  return longer.includes(shorter) && shorter.length > 10;
}

function isCopyLike(summary: string, description: string): boolean {
  const S = normalized(summary);
  const D = normalized(description);
  if (!S || !D) return false;
  const sTokens = S.split(' ');
  const overlap = sTokens.filter((w) => D.includes(w)).length / sTokens.length;
  return overlap > 0.75 && S.length > 80;
}

function fallbackSummaries(articles: NewsItem[]): NewsItem[] {
  return articles.map((a) => {
    const s = makeExtractiveSummary(a.description || a.title || '');
    return { ...a, summary: s };
  });
}

// ------- Main News Fetching Function with Week Filtering -------
async function fetchAINewsForWindow(weekStartDate: Date, weekEndDate: Date): Promise<NewsItem[]> {
  console.log('Fetching AI news from direct RSS feeds (windowed)');
  
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
  
  console.log(`Found ${uniqueArticles.length} unique articles`);
  
  // Filter for articles within the week window
  const start = new Date(weekStartDate).getTime();
  const end = new Date(weekEndDate).getTime();
  const inWindow = uniqueArticles.filter(a => {
    const t = new Date(a.publishedAt).getTime();
    return !Number.isNaN(t) && t >= start && t < end;
  });
  
  console.log(`In-week items: ${inWindow.length}`);
  
  // Filter for AI-related content
  const aiArticles = inWindow.filter(article => 
    isAIRelated(article.title, article.description)
  );
  
  console.log(`Found ${aiArticles.length} AI-related articles`);
  
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
  
  // Sort by relevance score
  const sortedArticles = scoredArticles
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Apply source diversity
  const diversified = applySourceDiversity(sortedArticles, 2);
  
  console.log(`Returning ${Math.min(diversified.length, 10)} top AI articles`);
  return diversified.slice(0, 10);
}

// ------- in-memory cache (5 min) -------
const INMEM_TTL_MS = 5 * 60 * 1000;
let inmemWeekKey = '';
let inmemTimestamp = 0;
let inmemPayload: { articles: any[]; weekStart: string; isCurrentWeek: boolean } | null = null;

// ------- GET handler -------
export const GET: RequestHandler = async ({ url }) => {
  console.log('/api/v1/news (Direct RSS Feeds)');
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
    console.log('Returning cached data');
    return json(inmemPayload);
  }

  // Build week windows: [monday, next monday)
  const nextMonday = new Date(currentWeek);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const prevNextMonday = new Date(previousWeek);
  prevNextMonday.setDate(prevNextMonday.getDate() + 7);

  // Fetch AI news for current week; if empty, fetch previous week
  console.log('Fetching AI news for current week window');
  let articles = await fetchAINewsForWindow(currentWeek, nextMonday);
  let weekStart = currentWeekStart;
  let isCurrentWeek = true;

  if (articles.length === 0) {
    console.log('No current-week items, trying previous week window');
    articles = await fetchAINewsForWindow(previousWeek, prevNextMonday);
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
