import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signup } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { username, displayName, password } = await request.json();

	const result = signup(username, displayName, password);

	if (!result.success) {
		return json({ success: false, error: result.error }, { status: 400 });
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
