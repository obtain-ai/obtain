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

// ------- ONLY WHITELISTED NEWS SOURCES -------
const whitelistedNewsSources = {
  // T1: Top wire/major business/official
  'reuters.com': 2.0,
  'ap.org': 2.0,
  'bloomberg.com': 2.0,
  'wsj.com': 2.0,
  'ft.com': 2.0,
  'bbc.com': 2.0,
  'cnn.com': 2.0,
  'nytimes.com': 2.0,
  'washingtonpost.com': 2.0,
  'theguardian.com': 2.0,
  'usatoday.com': 2.0,
  'latimes.com': 2.0,
  'chicagotribune.com': 2.0,
  'bostonglobe.com': 2.0,
  'miamiherald.com': 2.0,
  'dallasnews.com': 2.0,
  'seattletimes.com': 2.0,
  'denverpost.com': 2.0,
  'azcentral.com': 2.0,
  'oregonlive.com': 2.0,
  
  // T2: Reputable tech press/industry news
  'techcrunch.com': 1.2,
  'wired.com': 1.2,
  'arstechnica.com': 1.2,
  'theverge.com': 1.2,
  'engadget.com': 1.2,
  'venturebeat.com': 1.2,
  'zdnet.com': 1.2,
  'computerworld.com': 1.2,
  'infoworld.com': 1.2,
  'networkworld.com': 1.2,
  'forbes.com': 1.2,
  'cnbc.com': 1.2,
  'businessinsider.com': 1.2,
  'axios.com': 1.2,
  'politico.com': 1.2,
  'thehill.com': 1.2,
  'rollcall.com': 1.2,
  'nationalreview.com': 1.2,
  'newyorker.com': 1.2,
  'atlantic.com': 1.2,
  'time.com': 1.2,
  'newsweek.com': 1.2,
  'usnews.com': 1.2,
  'cbsnews.com': 1.2,
  'nbcnews.com': 1.2,
  'abcnews.go.com': 1.2,
  'foxnews.com': 1.2,
  'npr.org': 1.2,
  'pbs.org': 1.2,
  'propublica.org': 1.2,
  'recode.net': 1.2,
  'techmeme.com': 1.2
};

// ------- STRICT BLACKLIST -------
const blacklistedDomains = [
  // Meme/entertainment sites
  'cheezburger.com',
  'cheezburger',
  'memebase.com',
  '9gag.com',
  'imgur.com',
  'reddit.com',
  'reddit',
  
  // Tech forums/aggregators
  'slashdot.org',
  'slashdot',
  'hackernews.com',
  'ycombinator.com',
  'stackoverflow.com',
  'stackoverflow',
  'github.com',
  'github',
  
  // Random/low-quality sites
  'rlsbb.to',
  'rlsbb',
  'thepiratebay.org',
  'kickass.to',
  'torrentz.eu',
  '1337x.to',
  'limetorrents.info',
  'torlock.com',
  'yourbittorrent.com',
  'torrentfunk.com',
  'torrentdownloads.me',
  'torrentz2.eu',
  'torrentgalaxy.to',
  'nyaa.si',
  'rutracker.org',
  'thepiratebay',
  'piratebay',
  'kat',
  'kickass',
  'torrent',
  'bt',
  'magnet',
  
  // Blogs/social media
  'medium.com',
  'dev.to',
  'substack.com',
  'wordpress.com',
  'blogspot.com',
  'tumblr.com',
  'linkedin.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  'snapchat.com',
  'pinterest.com',
  'quora.com',
  'answers.com',
  
  // Search engines/portals
  'yahoo.com',
  'aol.com',
  'msn.com',
  'bing.com',
  'google.com',
  'wikipedia.org',
  'wikimedia.org',
  
  // Archive/cache sites
  'archive.org',
  'waybackmachine.org',
  'cached.com',
  'archive.today',
  'web.archive.org',
  
  // Other low-quality domains
  'universe-today.com',
  'universetoday.com',
  'thedailyguardian.com',
  'dailyguardian.com',
  'guardian.com',
  'guardian',
  'express.com',
  'express',
  'daily.com',
  'daily',
  'today.com',
  'today',
  'now.com',
  'now',
  'wire.com',
  'wire',
  'service.com',
  'service'
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

// ------- Google News RSS feeds for AI topics -------
const aiNewsFeeds = [
  'https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=machine+learning&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=chatgpt&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=openai&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=generative+ai&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=ai+policy&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=ai+safety&hl=en-US&gl=US&ceid=US:en'
];

// ------- Parse Google News RSS -------
async function parseGoogleNewsRSS(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    const xml = await response.text();
    
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    return items.map(item => {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) || item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      const descriptionMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
      
      const sourceMatch = descriptionMatch ? descriptionMatch[1].match(/<font[^>]*>([^<]+)<\/font>/) : null;
      
      return {
        title: titleMatch ? titleMatch[1] : 'No title',
        url: linkMatch ? linkMatch[1] : '#',
        publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
        description: descriptionMatch ? descriptionMatch[1] : 'No description',
        source: sourceMatch ? sourceMatch[1] : 'Google News'
      };
    });
  } catch (error) {
    console.error('Error parsing Google News RSS:', error);
    return [];
  }
}

