import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NEWS_API_KEY, OPENAI_API_KEY } from '$env/static/private';

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

// Function to get Monday of current week
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Add delay function for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to check if article is AI-related
function isAIRelated(article: NewsApiArticle): boolean {
  const title = article.title.toLowerCase();
  const description = (article.description || '').toLowerCase();
  const source = article.source.name.toLowerCase();
  
  // AI-related keywords
  const aiKeywords = [
    'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
    'neural network', 'chatgpt', 'openai', 'claude', 'gemini', 'copilot',
    'automation', 'robotics', 'algorithm', 'data science', 'computer vision',
    'natural language processing', 'nlp', 'generative ai', 'llm', 'large language model',
    'transformer', 'gpt', 'bard', 'anthropic', 'midjourney', 'dall-e', 'stable diffusion',
    'tensorflow', 'pytorch', 'tensor', 'hugging face', 'prompt engineering',
    'agile ai', 'ai safety', 'ai ethics', 'artificial general intelligence', 'agi',
    'superintelligence', 'ai regulation', 'ai governance', 'ai research'
  ];
  
  // Non-AI keywords to exclude
  const excludeKeywords = [
    'football', 'soccer', 'sports', 'comic', 'marvel', 'dc', 'movie', 'film',
    'music', 'celebrity', 'gossip', 'weather', 'politics', 'election',
    'economy', 'stock', 'market', 'crypto', 'bitcoin', 'trading'
  ];
  
  // Check if title or description contains AI keywords
  const hasAIKeywords = aiKeywords.some(keyword => 
    title.includes(keyword) || description.includes(keyword)
  );
  
  // Check if title or description contains exclude keywords
  const hasExcludeKeywords = excludeKeywords.some(keyword => 
    title.includes(keyword) || description.includes(keyword)
  );
  
  // Exclude certain sources that tend to have irrelevant content
  const excludeSources = [
    'bleeding cool', 'onefootball', 'hoover.org', 'espn', 'tmz', 'eonline'
  ];
  
  const hasExcludeSource = excludeSources.some(sourceName => 
    source.includes(sourceName)
  );
  
  return hasAIKeywords && !hasExcludeKeywords && !hasExcludeSource;
}

async function getNewsArticles(): Promise<NewsApiArticle[]> {
  console.log('🔍 Starting News API call with improved AI filtering...');
  console.log('🔑 NEWS_API_KEY exists:', !!NEWS_API_KEY);
  console.log('🔑 NEWS_API_KEY length:', NEWS_API_KEY?.length || 0);
  
  // Use multiple AI-related search terms for better results
  const searchTerms = [
    'artificial intelligence AI',
    'machine learning deep learning',
    'chatgpt OpenAI',
    'generative AI large language model',
    'AI automation robotics'
  ];
  
  let allArticles: NewsApiArticle[] = [];
  
  // Fetch articles with different search terms
  for (const term of searchTerms) {
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(term)}&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;
    console.log(`🌐 News API URL for "${term}":`, newsApiUrl.replace(NEWS_API_KEY, 'HIDDEN_KEY'));
    
    try {
      const response = await fetch(newsApiUrl);
      console.log(`📡 News API Response Status for "${term}":`, response.status);
      
      if (response.ok) {
        const data: NewsApiResponse = await response.json();
        console.log(`✅ Found ${data.articles?.length || 0} articles for "${term}"`);
        allArticles = allArticles.concat(data.articles || []);
      } else {
        console.error(`❌ Error for search term "${term}":`, response.status);
      }
    } catch (error) {
      console.error(`❌ Fetch error for search term "${term}":`, error);
    }
    
    // Add delay between requests
    await delay(1000);
  }
  
  // Remove duplicates based on URL
  const uniqueArticles = allArticles.filter((article, index, self) => 
    index === self.findIndex(a => a.url === article.url)
  );
  
  console.log(`📰 Total unique articles found: ${uniqueArticles.length}`);
  
  // Filter for AI-related articles
  const aiArticles = uniqueArticles.filter(isAIRelated);
  console.log(`🤖 AI-related articles after filtering: ${aiArticles.length}`);
  
  // Sort by date and take the most recent 10
  const sortedArticles = aiArticles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10);
  
  console.log(`✅ Final articles to return: ${sortedArticles.length}`);
  
  return sortedArticles;
}

