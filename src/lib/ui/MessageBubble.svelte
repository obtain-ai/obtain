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
      {#if user === 'you'}
        <!-- User messages: display as plain text with NO spacing -->
        <div class="whitespace-pre-wrap text-sm leading-tight break-words">
          {text}
        </div>
      {:else}
        <!-- Bot messages: parse markdown but keep compact -->
        <div class="whitespace-pre-wrap text-sm leading-snug break-words markdown-body">
          {@html marked.parse(text)}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  /* Ultra-compact markdown layout for bot messages */
  :global(.markdown-body) {
    line-height: 1.35;
  }

  /* Remove almost all heading gaps */
  :global(.markdown-body h1),
  :global(.markdown-body h2),
  :global(.markdown-body h3),
  :global(.markdown-body h4),
  :global(.markdown-body h5),
  :global(.markdown-body h6) {
    font-weight: 600;
    margin-top: 0.15rem;
    margin-bottom: 0.05rem;
  }

  /* Ultra-tight paragraph spacing */
  :global(.markdown-body p) {
    margin: 0.05rem 0;
  }

  /* Ultra-tight list spacing */
  :global(.markdown-body ul),
  :global(.markdown-body ol) {
    margin: 0.15rem 0;
    padding-left: 1.1rem;
  }

  :global(.markdown-body li) {
    margin: 0.02rem 0;
    line-height: 1.4;
  }

  /* Remove spacing between nested lists */
  :global(.markdown-body ul ul),
  :global(.markdown-body ol ol) {
    margin: 0.05rem 0;
  }

  :global(.markdown-body strong) {
    font-weight: 600;
  }

  /* Fix Version X spacing - make them tighter */
  :global(.markdown-body p:has-text("Version")) {
    margin-top: 0.1rem;
    margin-bottom: 0.02rem;
    font-weight: 500;
  }

  /* Reduce extra spacing around code blocks */
  :global(.markdown-body pre) {
    margin: 0.2rem 0;
  }

  :global(.markdown-body code) {
    margin: 0;
  }

  /* No extra spacing between message bubbles */
  [data-message] {
    margin-bottom: 0.1rem !important;
  }
</style>
