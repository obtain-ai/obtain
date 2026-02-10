import { randomBytes, scryptSync, randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

interface StoredSession {
	token: string;
	username: string;
	createdAt: string;
}

interface AuthData {
	users: StoredUser[];
	sessions: StoredSession[];
}

// On Vercel, the filesystem is read-only except /tmp
// Locally, use data/ in the project root
const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? '/tmp' : join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'users.json');

// In-memory cache so data survives across requests within the same instance
let memoryCache: AuthData | null = null;

function readData(): AuthData {
	// Return in-memory cache if available
	if (memoryCache) {
		return memoryCache;
	}

	// Try to load from file
	if (existsSync(DATA_FILE)) {
		try {
			const raw = readFileSync(DATA_FILE, 'utf-8');
			memoryCache = JSON.parse(raw);
			return memoryCache!;
		} catch {
			// Fall through to default
		}
	}

	memoryCache = { users: [], sessions: [] };
	return memoryCache;
}

function writeData(data: AuthData): void {
	// Always update in-memory cache
	memoryCache = data;

	// Also persist to disk
	try {
		if (!existsSync(DATA_DIR)) {
			mkdirSync(DATA_DIR, { recursive: true });
		}
		writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
	} catch (err) {
		console.error('[auth] Failed to write data file (continuing with in-memory):', err);
	}
}

function hashPassword(password: string, salt: string): string {
	return scryptSync(password, salt, 64).toString('hex');
}

export function signup(
	username: string,
	displayName: string,
	password: string
): { success: boolean; error?: string; user?: User; token?: string } {
	const data = readData();

	if (username.length < 3) {
		return { success: false, error: 'Username must be at least 3 characters' };
	}

	if (password.length < 4) {
		return { success: false, error: 'Password must be at least 4 characters' };
	}

	if (data.users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
		return { success: false, error: 'Username already taken' };
	}

	const salt = randomBytes(16).toString('hex');
	const passwordHash = hashPassword(password, salt);

	const newUser: StoredUser = {
		username: username.toLowerCase(),
		displayName,
		passwordHash,
		salt,
		createdAt: new Date().toISOString()
	};

	data.users.push(newUser);

	// Create session
	const token = randomUUID();
	data.sessions.push({
		token,
		username: newUser.username,
		createdAt: new Date().toISOString()
	});

	writeData(data);

	return {
		success: true,
		user: {
			username: newUser.username,
			displayName: newUser.displayName,
			createdAt: newUser.createdAt
		},
		token
	};
}

export function login(
	username: string,
	password: string
): { success: boolean; error?: string; user?: User; token?: string } {
	const data = readData();

	const found = data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
	if (!found) {
		return { success: false, error: 'User not found' };
	}

	const passwordHash = hashPassword(password, found.salt);
	if (passwordHash !== found.passwordHash) {
		return { success: false, error: 'Incorrect password' };
	}

	// Create session
	const token = randomUUID();
	data.sessions.push({
		token,
		username: found.username,
		createdAt: new Date().toISOString()
	});

	writeData(data);

	return {
		success: true,
		user: {
			username: found.username,
			displayName: found.displayName,
			createdAt: found.createdAt
		},
		token
	};
}

export function logout(token: string): void {
	const data = readData();
	data.sessions = data.sessions.filter((s) => s.token !== token);
	writeData(data);
}

export function getUserFromSession(token: string): User | null {
	const data = readData();
	const session = data.sessions.find((s) => s.token === token);
	if (!session) return null;

	const user = data.users.find((u) => u.username === session.username);
	if (!user) return null;

	return {
		username: user.username,
		displayName: user.displayName,
		createdAt: user.createdAt
	};
}
