import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NEWS_API_KEY, TLDR_API_KEY } from '$env/static/private';

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

interface TLDRApiResponse {
  summary: string;
}

async function getNewsArticles(): Promise<NewsApiArticle[]> {
  const newsApiUrl = `https://newsapi.org/v2/everything?q=artificial%20intelligence&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
  
  const response = await fetch(newsApiUrl);
  if (!response.ok) {
    throw new Error(`News API error: ${response.status}`);
  }
  
  const data: NewsApiResponse = await response.json();
  return data.articles;
}

async function getSummary(text: string): Promise<string> {
  const tldrUrl = 'https://tldr-this.p.rapidapi.com/summarize';
  
  const response = await fetch(tldrUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': TLDR_API_KEY,
      'X-RapidAPI-Host': 'tldr-this.p.rapidapi.com'
    },
    body: JSON.stringify({
      text: text,
      max_sentences: 3
    })
  });
  
  if (!response.ok) {
    console.error(`TLDR API error: ${response.status}`);
    return ''; // Return empty string if summarization fails
  }
  
  const data: TLDRApiResponse = await response.json();
  return data.summary;
}

export const GET: RequestHandler = async () => {
  try {
    // Get news articles from News API
    const articles = await getNewsArticles();
    
    // Process articles and get summaries
    const processedArticles = await Promise.all(
      articles.map(async (article) => {
        let summary = '';
        
        // Use description from News API if available, otherwise use title
        const textToSummarize = article.description || article.title;
        
        if (textToSummarize) {
          try {
            summary = await getSummary(textToSummarize);
          } catch (error) {
            console.error('Error getting summary for article:', article.title, error);
            // Fallback to original description if summarization fails
            summary = article.description || '';
          }
        }
        
        return {
          title: article.title,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          summary: summary
        };
      })
    );
    
    return json(processedArticles);
  } catch (error) {
    console.error('Error fetching news:', error);
    return json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
};

