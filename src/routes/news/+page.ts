import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  // Your existing title
  const title = 'AI News';
  
  try {
    // Fetch news articles
    const response = await fetch('/api/v1/news');
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    const articles = await response.json();
    return { 
      title,
      articles 
    };
  } catch (error) {
    console.error('Error loading news:', error);
    return { 
      title,
      articles: [] 
    };
  }
};
