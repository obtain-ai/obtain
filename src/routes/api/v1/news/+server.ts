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
  
  // Use multiple AI-related search terms for better results (removed language=en to get global articles)
  const searchTerms = [
    'artificial intelligence AI',
    'machine learning deep learning',
    'chatgpt OpenAI',
    'generative AI tactical language model',
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
    await new Promise(resolve => setTimeout(resolve, 1000));
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

async function translateAndCreateBulletPoints(articles: NewsApiArticle[]): Promise<{titles: string[], bulletPoints: string[]}> {
  console.log('🔍 Starting single OpenAI API call for translation and bullet points...');
  console.log('🔑 OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
  console.log('🔑 OPENAI_API_KEY length:', OPENAI_API_KEY?.length || 0);
  console.log('📝 Number of articles to process:', articles.length);
  
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  
  // Prepare the content for all articles
  const articlesContent = articles.map((article, index) => {
    const textToProcess = article.description || article.title;
    return `Article ${index + 1}:
Title: ${article.title}
Content: ${textToProcess}`;
  }).join('\n\n');
  
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
            content: 'You are a helpful assistant that translates articles to English and creates bullet point summaries. For each article provided: 1) Translate the title to English (if not already in English), and 2) Create 3-4 concise bullet points that capture the main points of the article. If the content is in another language, translate it to English first, then create the bullet points. Avoid reproducing exact text to prevent copyright issues. Return the results in this format for each article: "TITLE: [rewritten English title]" followed by "BULLET POINTS:" and then each bullet point on a new line starting with "- ", separated by "---" between each article.'
          },
          {
            role: 'user',
            content: `Please translate and create bullet points for these ${articles.length} AI news articles:\n\n${articlesContent}`
          }
        ],
        max_tokens: 2000, // Increased token limit for translations and bullet points
        temperature: 0.7
      })
    });
    
    console.log('📡 OpenAI API Response Status:', response.status);
    console.log('📡 OpenAI API Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error Response:', errorText);
      
      // Handle quota errors
      if (response.status === 429) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.code === 'insufficient_quota') {
            console.log('💳 Quota exceeded - returning empty results');
            throw new Error('QUOTA_EXCEEDED');
          }
        } catch (parseError) {
          console.log('⏳ General rate limit - returning empty results');
          throw new Error('RATE_LIMITED');
        }
      }
      
      return {titles: [], bulletPoints: []}; // Return empty arrays if processing fails
    }
    
    const data: OpenAIResponse = await response.json();
    const allContent = data.choices[0]?.message?.content || '';
    console.log('✅ OpenAI API Success - Raw response length:', allContent.length);
    
    // Parse the response to extract titles and bullet points
    const articles = allContent.split('---').map(content => content.trim()).filter(content => content.length > 0);
    
    const titles: string[] = [];
    const bulletPoints: string[] = [];
    
    articles.forEach(articleContent => {
      const titleMatch = articleContent.match(/TITLE:\s*(.+?)(?=\nBULLET POINTS:|$)/s);
      const bulletPointsMatch = articleContent.match(/BULLET POINTS:\s*([\s\S]+?)(?=\n---|$)/s);
      
      if (titleMatch) {
        titles.push(titleMatch[1].trim());
      } else {
        titles.push(''); // Fallback to empty if parsing fails
      }
      
      if (bulletPointsMatch) {
        // Extract individual bullet points
        const bulletText = bulletPointsMatch[1].trim();
        const points = bulletText.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2).trim()) // Remove the "- " prefix
          .filter(line => line.length > 0);
        bulletPoints.push(points.join('\n'));
      } else {
        bulletPoints.push(''); // Fallback to empty if parsing fails
      }
    });
    
    console.log('✅ Successfully parsed titles:', titles.length);
    console.log('✅ Successfully parsed bullet points:', bulletPoints.length);
    
    return {titles, bulletPoints};
    
  } catch (error) {
    console.error('❌ OpenAI API Fetch Error:', error);
    throw error;
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
    
    let titles: string[] = [];
    let bulletPoints: string[] = [];
    let quotaExceeded = false;
    
    // Get translations and bullet points for all articles in one request
    console.log('📝 Step 2: Getting translations and bullet points for all articles...');
    try {
      const result = await translateAndCreateBulletPoints(articles);
      titles = result.titles;
      bulletPoints = result.bulletPoints;
    } catch (error) {
      if (error.message === 'QUOTA_EXCEEDED' || error.message === 'RATE_LIMITED') {
        console.log('💳 Quota/rate limit exceeded - using original titles and descriptions');
        quotaExceeded = true;
      } else {
        console.error('❌ Error getting translations and bullet points:', error);
        quotaExceeded = true;
      }
    }
    
    // Process articles with translated titles and bullet points
    console.log('📝 Step 3: Processing articles with translated content...');
    const processedArticles = articles.map((article, index) => {
      let title = '';
      let summary = '';
      
      if (!quotaExceeded && titles[index] && bulletPoints[index]) {
        title = titles[index];
        summary = bulletPoints[index];
      } else {
        // Fallback to original title and description
        title = article.title;
        summary = article.description || '';
      }
      
      return {
        title: title,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        summary: summary
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