// ------- Extract Domain from URL -------
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '').toLowerCase();
  } catch {
    return 'unknown';
  }
}

// ------- STRICT SOURCE FILTERING -------
function isWhitelistedNewsSource(url: string): boolean {
  const domain = extractDomain(url);
  
  // Check if it's in our whitelist
  if (whitelistedNewsSources[domain]) {
    return true;
  }
  
  // Check if it's in our blacklist
  if (blacklistedDomains.some(blacklisted => domain.includes(blacklisted))) {
    console.log(`🚫 BLACKLISTED: ${domain}`);
    return false;
  }
  
  // Additional strict checks
  const suspiciousPatterns = [
    /\.(to|tk|ml|ga|cf)$/, // Suspicious TLDs
    /^(rls|torrent|pirate|kickass|1337)/, // Torrent/pirate sites
    /(cheez|meme|funny|joke|lol)/, // Meme sites
    /(forum|board|community|chat)/, // Forums
    /(blog|personal|diary)/, // Personal blogs
    /(aggregator|feed|rss)/, // Aggregators
    /(download|free|crack|keygen)/, // Download sites
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(domain))) {
    console.log(`🚫 SUSPICIOUS PATTERN: ${domain}`);
    return false;
  }
  
  // Only allow if it looks like a legitimate news domain
  const newsIndicators = [
    'news', 'times', 'post', 'journal', 'tribune', 'herald', 'gazette',
    'chronicle', 'observer', 'review', 'press', 'daily', 'weekly',
    'reporter', 'dispatch', 'bulletin', 'register', 'record', 'sun',
    'star', 'globe', 'world', 'today', 'now', 'wire', 'service'
  ];
  
  const hasNewsIndicator = newsIndicators.some(indicator => 
    domain.includes(indicator)
  );
  
  if (!hasNewsIndicator) {
    console.log(`🚫 NO NEWS INDICATOR: ${domain}`);
    return false;
  }
  
  return true;
}

