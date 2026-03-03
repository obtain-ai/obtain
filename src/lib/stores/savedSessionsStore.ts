import { browser } from '$app/environment';

export interface SavedPromptagonistSession {
	id: string;
	username: string;
	scenarioTitle: string;
	scenarioGenre: string;
	messages: {
		id: string;
		type: 'user' | 'ai' | 'system';
		content: string;
		evaluation?: {
			clarity: number;
			specificity: number;
			aiInterpretability: number;
			actionability?: number;
			overallScore: number;
			feedback: string;
		};
		timestamp: string;
	}[];
	savedAt: string;
	name: string;
}

export interface SavedPromptifySession {
	id: string;
	username: string;
	messages: {
		id: string;
		user: 'you' | 'bot';
		text: string;
		status?: 'normal' | 'loading' | 'error';
	}[];
	savedAt: string;
	name: string;
}

type SessionType = 'promptagonist' | 'promptify';
type SessionEnvelope<T> = {
	id: string;
	name: string;
	savedAt: string;
} & T;
const migratedLegacyKeys = new Set<string>();

function getLegacyStorageKey(type: SessionType): string {
	return `obtain_saved_${type}`;
}

async function fetchSavedSessions<T>(type: SessionType): Promise<SessionEnvelope<T>[]> {
	if (!browser) return [];
	try {
		const response = await fetch(`/api/sessions?type=${type}`);
		if (!response.ok) return [];
		const data = await response.json();
		return (data.sessions ?? []).map((session: { id: string; name: string; payload: T; savedAt: string }) => ({
			id: session.id,
			name: session.name,
			savedAt: session.savedAt,
			...session.payload
		}));
	} catch (err) {
		console.error(`[savedSessionsStore] Failed to fetch ${type} sessions:`, err);
		return [];
	}
}

async function saveSession(
	type: SessionType,
	session: SavedPromptagonistSession | SavedPromptifySession
): Promise<boolean> {
	if (!browser) return false;
	try {
		const response = await fetch('/api/sessions', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type,
				id: session.id,
				name: session.name,
				savedAt: session.savedAt,
				payload: type === 'promptagonist'
					? {
							scenarioTitle: (session as SavedPromptagonistSession).scenarioTitle,
							scenarioGenre: (session as SavedPromptagonistSession).scenarioGenre,
							messages: session.messages
						}
					: {
							messages: session.messages
						}
			})
		});
		return response.ok;
	} catch (err) {
		console.error(`[savedSessionsStore] Failed to save ${type} session:`, err);
		return false;
	}
}

async function deleteSession(type: SessionType, sessionId: string): Promise<void> {
	if (!browser) return;
	try {
		await fetch(`/api/sessions/${encodeURIComponent(sessionId)}?type=${type}`, {
			method: 'DELETE'
		});
	} catch (err) {
		console.error(`[savedSessionsStore] Failed to delete ${type} session:`, err);
	}
}

async function migrateLegacySessions(type: SessionType, username: string): Promise<void> {
	if (!browser) return;

	const migrationKey = `${type}:${username}`;
	if (migratedLegacyKeys.has(migrationKey)) {
		return;
	}

	const data = localStorage.getItem(getLegacyStorageKey(type));
	if (!data) {
		migratedLegacyKeys.add(migrationKey);
		return;
	}

	try {
		const allLegacy = JSON.parse(data) as Array<
			(SavedPromptagonistSession | SavedPromptifySession) & { username?: string }
		>;
		const userLegacySessions = allLegacy.filter((session) => session.username === username);
		if (userLegacySessions.length === 0) {
			migratedLegacyKeys.add(migrationKey);
			return;
		}

		for (const session of userLegacySessions) {
			const didSave = await saveSession(type, session);
			if (!didSave) {
				return;
			}
		}

		const remainingSessions = allLegacy.filter((session) => session.username !== username);
		localStorage.setItem(getLegacyStorageKey(type), JSON.stringify(remainingSessions));
		migratedLegacyKeys.add(migrationKey);
	} catch (err) {
		console.error(`[savedSessionsStore] Failed legacy migration for ${type}:`, err);
	}
}

export async function getSavedPromptagonistSessions(username: string): Promise<SavedPromptagonistSession[]> {
	await migrateLegacySessions('promptagonist', username);
	const sessions = await fetchSavedSessions<{
		scenarioTitle: string;
		scenarioGenre: string;
		messages: SavedPromptagonistSession['messages'];
	}>('promptagonist');
	return sessions.map((session) => ({
		id: session.id,
		username,
		name: session.name,
		savedAt: session.savedAt,
		scenarioTitle: session.scenarioTitle,
		scenarioGenre: session.scenarioGenre,
		messages: session.messages
	}));
}

export async function savePromptagonistSession(session: SavedPromptagonistSession): Promise<void> {
	await saveSession('promptagonist', session);
}

export async function deletePromptagonistSession(sessionId: string): Promise<void> {
	await deleteSession('promptagonist', sessionId);
}

export async function getSavedPromptifySessions(username: string): Promise<SavedPromptifySession[]> {
	await migrateLegacySessions('promptify', username);
	const sessions = await fetchSavedSessions<{
		messages: SavedPromptifySession['messages'];
	}>('promptify');
	return sessions.map((session) => ({
		id: session.id,
		username,
		name: session.name,
		savedAt: session.savedAt,
		messages: session.messages
	}));
}

export async function savePromptifySession(session: SavedPromptifySession): Promise<void> {
	await saveSession('promptify', session);
}

export async function deletePromptifySession(sessionId: string): Promise<void> {
	await deleteSession('promptify', sessionId);
}
