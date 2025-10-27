<script lang="ts">
  export let text: string;
  export let user: 'you' | 'bot';
  export let status: 'loading' | 'error' | 'normal' = 'normal';

  // Function to convert markdown to HTML
  function formatMarkdown(text: string): string {
    // Convert bold **text** to <strong>text</strong>
    let html = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
    
    // Convert italic *text* to <em>text</em>
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic">$1</em>');
    
    // Convert headings (# Heading) to bold headings with spacing
    html = html.replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="font-bold text-xl mt-5 mb-3">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="font-bold text-2xl mt-6 mb-4">$1</h1>');
    
    // Convert line breaks
    html = html.replace(/\n/g, '<br />');
    
    // Clean up excessive spacing
    html = html.replace(/(<br \/>){2,}/g, '<br />');
    
    return html;
  }
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
        {@html formatMarkdown(text)}
      </div>
    {/if}
  </div>
</div>
