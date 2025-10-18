import type { PageLoad } from './$types';

export const csr = true;   // allow client to refetch
export const ssr = true;   // works with SSR too
export const prerender = false;

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/news');
  const status = res.status;
  let articles: any[] = [];
  let error: string | null = null;

  try {
    const data = await res.json();
    articles = Array.isArray(data.articles) ? data.articles : [];
    error = data.error ?? (status !== 200 ? `HTTP ${status}` : null);
  } catch {
    error = 'Failed to parse response';
  }

  return { articles, error };
};