async function getSummary(text: string): Promise<string> {
  console.log('🔍 Starting OpenAI API call...');
  console.log('🔑 OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
  console.log('🔑 OPENAI_API_KEY length:', OPENAI_API_KEY?.length || 0);
  console.log('📝 Text to summarize length:', text?.length || 0);
  
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  
  try {
    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes news articles. Provide a concise 2-3 sentence summary that captures the main points.'
          },
          {
            role: 'user',
            content: `Please summarize this news article: ${text}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    
    console.log('📡 OpenAI API Response Status:', response.status);
    console.log('📡 OpenAI API Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error Response:', errorText);
      
      // Handle quota errors - don't retry these
      if (response.status === 429) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.code === 'insufficient_quota') {
            console.log('💳 Quota exceeded - skipping summarization');
            throw new Error('QUOTA_EXCEEDED');
          }
        } catch (parseError) {
          // If we can't parse the error, treat it as a general rate limit
          console.log('⏳ General rate limit - skipping summarization');
          throw new Error('RATE_LIMITED');
        }
      }
      
      return ''; // Return empty string if summarization fails
    }
    
    const data: OpenAIResponse = await response.json();
    const summary = data.choices[0]?.message?.content || '';
    console.log('✅ OpenAI API Success - Summary length:', summary?.length || 0);
    return summary;
  } catch (error) {
    console.error('❌ OpenAI API Fetch Error:', error);
    throw error; // Re-throw to be handled by caller
  }
}

export const GET: RequestHandler = async () => {
  console.log('🚀 API Endpoint called: /api/v1/news');
  console.log('🔑 Environment check:');
  console.log('  - NEWS_API_KEY exists:', !!NEWS_API_KEY);
  console.log('  - OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
  
  try {
    // Get news articles from News API with improved filtering
    console.log('📰 Step 1: Fetching news articles with AI filtering...');
    const articles = await getNewsArticles();
    
    // Check if we should skip summarization due to quota issues
    let quotaExceeded = false;
    
    // Process articles sequentially with delays to avoid rate limiting
    console.log('📝 Step 2: Processing articles sequentially...');
    const processedArticles = [];
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`📄 Processing article ${i + 1}/${articles.length}: ${article.title.substring(0, 50)}...`);
      
      let summary = '';
      
      // Use description from News API if available, otherwise use title
      const textToSummarize = article.description || article.title;
      
      if (textToSummarize && !quotaExceeded) {
        try {
          summary = await getSummary(textToSummarize);
        } catch (error) {
          if (error.message === 'QUOTA_EXCEEDED') {
            console.log('💳 Quota exceeded - using original descriptions for remaining articles');
            quotaExceeded = true;
            summary = article.description || '';
          } else if (error.message === 'RATE_LIMITED') {
            console.log('⏳ Rate limited - using original descriptions for remaining articles');
            quotaExceeded = true;
            summary = article.description || '';
          } else {
            console.error(`❌ Error getting summary for article ${i + 1}:`, error);
            // Fallback to original description if summarization fails
            summary = article.description || '';
          }
        }
      } else if (quotaExceeded) {
        // Use original description if quota is exceeded
        summary = article.description || '';
      }
      
      processedArticles.push({
        title: article.title,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        summary: summary
      });
      
      // Add delay between requests to respect rate limits (except for last article)
      if (i < articles.length - 1 && !quotaExceeded) {
        console.log('⏳ Waiting 2 seconds before next request...');
        await delay(2000);
      }
    }
    
    // Get Monday of current week for display
    const monday = getMondayOfWeek(new Date());
    const weekStart = monday.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    
    console.log('📅 Week start calculated:', weekStart);
    console.log('✅ Successfully processed all articles:', processedArticles.length);
    
    // Return both articles AND weekStart
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
