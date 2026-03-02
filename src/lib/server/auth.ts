import { randomBytes, randomUUID, scryptSync } from 'crypto';
import { neon } from '@neondatabase/serverless';

export interface User {
	username: string;
	displayName: string;
	createdAt: string;
}

interface StoredUser {
	username: string;
	displayName: string;
	passwordHash: string;
	salt: string;
	createdAt: string;
}
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
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
			CREATE TABLE IF NOT EXISTS auth_users (
				username TEXT PRIMARY KEY,
				display_name TEXT NOT NULL,
				password_hash TEXT NOT NULL,
				salt TEXT NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		`;

		await sql`
			CREATE TABLE IF NOT EXISTS auth_sessions (
				token TEXT PRIMARY KEY,
				username TEXT NOT NULL REFERENCES auth_users(username) ON DELETE CASCADE,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				expires_at TIMESTAMPTZ NOT NULL
			)
		`;

		await sql`CREATE INDEX IF NOT EXISTS auth_sessions_username_idx ON auth_sessions(username)`;
		await sql`CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions(expires_at)`;
	})();

	return schemaReady;
}

function hashPassword(password: string, salt: string): string {
	return scryptSync(password, salt, 64).toString('hex');
}

export async function signup(
	username: string,
	displayName: string,
	password: string
): Promise<{ success: boolean; error?: string; user?: User; token?: string }> {
	const normalizedUsername = username.trim().toLowerCase();
	const normalizedDisplayName = displayName.trim();

	if (normalizedUsername.length < 3) {
		return { success: false, error: 'Username must be at least 3 characters' };
	}

	if (password.length < 4) {
		return { success: false, error: 'Password must be at least 4 characters' };
	}

	if (!normalizedDisplayName) {
		return { success: false, error: 'Display name is required' };
	}

	try {
		await ensureSchema();
		const sql = getSql();

		const existingUsers = (await sql`
			SELECT username
			FROM auth_users
			WHERE username = ${normalizedUsername}
			LIMIT 1
		`) as Array<{ username: string }>;

		if (existingUsers.length > 0) {
			return { success: false, error: 'Username already taken' };
		}

		const salt = randomBytes(16).toString('hex');
		const passwordHash = hashPassword(password, salt);
		const token = randomUUID();

		await sql`
			INSERT INTO auth_users (username, display_name, password_hash, salt)
			VALUES (${normalizedUsername}, ${normalizedDisplayName}, ${passwordHash}, ${salt})
		`;

		await sql`
			INSERT INTO auth_sessions (token, username, expires_at)
			VALUES (${token}, ${normalizedUsername}, NOW() + INTERVAL '30 days')
		`;

		const users = (await sql`
			SELECT username, display_name, created_at
			FROM auth_users
			WHERE username = ${normalizedUsername}
			LIMIT 1
		`) as Array<{ username: string; display_name: string; created_at: string }>;

		const createdUser = users[0];
		const user: StoredUser = {
			username: createdUser.username,
			displayName: createdUser.display_name,
			passwordHash,
			salt,
			createdAt: createdUser.created_at
		};

		return {
			success: true,
			user: {
				username: user.username,
				displayName: user.displayName,
				createdAt: user.createdAt
			},
			token
		};
	} catch (err) {
		console.error('[auth] signup failed:', err);
		return { success: false, error: 'Failed to create account' };
	}
}

export async function login(
	username: string,
	password: string
): Promise<{ success: boolean; error?: string; user?: User; token?: string }> {
	const normalizedUsername = username.trim().toLowerCase();

	try {
		await ensureSchema();
		const sql = getSql();

		const users = (await sql`
			SELECT username, display_name, password_hash, salt, created_at
			FROM auth_users
			WHERE username = ${normalizedUsername}
			LIMIT 1
		`) as Array<{
			username: string;
			display_name: string;
			password_hash: string;
			salt: string;
			created_at: string;
		}>;

		const found = users[0];
		if (!found) {
			return { success: false, error: 'User not found' };
		}

		const passwordHash = hashPassword(password, found.salt);
		if (passwordHash !== found.password_hash) {
			return { success: false, error: 'Incorrect password' };
		}

		const token = randomUUID();
		await sql`
			INSERT INTO auth_sessions (token, username, expires_at)
			VALUES (${token}, ${found.username}, NOW() + INTERVAL '30 days')
		`;

		return {
			success: true,
			user: {
				username: found.username,
				displayName: found.display_name,
				createdAt: found.created_at
			},
			token
		};
	} catch (err) {
		console.error('[auth] login failed:', err);
		return { success: false, error: 'Failed to login' };
	}
}

export async function logout(token: string): Promise<void> {
	try {
		await ensureSchema();
		const sql = getSql();
		await sql`
			DELETE FROM auth_sessions
			WHERE token = ${token}
		`;
	} catch (err) {
		console.error('[auth] logout failed:', err);
	}
}

export async function getUserFromSession(token: string): Promise<User | null> {
	try {
		await ensureSchema();
		const sql = getSql();

		const users = (await sql`
			SELECT u.username, u.display_name, u.created_at
			FROM auth_sessions s
			JOIN auth_users u ON u.username = s.username
			WHERE s.token = ${token} AND s.expires_at > NOW()
			LIMIT 1
		`) as Array<{ username: string; display_name: string; created_at: string }>;

		const user = users[0];
		if (!user) {
			return null;
		}

		return {
			username: user.username,
			displayName: user.display_name,
			createdAt: user.created_at
		};
	} catch (err) {
		console.error('[auth] session lookup failed:', err);
		return null;
	}
}

export function getSessionMaxAgeSeconds(): number {
	return SESSION_MAX_AGE_SECONDS;
}

export async function checkAuthDatabase(): Promise<{ ok: boolean; error?: string }> {
	try {
		await ensureSchema();
		const sql = getSql();
		await sql`SELECT 1`;
		return { ok: true };
	} catch (err) {
		console.error('[auth] database health check failed:', err);
		return { ok: false, error: 'Database connection failed' };
	}
}
