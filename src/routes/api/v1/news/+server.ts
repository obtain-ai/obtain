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

// Function to get Monday of current week
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
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

async function getSummary(text: string): Promise<string> {
  console.log('🔍 Starting TLDR API call...');
  console.log('🔑 TLDR_API_KEY exists:', !!TLDR_API_KEY);
  console.log('🔑 TLDR_API_KEY length:', TLDR_API_KEY?.length || 0);
  console.log('📝 Text to summarize length:', text?.length || 0);
  
  const tldrUrl = 'https://tldr-this.p.rapidapi.com/summarize';
  
  try {
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
    
    console.log('📡 TLDR API Response Status:', response.status);
    console.log('📡 TLDR API Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ TLDR API Error Response:', errorText);
      return ''; // Return empty string if summarization fails
    }
    
    const data: TLDRApiResponse = await response.json();
    console.log('✅ TLDR API Success - Summary length:', data.summary?.length || 0);
    return data.summary;
  } catch (error) {
    console.error('❌ TLDR API Fetch Error:', error);
    return ''; // Return empty string if summarization fails
  }
}

export const GET: RequestHandler = async () => {
  console.log('🚀 API Endpoint called: /api/v1/news');
  console.log('🔑 Environment check:');
  console.log('  - NEWS_API_KEY exists:', !!NEWS_API_KEY);
  console.log('  - TLDR_API_KEY exists:', !!TLDR_API_KEY);
  
  try {
    // Get news articles from News API
    console.log('📰 Step 1: Fetching news articles...');
    const articles = await getNewsArticles();
    
    // Process articles and get summaries
