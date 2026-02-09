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

function getKey(type: 'promptagonist' | 'promptify'): string {
	return `obtain_saved_${type}`;
}

export function getSavedPromptagonistSessions(username: string): SavedPromptagonistSession[] {
	if (!browser) return [];
	const data = localStorage.getItem(getKey('promptagonist'));
	const all: SavedPromptagonistSession[] = data ? JSON.parse(data) : [];
	return all.filter(s => s.username === username).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function savePromptagonistSession(session: SavedPromptagonistSession): void {
	if (!browser) return;
	const data = localStorage.getItem(getKey('promptagonist'));
	const all: SavedPromptagonistSession[] = data ? JSON.parse(data) : [];
	
	// Check if updating an existing session
	const existingIndex = all.findIndex(s => s.id === session.id);
	if (existingIndex >= 0) {
		all[existingIndex] = session;
	} else {
		all.push(session);
	}
	
	localStorage.setItem(getKey('promptagonist'), JSON.stringify(all));
}

export function deletePromptagonistSession(sessionId: string): void {
	if (!browser) return;
	const data = localStorage.getItem(getKey('promptagonist'));
	const all: SavedPromptagonistSession[] = data ? JSON.parse(data) : [];
	const filtered = all.filter(s => s.id !== sessionId);
	localStorage.setItem(getKey('promptagonist'), JSON.stringify(filtered));
}

export function getSavedPromptifySessions(username: string): SavedPromptifySession[] {
	if (!browser) return [];
	const data = localStorage.getItem(getKey('promptify'));
	const all: SavedPromptifySession[] = data ? JSON.parse(data) : [];
	return all.filter(s => s.username === username).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function savePromptifySession(session: SavedPromptifySession): void {
	if (!browser) return;
	const data = localStorage.getItem(getKey('promptify'));
	const all: SavedPromptifySession[] = data ? JSON.parse(data) : [];
	
	const existingIndex = all.findIndex(s => s.id === session.id);
	if (existingIndex >= 0) {
		all[existingIndex] = session;
	} else {
		all.push(session);
	}
	
	localStorage.setItem(getKey('promptify'), JSON.stringify(all));
}

export function deletePromptifySession(sessionId: string): void {
	if (!browser) return;
	const data = localStorage.getItem(getKey('promptify'));
	const all: SavedPromptifySession[] = data ? JSON.parse(data) : [];
	const filtered = all.filter(s => s.id !== sessionId);
	localStorage.setItem(getKey('promptify'), JSON.stringify(filtered));
}
