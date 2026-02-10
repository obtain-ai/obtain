import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	username: string;
	displayName: string;
	createdAt: string;
}

function createAuthStore() {
	const user = writable<User | null>(null);

	return {
		subscribe: user.subscribe,

		signup: async (
			username: string,
			displayName: string,
			password: string
		): Promise<{ success: boolean; error?: string }> => {
			try {
				const res = await fetch('/api/auth/signup', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username, displayName, password })
				});

				const data = await res.json();

				if (!data.success) {
					return { success: false, error: data.error || 'Signup failed' };
				}

				user.set(data.user);
				return { success: true };
			} catch {
				return { success: false, error: 'Network error. Please try again.' };
			}
		},

		login: async (
			username: string,
			password: string
		): Promise<{ success: boolean; error?: string }> => {
			try {
				const res = await fetch('/api/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username, password })
				});

				const data = await res.json();

				if (!data.success) {
					return { success: false, error: data.error || 'Login failed' };
				}

				user.set(data.user);
				return { success: true };
			} catch {
				return { success: false, error: 'Network error. Please try again.' };
			}
		},

		logout: async () => {
			try {
				await fetch('/api/auth/logout', { method: 'POST' });
			} catch {
				// Even if the request fails, clear client state
			}
			user.set(null);
		},

		initialize: async () => {
			if (!browser) return;

			try {
				const res = await fetch('/api/auth/me');
				const data = await res.json();

				if (data.user) {
					user.set(data.user);
				} else {
					user.set(null);
				}
			} catch {
				user.set(null);
			}
		}
	};
}

export const auth = createAuthStore();
export const isLoggedIn = derived(auth, ($auth) => $auth !== null);
