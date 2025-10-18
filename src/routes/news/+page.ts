
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  try {
    const res = await fetch('/api/news', { headers: { accept: 'application/json' } });
    const text = await res.text();
    const data = JSON.parse(text);
    return { articles: data?.articles ?? [] };
  } catch {
    return { articles: [] };
  }
};
