<script lang="ts">
  import { onMount } from 'svelte';
  import { theme, themePreference } from '$lib/stores/themeStore';

  let currentTheme: 'light' | 'dark';
  let currentPreference: 'light' | 'dark' | 'system';

  onMount(() => {
    theme.subscribe(value => {
      currentTheme = value;
    });
    
    themePreference.subscribe(value => {
      currentPreference = value;
    });
  });

  function cycleTheme() {
    themePreference.update(current => {
      switch (current) {
        case 'light': return 'dark';
        case 'dark': return 'system';
        case 'system': return 'light';
        default: return 'system';
      }
    });
  }
</script>

<button
  on:click={cycleTheme}
  class="p-3 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all duration-200 transform hover:scale-110 border border-zinc-200
         dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:border-zinc-700"
  aria-label="Toggle theme"
  title="Current: {currentPreference} mode"
>
  {#if currentPreference === 'system'}
    <!-- System icon -->
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  {:else if currentTheme === 'dark'}
    <!-- Sun icon for switching to light mode -->
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h1M3 12H2m15.325-4.775l-.707-.707M6.343 17.657l-.707.707M16.95 18.364l.707-.707M7.05 6.343l-.707-.707M12 16a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  {:else}
    <!-- Moon icon for switching to dark mode -->
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
    </svg>
  {/if}
</button>
