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

// Function to detect if text is primarily in English
function isEnglish(text: string): boolean {
  // Remove extra whitespace and normalize
  const normalizedText = text.toLowerCase().trim();
  
  // Common English words and patterns
  const englishPatterns = [
    /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|under|over|within|without|against|toward|towards|upon|beyond|beneath|beside|besides|except|excluding|including|regarding|concerning|according|following|preceding|surrounding|including|excluding|excepting)\b/g,
    /\b(is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|could|should|shall|may|might|must|can|cannot|can't|won't|wouldn't|couldn't|shouldn't|shan't|mayn't|mightn't|mustn't)\b/g,
    /\b(this|that|these|those|i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|its|our|their|mine|yours|hers|ours|theirs)\b/g,
    /\b(a|an|some|any|all|both|each|every|either|neither|much|many|little|few|more|most|less|least|other|another|such|same|different|various|several|numerous|countless|plenty|enough|too|very|quite|rather|pretty|fairly|extremely|highly|greatly|significantly|substantially|considerably|slightly|somewhat|barely|hardly|scarcely|almost|nearly|just|only|merely|simply|purely|exactly|precisely|definitely|certainly|surely|probably|possibly|perhaps|maybe|likely|unlikely|certainly|absolutely|completely|totally|entirely|fully|partially|partly|mostly|mainly|primarily|largely|generally|usually|normally|typically|commonly|frequently|often|sometimes|occasionally|rarely|seldom|never|always|ever|already|still|yet|just|soon|recently|lately|earlier|later|before|after|during|while|when|where|why|how|what|who|which|whose|whom)\b/g
  ];
  
  // Non-English character patterns
  const nonEnglishPatterns = [
    /[\u4e00-\u9fff]/, // Chinese characters
    /[\u3040-\u309f]/, // Hiragana
    /[\u30a0-\u30ff]/, // Katakana
    /[\u4e00-\u9faf]/, // CJK Unified Ideographs
    /[\u0400-\u04ff]/, // Cyrillic
    /[\u0590-\u05ff]/, // Hebrew
    /[\u0600-\u06ff]/, // Arabic
    /[\u0900-\u097f]/, // Devanagari
    /[\u0e00-\u0e7f]/, // Thai
    /[\u1100-\u11ff]/, // Hangul Jamo
    /[\uac00-\ud7af]/, // Hangul Syllables
    /[\u3400-\u4dbf]/, // CJK Extension A
    /[\u20000-\u2a6df]/, // CJK Extension B
    /[\u2a700-\u2b73f]/, // CJK Extension C
    /[\u2b740-\u2b81f]/, // CJK Extension D
    /[\u2b820-\u2ceaf]/, // CJK Extension E
    /[\uf900-\ufaff]/, // CJK Compatibility Ideographs
    /[\u3300-\u33ff]/, // CJK Compatibility
    /[\ufe30-\ufe4f]/, // CJK Compatibility Forms
    /[\uf900-\ufaff]/, // CJK Compatibility Ideographs
    /[\u2f800-\u2fa1f]/ // CJK Compatibility Supplement
  ];
  
  // Check for non-English characters first
  for (const pattern of nonEnglishPatterns) {
    if (pattern.test(normalizedText)) {
      return false;
    }
  }
  
  // Count English pattern matches
  let englishMatchCount = 0;
  for (const pattern of englishPatterns) {
    const matches = normalizedText.match(pattern);
    if (matches) {
      englishMatchCount += matches.length;
    }
  }
  
  // If we have a reasonable number of English words, consider it English
  // Adjust threshold based on text length
  const wordCount = normalizedText.split(/\s+/).length;
  const threshold = Math.max(3, Math.floor(wordCount * 0.3)); // At least 30% English words
  
  return englishMatchCount >= threshold;
}

