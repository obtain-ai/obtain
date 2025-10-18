<script lang="ts">
  import { writable } from 'svelte/store';
  import MessageBubble from './MessageBubble.svelte';

  let userInput = '';
  let chatMessages = writable<{ user: 'you' | 'bot'; text: string; status?: 'normal' | 'loading' | 'error' }[]>([]);
  let chatContainer: HTMLDivElement;

  function sendMessage() {
    if (!userInput) return;
    chatMessages.update(msgs => [...msgs, { user: 'you', text: userInput }]);
    chatMessages.update(msgs => [...msgs, { user: 'bot', text: '', status: 'loading' }]);
    const input = userInput;
    userInput = '';

    setTimeout(() => {
      chatMessages.update(msgs =>
        msgs.map(msg => (msg.user === 'bot' && msg.status === 'loading' ? { ...msg, text: `Echo: ${input}`, status: 'normal' } : msg))
      );
    }, 1000);
  }

  function resetChat() {
    chatMessages.set([]);
  }

  $: if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
</script>

<div class="flex flex-col w-full h-[400px] border rounded p-4 bg-zinc-700">
  <button class="mb-2 px-3 py-1 bg-red-600 text-white rounded" on:click={resetChat}>
    Reset
  </button>

  <div bind:this={chatContainer} class="flex-1 overflow-y-auto mb-2 space-y-1">
    {#each $chatMessages as msg (msg)}
      <MessageBubble {...msg} />
    {/each}
  </div>

  <div class="flex gap-2">
    <input
      class="flex-1 p-2 rounded border border-zinc-400"
      type="text"
      bind:value={userInput}
      placeholder="Type your prompt..."
      on:keydown={(e) => e.key === 'Enter' && sendMessage()}
    />
    <button class="px-4 py-2 bg-blue-600 text-white rounded" on:click={sendMessage}>
      Send
    </button>
  </div>
</div>
