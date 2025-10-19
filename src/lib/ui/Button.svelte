<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let variant: 'primary' | 'secondary' = 'secondary';
  export let href: string | undefined = undefined;

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('click');
  }
</script>

{#if href}
  <a
    {href}
    class="w-full py-3 px-6 rounded-md text-center font-semibold transition-all duration-200
           {variant === 'primary'
             ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
             : 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-700'}"
    on:click={handleClick}
  >
    <slot />
  </a>
{:else}
  <button
    class="w-full py-3 px-6 rounded-md text-center font-semibold transition-all duration-200
           {variant === 'primary'
             ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
             : 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-700'}"
    on:click={handleClick}
  >
    <slot />
  </button>
{/if}
