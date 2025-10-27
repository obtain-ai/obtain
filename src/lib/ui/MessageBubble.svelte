<script lang="ts">
  export let text: string;
  export let user: 'you' | 'bot';
  export let status: 'loading' | 'error' | 'normal' = 'normal';
  import { marked } from 'marked';
  export let message;
</script>

<div class="flex {user === 'you' ? 'justify-end' : 'justify-start'}" data-message>
  <div
  class="max-w-[75%] p-3 rounded-lg shadow-sm
         {user === 'you' 
           ? 'bg-blue-600 text-white rounded-br-sm' 
           : 'bg-zinc-100 text-black rounded-bl-sm border border-zinc-200'}
         {status === 'loading' ? 'opacity-70' : ''}
         {status === 'error' ? 'bg-red-50 border-red-300 text-red-700' : ''}"
>
    {#if status === 'loading'}
      <div class="flex items-center gap-2">
        <div class="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
        <span class="text-sm italic">Thinking...</span>
      </div>
    {:else if status === 'error'}
      <div class="flex items-center gap-2">
        <span class="text-red-500">⚠️</span>
        <span class="text-sm">Error: {text}</span>
      </div>
    {:else}
      <div class="whitespace-pre-wrap text-sm leading-snug break-words markdown-body">
        {@html marked.parse(text)}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Compact markdown layout */
  :global(.markdown-body) {
    line-height: 1.35;
  }

  /* Remove almost all heading gaps */
  :global(.markdown-body h1),
  :global(.markdown-body h2),
  :global(.markdown-body h3) {
    font-weight: 600;
    margin-top: 0.15rem;
    margin-bottom: 0.05rem;
  }

  /* Ultra-tight paragraph and list spacing */
  :global(.markdown-body p),
  :global(.markdown-body ul),
  :global(.markdown-body ol),
  :global(.markdown-body li) {
    margin: 0.05rem 0;
  }

  :global(.markdown-body ul),
  :global(.markdown-body ol) {
    padding-left: 1.1rem;
  }

  :global(.markdown-body li) {
    margin-bottom: 0.03rem;
  }

  :global(.markdown-body strong) {
    font-weight: 600;
  }

  /* No extra spacing between message bubbles */
  [data-message] {
    margin-bottom: 0.1rem !important;
  }

  /* If your chat container uses flex or grid, eliminate gap */
  :global(.chat-container),
  :global(.flex[data-message]) {
    gap: 0 !important;
  }
</style>

