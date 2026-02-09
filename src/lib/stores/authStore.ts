import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	username: string;
	displayName: string;
	createdAt: string;
}

interface StoredUser {
	username: string;
	displayName: string;
	password: string; // simple hash for demo purposes
	createdAt: string;
}

// Simple hash function for demo (NOT production-grade security)
function simpleHash(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash |= 0;
	}
	return hash.toString(36);
}

function getStoredUsers(): StoredUser[] {
	if (!browser) return [];
	const data = localStorage.getItem('obtain_users');
	return data ? JSON.parse(data) : [];
}

function saveStoredUsers(users: StoredUser[]) {
	if (browser) {
		localStorage.setItem('obtain_users', JSON.stringify(users));
	}
}

function getCurrentUser(): User | null {
	if (!browser) return null;
	const data = localStorage.getItem('obtain_current_user');
	return data ? JSON.parse(data) : null;
}

function createAuthStore() {
	const user = writable<User | null>(getCurrentUser());

	return {
		subscribe: user.subscribe,

		signup: (username: string, displayName: string, password: string): { success: boolean; error?: string } => {
			const users = getStoredUsers();

			if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
				return { success: false, error: 'Username already taken' };
			}

			if (username.length < 3) {
				return { success: false, error: 'Username must be at least 3 characters' };
			}

			if (password.length < 4) {
				return { success: false, error: 'Password must be at least 4 characters' };
			}

			const newUser: StoredUser = {
				username: username.toLowerCase(),
				displayName,
				password: simpleHash(password),
				createdAt: new Date().toISOString()
			};

			users.push(newUser);
			saveStoredUsers(users);

			const publicUser: User = {
				username: newUser.username,
				displayName: newUser.displayName,
				createdAt: newUser.createdAt
			};

			if (browser) {
				localStorage.setItem('obtain_current_user', JSON.stringify(publicUser));
			}
			user.set(publicUser);

			return { success: true };
		},

		login: (username: string, password: string): { success: boolean; error?: string } => {
			const users = getStoredUsers();
			const found = users.find(u => u.username.toLowerCase() === username.toLowerCase());

			if (!found) {
				return { success: false, error: 'User not found' };
			}

			if (found.password !== simpleHash(password)) {
				return { success: false, error: 'Incorrect password' };
			}

			const publicUser: User = {
				username: found.username,
				displayName: found.displayName,
				createdAt: found.createdAt
			};

			if (browser) {
				localStorage.setItem('obtain_current_user', JSON.stringify(publicUser));
			}
			user.set(publicUser);

			return { success: true };
		},

		logout: () => {
			if (browser) {
				localStorage.removeItem('obtain_current_user');
			}
			user.set(null);
		},

		initialize: () => {
			if (browser) {
				const stored = getCurrentUser();
				user.set(stored);
			}
		}
	};
}

export const auth = createAuthStore();
export const isLoggedIn = derived(auth, ($auth) => $auth !== null);
