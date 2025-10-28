import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const title = ' ';
  
  try {
    // Fetch news articles
    const response = await fetch('/api/v1/news');
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    const data = await response.json();
    
    return { 
      title,
      articles: data.articles || [],
      weekStart: data.weekStart || '',
      isCurrentWeek: data.isCurrentWeek ?? true
    };
  } catch (error) {
    console.error('Error loading news:', error);
    return { 
      title,
      articles: [],
      weekStart: '',
      isCurrentWeek: true
    };
  }
};