// ------- Calculate Authority Score -------
function calculateAuthority(url: string, source: string): number {
  const domain = extractDomain(url);
  return whitelistedNewsSources[domain] || 0.0;
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

// ------- ULTRA STRICT QUALITY FILTERS -------
function passesQualityFilters(item: any): boolean {
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const text = title + ' ' + description;
  
  // MUST be from whitelisted news source
  if (!isWhitelistedNewsSource(item.url)) {
    console.log(`🚫 REJECTED: ${item.title} from ${extractDomain(item.url)}`);
    return false;
  }
  
  // Language filter (English only)
  if (!/^[a-zA-Z0-9\s\-.,!?;:'"()]+$/.test(item.title)) {
    return false;
  }
  
  // Clickbait detection
  const clickbaitPatterns = [
    /\b(you won't believe|shocking|amazing|incredible|mind-blowing|game-changing)\b/,
    /[!]{2,}/, // Multiple exclamation marks
    /\?{2,}/, // Multiple question marks
    /[A-Z]{5,}/ // Excessive caps
  ];
  
  if (clickbaitPatterns.some(pattern => pattern.test(title))) {
    return false;
  }
  
  // Require at least one AI entity
  const aiKeywords = [
    'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
    'chatgpt', 'openai', 'claude', 'gemini', 'automation', 'robotics',
    'neural network', 'algorithm', 'data science', 'computer vision',
    'natural language processing', 'nlp', 'generative ai', 'llm',
    'large language model', 'transformer', 'gpt', 'anthropic'
  ];
  
  const hasAIKeyword = aiKeywords.some(keyword => text.includes(keyword));
  if (!hasAIKeyword) {
    return false;
  }
  
  // Require some substance (not just opinion)
  if (item.eventType === 'opinion' && item.authority < 1.0) {
    return false;
  }
  
  console.log(`✅ ACCEPTED: ${item.title} from ${extractDomain(item.url)}`);
  return true;
}

// ------- LLM Re-ranker -------
async function llmRerank(articles: NewsItem[]): Promise<NewsItem[]> {
  if (!OPENAI_API_KEY || articles.length === 0) return articles;
  
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  
  const content = articles.map((a, i) => 
    `${i + 1}. Title: ${a.title}\n   Source: ${a.source}\n   Event Type: ${a.eventType}\n   Authority: ${a.authority}\n   Entities: ${a.entities.join(', ')}`
  ).join('\n\n');

  try {
    const res = await fetch(openaiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: `You are a news curator for AI news. Select the 10 most important and relevant AI news articles.

CRITERIA (in order of importance):
1. Verifiable events (dated actions: launches, filings, laws, CVEs, funding)
2. Primary or top-tier secondary sources (authority > 1.0)
3. Concrete events over opinion pieces
4. Actually about AI (models, chips, policy, enterprise deployments)
5. Recent and significant developments

Return JSON array: [{"id": 1, "keep": true, "reason": "Major product launch from OpenAI", "adjustment": 0.2}]` 
          },
          { role: 'user', content: `Select the 10 most important AI news articles:\n\n${content}` }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });
    
    if (!res.ok) return articles;
    
    const data: OpenAIResponse = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    
    try {
      const decisions = JSON.parse(raw);
      const keptArticles = articles.filter((article, index) => {
        const decision = decisions.find(d => d.id === index + 1);
        return decision && decision.keep;
      });
      
      console.log(`✅ LLM selected ${keptArticles.length} articles from ${articles.length}`);
      return keptArticles;
    } catch (parseError) {
      console.error('Failed to parse LLM decisions:', parseError);
      return articles.slice(0, 10); // Fallback to top 10
    }
  } catch (e) {
    console.error('❌ LLM reranking failed:', e);
    return articles.slice(0, 10); // Fallback to top 10
  }
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
async function fetchCuratedAINews(): Promise<NewsItem[]> {
  console.log('🔍 Fetching and curating AI news (ULTRA STRICT FILTERING)');
  
  const allArticles: any[] = [];
  
  // Fetch from all AI-focused Google News feeds
  for (const feedUrl of aiNewsFeeds) {
    try {
      const articles = await parseGoogleNewsRSS(feedUrl);
      allArticles.push(...articles);
    } catch (error) {
      console.error(`Error fetching from ${feedUrl}:`, error);
    }
  }
  
  // Remove duplicates based on title
  const uniqueArticles = allArticles.filter((article, index, self) => 
    index === self.findIndex(a => a.title === article.title)
  );
  
  console.log(`📰 Found ${uniqueArticles.length} unique articles`);
  
  // Process each article
  const processedArticles: NewsItem[] = uniqueArticles.map(article => {
    const authority = calculateAuthority(article.url, article.source);
    const eventType = detectEventType(article.title, article.description);
    const entities = extractAIEntities(article.title, article.description);
    
    return {
      ...article,
      authority,
      eventType,
      entities,
      relevanceScore: 0 // Will be calculated after processing
    };
  });
  
  // Apply ULTRA STRICT quality filters
  const filteredArticles = processedArticles.filter(passesQualityFilters);
  console.log(`✅ ${filteredArticles.length} articles passed ULTRA STRICT quality filters`);
  
  // Calculate relevance scores
  const scoredArticles = filteredArticles.map(article => ({
    ...article,
    relevanceScore: calculateRelevanceScore(article)
  }));
  
  // Sort by relevance score
  const sortedArticles = scoredArticles
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 30); // Top 30 for LLM reranking
  
  console.log(`🎯 Top ${sortedArticles.length} articles by relevance score`);
  
  // LLM reranking
  const finalArticles = await llmRerank(sortedArticles);
  
  return finalArticles.slice(0, 10); // Final top 10
}

// ------- in-memory cache (5 min) -------
const INMEM_TTL_MS = 5 * 60 * 1000;
let inmemWeekKey = '';
let inmemTimestamp = 0;
let inmemPayload: { articles: any[]; weekStart: string; isCurrentWeek: boolean } | null = null;

// ------- GET handler -------
export const GET: RequestHandler = async ({ url }) => {
  console.log('🚀 /api/v1/news (ULTRA STRICT FILTERING)');
  console.log('  - OPENAI_API_KEY exists:', !!OPENAI_API_KEY);

  const now = new Date();
  const currentWeek = getMondayOfWeek(now);
  
  const currentWeekStart = formatMonthDay(currentWeek);
  
  const currentWeekKey = `${currentWeek.getFullYear()}-${currentWeek.getMonth() + 1}-${currentWeek.getDate()}`;
  const forceRefresh = url.searchParams.get('refresh') === '1';

  // Check cache only if NOT forcing refresh
  if (!forceRefresh && inmemPayload && inmemWeekKey === currentWeekKey && Date.now() - inmemTimestamp < INMEM_TTL_MS) {
    console.log('📦 Returning cached data');
    return json(inmemPayload);
  }

  // Fetch curated AI news
  console.log('📅 Fetching curated AI news (ULTRA STRICT)');
  let articles = await fetchCuratedAINews();
  let weekStart = currentWeekStart;
  let isCurrentWeek = true;

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
