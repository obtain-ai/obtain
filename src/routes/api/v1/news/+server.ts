import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NEWS_API_KEY } from '$env/static/private';

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

// Function to get Monday of current week
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Function to summarize titles (shorten to avoid copyright issues)
function summarizeTitle(title: string): string {
  // Remove common prefixes and suffixes
  let cleanTitle = title
    .replace(/^(Breaking|News|Update|Report|Analysis):\s*/i, '')
    .replace(/\s*-\s*(Reuters|AP|AFP|CNN|BBC|Forbes|TechCrunch|The Verge).*$/i, '')
    .replace(/\s*\|.*$/i, '')
    .trim();
  
  // If still too long, truncate at word boundary
  if (cleanTitle.length > 80) {
    cleanTitle = cleanTitle.substring(0, 80);
    const lastSpace = cleanTitle.lastIndexOf(' ');
    if (lastSpace > 50) {
      cleanTitle = cleanTitle.substring(0, lastSpace);
    }
    cleanTitle += '...';
  }
  
  return cleanTitle;
}

// Function to check if article is AI-related
function isAIRelated(article: NewsApiArticle): boolean {
  const aiKeywords = [
    'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
    'neural network', 'chatgpt', 'openai', 'gpt', 'llm', 'large language model',
    'automation', 'robotics', 'computer vision', 'nlp', 'natural language processing',
    'algorithm', 'data science', 'predictive analytics', 'cognitive computing',
    'generative ai', 'transformer', 'bert', 'claude', 'gemini', 'copilot',
    'autonomous', 'intelligent system', 'ai model', 'ai tool', 'ai platform'
  ];
  
  const textToCheck = `${article.title} ${article.description || ''}`.toLowerCase();
  
  return aiKeywords.some(keyword => textToCheck.includes(keyword));
}

async function getNewsArticles(): Promise<NewsApiArticle[]> {
  console.log('🔍 Starting News API call...');
  console.log('🔑 NEWS_API_KEY exists:', !!NEWS_API_KEY);
  
  // Get current week's Monday
  const monday = getMondayOfWeek(new Date());
  const fromDate = monday.toISOString().split('T')[0]; // YYYY-MM-DD format
  const toDate = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Sunday
  
  console.log('📅 Date range:', fromDate, 'to', toDate);
  
  // Enhanced search query for better AI filtering
  const searchQuery = 'artificial intelligence OR "machine learning" OR "deep learning" OR "neural network" OR "AI model" OR "generative AI" OR "ChatGPT" OR "OpenAI"';
  
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&from=${fromDate}&to=${toDate}&sortBy=publishedAt&pageSize=50&apiKey=${NEWS_API_KEY}`;
  console.log('🌐 News API URL:', newsApiUrl.replace(NEWS_API_KEY, 'HIDDEN_KEY'));
  
  try {
    const response = await fetch(newsApiUrl);
    console.log('📡 News API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ News API Error Response:', errorText);
      throw new Error(`News API error: ${response.status} - ${errorText}`);
    }
    
    const data: NewsApiResponse = await response.json();
    console.log('✅ News API Success - Articles found:', data.articles?.length || 0);
    
    // Filter for AI-related articles and limit to 10
    const aiArticles = data.articles
      .filter(isAIRelated)
      .slice(0, 10);
    
    console.log('🤖 AI-related articles after filtering:', aiArticles.length);
    return aiArticles;
  } catch (error) {
    console.error('❌ News API Fetch Error:', error);
    throw error;
  }
}

export const GET: RequestHandler = async () => {
  console.log('🚀 API Endpoint called: /api/v1/news');
  
  try {
    // Get news articles from News API
    console.log('📰 Step 1: Fetching news articles...');
    const articles = await getNewsArticles();
    
    // Process articles with title summarization
    console.log('📝 Step 2: Processing articles...');
    const processedArticles = articles.map((article, index) => {
      console.log(`📄 Processing article ${index + 1}/${articles.length}: ${article.title.substring(0, 50)}...`);
      
      return {
        title: summarizeTitle(article.title),
        originalTitle: article.title, // Keep original for reference
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        summary: article.description || 'No description available.'
      };
    });
    
    // Get Monday of current week for display
    const monday = getMondayOfWeek(new Date());
    const weekStart = monday.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    
    console.log('📅 Week start calculated:', weekStart);
    console.log('✅ Successfully processed all articles:', processedArticles.length);
    
    // Return the data in the correct structure
    return json({
      articles: processedArticles,
      weekStart: weekStart
    });
  } catch (error) {
    console.error('❌ Fatal error in API endpoint:', error);
    return json(
      { error: 'Failed to fetch news', details: error.message },
      { status: 500 }
    );
  }
};
