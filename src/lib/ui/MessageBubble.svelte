<script lang="ts">
  export let text: string;
  export let user: 'you' | 'bot';
  export let status: 'loading' | 'error' | 'normal' = 'normal';
</script>

<div class="flex {user === 'you' ? 'justify-end' : 'justify-start'}">
  <div
    class="max-w-[70%] p-2 rounded-lg my-1 
           {user === 'you' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}
           {status === 'loading' ? 'opacity-70 italic' : ''}
           {status === 'error' ? 'border border-red-500 bg-red-100 text-red-700' : ''}"
  >
    {#if status === 'loading'}
      ⏳ Loading...
    {:else if status === 'error'}
      ❌ Error: {text}
    {:else}
      {text}
    {/if}
  </div>
</div>
