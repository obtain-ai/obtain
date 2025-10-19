import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

// Function to detect system preference
function getSystemTheme(): 'light' | 'dark' {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get initial theme - check localStorage first, then system preference
const getInitialTheme = (): 'light' | 'dark' => {
  if (!browser) return 'light';
  
  const stored = localStorage.getItem('theme') as Theme;
  if (stored === 'system' || !stored) {
    return getSystemTheme();
  }
  return stored;
};

export const theme = writable<'light' | 'dark'>(getInitialTheme());
export const themePreference = writable<Theme>(
  browser ? (localStorage.getItem('theme') as Theme) || 'system' : 'system'
);

// Listen for system theme changes
if (browser) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    themePreference.subscribe((pref) => {
      if (pref === 'system') {
        theme.set(e.matches ? 'dark' : 'light');
      }
    });
  });
}

// Update theme when preference changes
if (browser) {
  themePreference.subscribe((preference) => {
    localStorage.setItem('theme', preference);
    
    let newTheme: 'light' | 'dark';
    if (preference === 'system') {
      newTheme = getSystemTheme();
    } else {
      newTheme = preference;
    }
    
    theme.set(newTheme);
  });
  
  // Apply theme to document
  theme.subscribe((value) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(value);
  });
}
