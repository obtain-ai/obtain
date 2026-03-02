import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getSavedSessionsByType,
	upsertSavedSession,
	type SessionType
} from '$lib/server/savedSessions';

function isSessionType(value: unknown): value is SessionType {
	return value === 'promptagonist' || value === 'promptify';
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const type = url.searchParams.get('type');
	if (!isSessionType(type)) {
		return json({ error: 'Invalid session type' }, { status: 400 });
	}

	try {
		const sessions = await getSavedSessionsByType(locals.user.username, type);
		return json({ sessions });
	} catch (err) {
		console.error('[sessions] GET failed:', err);
		return json({ error: 'Failed to load sessions' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { type, id, name, payload, savedAt } = body;

		if (!isSessionType(type) || typeof id !== 'string' || typeof name !== 'string' || !savedAt) {
			return json({ error: 'Invalid session payload' }, { status: 400 });
		}

		const parsedDate = new Date(savedAt);
		if (Number.isNaN(parsedDate.getTime())) {
			return json({ error: 'Invalid savedAt value' }, { status: 400 });
		}

		await upsertSavedSession({
			username: locals.user.username,
			type,
			id,
			name,
			payload,
			savedAt: parsedDate.toISOString()
		});

		return json({ success: true });
	} catch (err) {
		console.error('[sessions] PUT failed:', err);
		return json({ error: 'Failed to save session' }, { status: 500 });
	}
};
