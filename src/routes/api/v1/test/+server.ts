import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NEWS_API_KEY, TLDR_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async () => {
  return json({
    newsApiKeyExists: !!NEWS_API_KEY,
    newsApiKeyLength: NEWS_API_KEY?.length || 0,
    tldrApiKeyExists: !!TLDR_API_KEY,
    tldrApiKeyLength: TLDR_API_KEY?.length || 0,
    timestamp: new Date().toISOString()
  });
};
