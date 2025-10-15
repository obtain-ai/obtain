type Message = { role: 'user' | 'assistant'; content: string };
const sessions = new Map<string, Message[]>();

export function createSession() {
	const id = crypto.randomUUID();
	sessions.set(id, []);
	return id;
}

export function addMessage(sessionId: string, message: Message) {
	const history = sessions.get(sessionId) ?? [];
	history.push(message);
	sessions.set(sessionId, history);
}

export function getSessionMessages(sessionId: string): Message[] {
	return sessions.get(sessionId) ?? [];
}
