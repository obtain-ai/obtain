export interface NewsArticle {
  title: string;
  originalTitle?: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: {
    title: string;
    url: string;
    source: {
      name: string;
    };
    publishedAt: string;
    description?: string;
  }[];
}
