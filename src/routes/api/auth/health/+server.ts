import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkAuthDatabase } from '$lib/server/auth';

export const GET: RequestHandler = async () => {
	const result = await checkAuthDatabase();
	if (!result.ok) {
		return json({ ok: false, error: result.error }, { status: 500 });
	}

	return json({ ok: true });
};
