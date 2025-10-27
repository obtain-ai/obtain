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
  /* Override Tailwind prose spacing - make everything very compact */
  :global(.prose *) {
    margin-top: 0;
    margin-bottom: 0;
  }
  
  :global(.prose h1) {
    font-size: 1.25rem;
    font-weight: bold;
    margin-top: 0.5rem !important;
    margin-bottom: 0.25rem !important;
  }
  
  :global(.prose h2) {
    font-size: 1.1rem;
    font-weight: bold;
    margin-top: 0.5rem !important;
    margin-bottom: 0.25rem !important;
  }
  
  :global(.prose h3) {
    font-size: 1rem;
    font-weight: bold;
    margin-top: 0.4rem !important;
    margin-bottom: 0.2rem !important;
  }
  
  :global(.prose strong) {
    font-weight: bold;
  }
  
  :global(.prose p) {
    margin-top: 0.25rem !important;
    margin-bottom: 0.25rem !important;
  }
  
  :global(.prose ul),
  :global(.prose ol) {
    list-style-type: disc;
    margin-left: 1.5rem !important;
    margin-top: 0.25rem !important;
    margin-bottom: 0.25rem !important;
    padding-left: 0.5rem;
  }
  
  :global(.prose li) {
    margin-top: 0.15rem !important;
    margin-bottom: 0.15rem !important;
    line-height: 1.5;
  }
  
  :global(.prose pre) {
    margin-top: 0.25rem !important;
    margin-bottom: 0.25rem !important;
  }
  
  :global(.prose code) {
    margin: 0;
  }
  
  :global(.prose hr) {
    margin: 0.5rem 0 !important;
  }
  
  /* Override any other prose spacing */
  :global(.prose > *:first-child) {
    margin-top: 0 !important;
  }
  
  :global(.prose > *:last-child) {
    margin-bottom: 0 !important;
  }
</style>
