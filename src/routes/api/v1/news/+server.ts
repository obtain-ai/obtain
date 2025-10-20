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

async function getNewsArticles(): Promise<NewsApiArticle[]> {
  console.log('🔍 Starting News API call...');
  console.log('🔑 NEWS_API_KEY exists:', !!NEWS_API_KEY);
  console.log('🔑 NEWS_API_KEY length:', NEWS_API_KEY?.length || 0);
  
  const newsApiUrl = `https://newsapi.org/v2/everything?q=artificial%20intelligence&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
  console.log('🌐 News API URL:', newsApiUrl.replace(NEWS_API_KEY, 'HIDDEN_KEY'));
  
  try {
    const response = await fetch(newsApiUrl);
    console.log('📡 News API Response Status:', response.status);
    console.log('📡 News API Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ News API Error Response:', errorText);
      throw new Error(`News API error: ${response.status} - ${errorText}`);
    }
    
    const data: NewsApiResponse = await response.json();
    console.log('✅ News API Success - Articles found:', data.articles?.length || 0);
    return data.articles;
  } catch (error) {
    console.error('❌ News API Fetch Error:', error);
    throw error;
  }
}

async function getSummary(text: string, retryCount = 0): Promise<string> {
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
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < 3) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Rate limited. Retrying in ${backoffDelay}ms... (attempt ${retryCount + 1}/3)`);
        await delay(backoffDelay);
        return getSummary(text, retryCount + 1);
      }
      
      return ''; // Return empty string if summarization fails
    }
    
    const data: OpenAIResponse = await response.json();
    const summary = data.choices[0]?.message?.content || '';
    console.log('✅ OpenAI API Success - Summary length:', summary?.length || 0);
    return summary;
  } catch (error) {
    console.error('❌ OpenAI API Fetch Error:', error);
    return ''; // Return empty string if summarization fails
  }
}

export const GET: RequestHandler = async () => {
  console.log('🚀 API Endpoint called: /api/v1/news');
  console.log('🔑 Environment check:');
  console.log('  - NEWS_API_KEY exists:', !!NEWS_API_KEY);
  console.log('  - OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
  
  try {
    // Get news articles from News API
    console.log('📰 Step 1: Fetching news articles...');
    const articles = await getNewsArticles();
    
    // Process articles sequentially with delays to avoid rate limiting
    console.log('📝 Step 2: Processing articles sequentially...');
    const processedArticles = [];
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`📄 Processing article ${i + 1}/${articles.length}: ${article.title.substring(0, 50)}...`);
      
      let summary = '';
      
      // Use description from News API if available, otherwise use title
      const textToSummarize = article.description || article.title;
      
      if (textToSummarize) {
        try {
          summary = await getSummary(textToSummarize);
        } catch (error) {
          console.error(`❌ Error getting summary for article ${i + 1}:`, error);
          // Fallback to original description if summarization fails
          summary = article.description || '';
        }
      }
      
      processedArticles.push({
        title: article.title,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        summary: summary
      });
      
      // Add delay between requests to respect rate limits (except for last article)
      if (i < articles.length - 1) {
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
