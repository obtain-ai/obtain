import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { login } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { username, password } = await request.json();

	const result = login(username, password);

	if (!result.success) {
		return json({ success: false, error: result.error }, { status: 401 });
	}

	cookies.set('obtain_session', result.token!, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // set to true in production with HTTPS
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});

	return json({ success: true, user: result.user });
};
