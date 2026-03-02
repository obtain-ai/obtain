<script lang="ts">
  export let text: string;
  export let user: 'you' | 'bot';
  export let status: 'loading' | 'error' | 'normal' = 'normal';

  function escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // Keep formatting lightweight: support bold and line breaks.
  function formatBotText(markdown: string): string {
    const safe = escapeHtml(markdown).replace(/\r\n/g, '\n');
    return safe
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
</script>

<div class="flex {user === 'you' ? 'justify-end' : 'justify-start'}" data-message>
  <div
  class="max-w-[80%] p-3 rounded-lg border shadow-sm
         {user === 'you' 
          ? 'bg-purple-600 text-white border-purple-500' 
          : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-600'}
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
      {#if user === 'bot'}
        <div class="text-sm leading-relaxed break-words">
          {@html formatBotText(text)}
        </div>
      {:else}
        <div class="whitespace-pre-wrap text-sm break-words">
          {text}
        </div>
      {/if}
    {/if}
  </div>
</div>
