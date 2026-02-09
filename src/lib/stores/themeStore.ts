import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
	if (!browser) return 'dark';
	
	// Check localStorage first
	const stored = localStorage.getItem('theme');
	if (stored === 'light' || stored === 'dark') {
		return stored;
	}
	
	// Fall back to system preference
	if (window.matchMedia('(prefers-color-scheme: light)').matches) {
		return 'light';
	}
	
	return 'dark';
}

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>(getInitialTheme());

	return {
		subscribe,
		toggle: () => {
			update((current) => {
				const next = current === 'dark' ? 'light' : 'dark';
				if (browser) {
					localStorage.setItem('theme', next);
					updateDocumentClass(next);
				}
				return next;
			});
		},
		set: (theme: Theme) => {
			if (browser) {
				localStorage.setItem('theme', theme);
				updateDocumentClass(theme);
			}
			set(theme);
		},
		initialize: () => {
			if (browser) {
				const theme = getInitialTheme();
				updateDocumentClass(theme);
				set(theme);
			}
		}
	};
}

function updateDocumentClass(theme: Theme) {
	if (theme === 'dark') {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
}

export const theme = createThemeStore();
