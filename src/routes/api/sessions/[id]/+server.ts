import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSavedSessionById, type SessionType } from '$lib/server/savedSessions';

function isSessionType(value: unknown): value is SessionType {
	return value === 'promptagonist' || value === 'promptify';
}

export const DELETE: RequestHandler = async ({ locals, params, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const type = url.searchParams.get('type');
	if (!isSessionType(type)) {
		return json({ error: 'Invalid session type' }, { status: 400 });
	}

	try {
		await deleteSavedSessionById({
			username: locals.user.username,
			type,
			id: params.id
		});
		return json({ success: true });
	} catch (err) {
		console.error('[sessions] DELETE failed:', err);
		return json({ error: 'Failed to delete session' }, { status: 500 });
	}
};
