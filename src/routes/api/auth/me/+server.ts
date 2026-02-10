import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserFromSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('obtain_session');

	if (!token) {
		return json({ user: null });
	}

	const user = getUserFromSession(token);
	return json({ user });
};
