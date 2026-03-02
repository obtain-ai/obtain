import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionMaxAgeSeconds, login } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { username, password } = await request.json();

	const result = await login(username, password);

	if (!result.success) {
		return json({ success: false, error: result.error }, { status: 401 });
	}

	cookies.set('obtain_session', result.token!, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: getSessionMaxAgeSeconds()
	});

	return json({ success: true, user: result.user });
};
