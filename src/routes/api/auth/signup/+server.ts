import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signup } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		console.log('[signup] request body:', JSON.stringify({ username: body.username, displayName: body.displayName, hasPassword: !!body.password }));

		const { username, displayName, password } = body;
		const result = signup(username, displayName, password);

		console.log('[signup] result:', JSON.stringify({ success: result.success, error: result.error }));

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
	} catch (err) {
		console.error('[signup] unexpected error:', err);
		return json({ success: false, error: 'Server error during signup' }, { status: 500 });
	}
};
