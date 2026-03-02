import { neon } from '@neondatabase/serverless';

export type SessionType = 'promptagonist' | 'promptify';

export interface StoredSessionRecord {
	id: string;
	type: SessionType;
	name: string;
	payload: unknown;
	savedAt: string;
}

let schemaReady: Promise<void> | null = null;

function getSql() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('Missing DATABASE_URL environment variable');
	}
	return neon(databaseUrl);
}

async function ensureSchema() {
	if (schemaReady) {
		return schemaReady;
	}

	schemaReady = (async () => {
		const sql = getSql();
		await sql`
			CREATE TABLE IF NOT EXISTS user_saved_sessions (
				id TEXT NOT NULL,
				username TEXT NOT NULL,
				session_type TEXT NOT NULL,
				name TEXT NOT NULL,
				payload JSONB NOT NULL,
				saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				PRIMARY KEY (username, session_type, id)
			)
		`;
		await sql`
			CREATE INDEX IF NOT EXISTS user_saved_sessions_lookup_idx
			ON user_saved_sessions (username, session_type, saved_at DESC)
		`;
	})();

	return schemaReady;
}

export async function upsertSavedSession(input: {
	username: string;
	type: SessionType;
	id: string;
	name: string;
	payload: unknown;
	savedAt: string;
}): Promise<void> {
	await ensureSchema();
	const sql = getSql();
	await sql`
		INSERT INTO user_saved_sessions (id, username, session_type, name, payload, saved_at)
		VALUES (${input.id}, ${input.username}, ${input.type}, ${input.name}, ${JSON.stringify(input.payload)}, ${input.savedAt})
		ON CONFLICT (username, session_type, id)
		DO UPDATE SET
			name = EXCLUDED.name,
			payload = EXCLUDED.payload,
			saved_at = EXCLUDED.saved_at
	`;
}

export async function getSavedSessionsByType(
	username: string,
	type: SessionType
): Promise<StoredSessionRecord[]> {
	await ensureSchema();
	const sql = getSql();
	const rows = (await sql`
		SELECT id, session_type, name, payload, saved_at
		FROM user_saved_sessions
		WHERE username = ${username} AND session_type = ${type}
		ORDER BY saved_at DESC
	`) as Array<{
		id: string;
		session_type: SessionType;
		name: string;
		payload: unknown;
		saved_at: string;
	}>;

	return rows.map((row) => ({
		id: row.id,
		type: row.session_type,
		name: row.name,
		payload: row.payload,
		savedAt: row.saved_at
	}));
}

export async function deleteSavedSessionById(input: {
	username: string;
	type: SessionType;
	id: string;
}): Promise<void> {
	await ensureSchema();
	const sql = getSql();
	await sql`
		DELETE FROM user_saved_sessions
		WHERE username = ${input.username}
			AND session_type = ${input.type}
			AND id = ${input.id}
	`;
}
