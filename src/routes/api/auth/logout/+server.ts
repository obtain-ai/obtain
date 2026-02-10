import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logout } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('obtain_session');

	if (token) {
		logout(token);
	}

	cookies.delete('obtain_session', { path: '/' });

	return json({ success: true });
};
