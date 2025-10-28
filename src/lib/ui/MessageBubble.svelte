<script lang="ts">
  export let text: string;
  export let user: 'you' | 'bot';
  export let status: 'loading' | 'error' | 'normal' = 'normal';

  // Simple markdown to HTML parser (no external library)
  function parseMarkdown(md: string): string {
    let html = md;
    
    // Convert bold **text** to <strong>text</strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convert headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Convert unordered lists (- or •)
    html = html.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    
    // Convert ordered lists (1. item)
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive <li> tags in <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/gm, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    // Convert line breaks
    html = html.replace(/\n/g, '<br />');
    
    // Convert paragraphs (text between br tags)
    html = html.replace(/([^<>]+)(<br \/>)/g, '<p>$1</p>$2');
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    
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
      {#if user === 'you'}
        <!-- User messages: display as plain text with NO spacing -->
        <div class="whitespace-pre-wrap text-sm leading-tight break-words">
          {text}
        </div>
      {:else}
        <!-- Bot messages: parse markdown but keep compact -->
        <div class="whitespace-pre-wrap text-sm leading-snug break-words markdown-body">
          {@html parseMarkdown(text)}
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
