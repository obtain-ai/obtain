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
      <div class="whitespace-pre-wrap text-sm leading-relaxed break-words prose prose-sm max-w-none">
        {@html marked.parse(text)}
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.prose h1) {
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
  }
  
  :global(.prose h2) {
    font-size: 1.25rem;
    font-weight: bold;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
  }
  
  :global(.prose h3) {
    font-size: 1.1rem;
    font-weight: bold;
    margin-top: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  :global(.prose strong) {
    font-weight: bold;
  }
  
  :global(.prose p) {
    margin-bottom: 0.5rem;
  }
  
  :global(.prose ul) {
    list-style-type: disc;
    margin-left: 1.5rem;
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
  }
  
  :global(.prose ol) {
    list-style-type: decimal;
    margin-left: 1.5rem;
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
  }
  
  :global(.prose li) {
    margin-bottom: 0.1rem;
  }
  
  :global(.prose hr) {
    margin: 0.5rem 0;
  }
</style>
