<script lang="ts">
  export let text: string;
  export let user: 'you' | 'bot';
  export let status: 'loading' | 'error' | 'normal' = 'normal';
</script>

<div class="flex {user === 'you' ? 'justify-end' : 'justify-start'}" data-message>
  <div
  class="max-w-[80%] p-3 rounded-lg border shadow-sm
         {user === 'you' 
          ? 'bg-purple-600 text-white border-purple-500' 
          : 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-600'}
         {status === 'loading' ? 'opacity-70' : ''}
         {status === 'error' ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' : ''}"
  >
    {#if status === 'loading'}
      <div class="flex items-center gap-2">
        <div class="animate-spin w-4 h-4 border-2 border-zinc-400 dark:border-zinc-500 border-t-transparent rounded-full"></div>
        <span class="text-sm italic text-zinc-600 dark:text-zinc-300">Thinking...</span>
      </div>
    {:else if status === 'error'}
      <div class="flex items-center gap-2">
        <span class="text-red-500">⚠️</span>
        <span class="text-sm">Error: {text}</span>
      </div>
    {:else}
      <div class="whitespace-pre-wrap text-sm break-words">
        {text}
      </div>
    {/if}
  </div>
</div>
