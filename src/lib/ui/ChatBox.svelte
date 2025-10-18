<script lang="ts">
  import { writable } from 'svelte/store';
  import MessageBubble from './MessageBubble.svelte';

  let userInput = '';
  let chatMessages = writable<{ 
    id: string; 
    user: 'you' | 'bot'; 
    text: string; 
    status?: 'normal' | 'loading' | 'error' 
  }[]>([]);
  let chatContainer: HTMLDivElement;

  // Generate unique IDs for messages
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function sendMessage() {
    if (!userInput.trim()) return;
    
    const messageId = generateId();
    const userMessageId = generateId();
    
    // Add user message
    chatMessages.update(msgs => [...msgs, { 
      id: userMessageId, 
      user: 'you', 
      text: userInput.trim() 
    }]);
    
    // Add loading bot message
    chatMessages.update(msgs => [...msgs, { 
      id: messageId, 
      user: 'bot', 
      text: '', 
      status: 'loading' 
    }]);
    
    const input = userInput;
    userInput = '';

    // Simulate API call (replace this with actual API call later)
    setTimeout(() => {
      chatMessages.update(msgs =>
        msgs.map(msg => 
          msg.id === messageId && msg.status === 'loading' 
            ? { ...msg, text: `Echo: ${input}`, status: 'normal' } 
            : msg
        )
      );
    }, 1000);
  }

  function resetChat() {
    chatMessages.set([]);
  }

  // Auto-scroll to bottom when new messages are added
  $: if (chatMessages && chatContainer) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }

  // Handle Enter key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="flex flex-col w-full h-[500px] border border-zinc-300 rounded-lg bg-zinc-50 shadow-lg">
  <!-- Reset Button -->
  <div class="flex justify-between items-center p-3 border-b border-zinc-200 bg-zinc-100 rounded-t-lg">
    <h3 class="font-semibold text-zinc-800">Promptify Chat</h3>
    <button 
      class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors" 
      on:click={resetChat}
    >
      Reset Chat
    </button>
  </div>

  <!-- Messages Container -->
  <div 
    bind:this={chatContainer} 
    class="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
  >
    {#each $chatMessages as msg (msg.id)}
      <MessageBubble {...msg} />
    {/each}
    
    <!-- Empty state -->
    {#if $chatMessages.length === 0}
      <div class="flex items-center justify-center h-full text-zinc-500">
        <div class="text-center">
          <p class="text-lg mb-2">👋 Welcome to Promptify!</p>
          <p class="text-sm">Start by typing a prompt below to get feedback on how to improve it.</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div class="p-4 border-t border-zinc-200 bg-zinc-50 rounded-b-lg">
    <div class="flex gap-2">
      <input
        class="flex-1 p-3 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        type="text"
        bind:value={userInput}
        placeholder="Type your prompt here..."
        on:keydown={handleKeydown}
        disabled={$chatMessages.some(msg => msg.status === 'loading')}
      />
      <button 
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-md transition-colors font-medium" 
        on:click={sendMessage}
        disabled={!userInput.trim() || $chatMessages.some(msg => msg.status === 'loading')}
      >
        Send
      </button>
    </div>
  </div>
</div>
