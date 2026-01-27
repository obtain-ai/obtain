<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  interface Props {
    href?: string;
    label?: string;
    variant?: 'default' | 'minimal' | 'gradient';
  }

  let { href, label = 'Back', variant = 'default' }: Props = $props();

  function handleClick() {
    if (href) {
      goto(href);
    } else {
      // Go back in history or to home if no history
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        goto('/');
      }
    }
  }
</script>

{#if variant === 'minimal'}
  <button
    on:click={handleClick}
    class="inline-flex items-center gap-2 text-zinc-300 hover:text-purple-400 transition-colors duration-200 group"
    aria-label={label}
  >
    <svg
      class="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    <span class="text-sm font-medium">{label}</span>
  </button>
{:else if variant === 'gradient'}
  <button
    on:click={handleClick}
    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
    aria-label={label}
  >
    <svg
      class="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    <span>{label}</span>
  </button>
{:else}
  <!-- Default variant -->
  <button
    on:click={handleClick}
    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-medium border border-zinc-600 hover:border-purple-500/50 transition-all duration-200 shadow-sm hover:shadow-md group"
    aria-label={label}
  >
    <svg
      class="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    <span>{label}</span>
  </button>
{/if}