// Function to check if article is AI-related and in English
function isAIRelatedAndEnglish(article: NewsApiArticle): boolean {
  const title = article.title.toLowerCase();
  const description = (article.description || '').toLowerCase();
  const source = article.source.name.toLowerCase();
  
  // First check if content is in English
  if (!isEnglish(article.title) || (article.description && !isEnglish(article.description))) {
    console.log(`🚫 Non-English article filtered out: ${article.title.substring(0, 50)}...`);
    return false;
  }
  
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
  console.log('🔍 Starting News API call with improved AI filtering and English-only filter...');
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
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(term)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWS_API_KEY}`;
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
  
  // Filter for AI-related articles that are in English
  const aiEnglishArticles = uniqueArticles.filter(isAIRelatedAndEnglish);
  console.log(`🤖 AI-related English articles after filtering: ${aiEnglishArticles.length}`);
  
  // Sort by date and take the most recent 10
  const sortedArticles = aiEnglishArticles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10);
  
  console.log(`✅ Final articles to return: ${sortedArticles.length}`);
  
  return sortedArticles;
}

async function getSummaries(articles: NewsApiArticle[]): Promise<{titles: string[], summaries: string[]}> {
  console.log('🔍 Starting single OpenAI API call for all summaries...');
  console.log('🔑 OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
  console.log('🔑 OPENAI_API_KEY length:', OPENAI_API_KEY?.length || 0);
  console.log('📝 Number of articles to summarize:', articles.length);
  
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  
  // Prepare the content for all articles
  const articlesContent = articles.map((article, index) => {
    const textToSummarize = article.description || article.title;
    return `Article ${index + 1}:
Title: ${article.title}
Content: ${textToSummarize}`;
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
            content: 'You are a helpful assistant that creates original summaries and headlines for news articles. For each article provided, create: 1) A paraphrased/rewritten headline that captures the essence but uses different wording, and 2) A concise 2-3 sentence summary of the main points. Avoid reproducing exact text to prevent copyright issues. Return the results in this format for each article: "HEADLINE: [rewritten headline]" followed by "SUMMARY: [summary]" separated by "---" between each article.'
          },
          {
            role: 'user',
            content: `Please create rewritten headlines and summaries for these ${articles.length} AI news articles:\n\n${articlesContent}`
          }
        ],
        max_tokens: 1500, // Increased token limit for both headlines and summaries
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
            console.log('💳 Quota exceeded - returning empty summaries');
            throw new Error('QUOTA_EXCEEDED');
          }
        } catch (parseError) {
          console.log('⏳ General rate limit - returning empty summaries');
          throw new Error('RATE_LIMITED');
        }
      }
      
      return {titles: [], summaries: []}; // Return empty arrays if summarization fails
    }
    
    const data: OpenAIResponse = await response.json();
    const allContent = data.choices[0]?.message?.content || '';
    console.log('✅ OpenAI API Success - Raw response length:', allContent.length);
    
    // Parse the response to extract headlines and summaries
    const articles = allContent.split('---').map(content => content.trim()).filter(content => content.length > 0);
    
    const titles: string[] = [];
    const summaries: string[] = [];
    
    articles.forEach(articleContent => {
      const headlineMatch = articleContent.match(/HEADLINE:\s*(.+?)(?=\nSUMMARY:|$)/s);
      const summaryMatch = articleContent.match(/SUMMARY:\s*(.+?)$/s);
      
      if (headlineMatch) {
        titles.push(headlineMatch[1].trim());
      } else {
        titles.push(''); // Fallback to empty if parsing fails
      }
      
      if (summaryMatch) {
        summaries.push(summaryMatch[1].trim());
      } else {
        summaries.push(''); // Fallback to empty if parsing fails
      }
    });
    
    console.log('✅ Successfully parsed titles:', titles.length);
    console.log('✅ Successfully parsed summaries:', summaries.length);
    
    return {titles, summaries};
    
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
    console.log('📰 Step 1: Fetching news articles with AI filtering and English-only filter...');
    const articles = await getNewsArticles();
    
    let titles: string[] = [];
    let summaries: string[] = [];
    let quotaExceeded = false;
    
    // Get summaries and rewritten headlines for all articles in one request
    console.log('📝 Step 2: Getting rewritten headlines and summaries for all articles...');
    try {
      const result = await getSummaries(articles);
      titles = result.titles;
      summaries = result.summaries;
    } catch (error) {
      if (error.message === 'QUOTA_EXCEEDED' || error.message === 'RATE_LIMITED') {
        console.log('💳 Quota/rate limit exceeded - using original titles and descriptions');
        quotaExceeded = true;
      } else {
        console.error('❌ Error getting summaries:', error);
        quotaExceeded = true;
      }
    }
    
    // Process articles with rewritten headlines and summaries
    console.log('📝 Step 3: Processing articles with rewritten content...');
    const processedArticles = articles.map((article, index) => {
      let title = '';
      let summary = '';
      
      if (!quotaExceeded && titles[index] && summaries[index]) {
        title = titles[index];
        summary = summaries[index];
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
