<script lang="ts">
  export let text: string;
  export let user: 'you' | 'bot';
  export let status: 'loading' | 'error' | 'normal' = 'normal';
</script>

<div class="flex {user === 'you' ? 'justify-end' : 'justify-start'}">
  <div
    class="max-w-[75%] max-h-[200px] overflow-y-auto p-3 rounded-lg shadow-sm
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
      <div class="whitespace-pre-wrap text-sm leading-relaxed break-words break-all overflow-wrap-anywhere">
        {text}
      </div>
    {/if}
  </div>
</div>
