import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () =>
  new Response(JSON.stringify({ ok: true, route: '/api/hello' }), {
    headers: { 'Content-Type': 'application/json' }
  });
