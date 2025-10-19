<!-- lib/ui/ChatBox.svelte -->
<script lang="ts">
  import MessageBubble from './MessageBubble.svelte';
  
  interface ChatMessage {
    id: string;
    user: 'you' | 'bot';
    text: string;
    status?: 'normal' | 'loading' | 'error';
  }
  
  // Props that can be customized
  export let title = 'Chat';
  export let placeholder = 'Type your message here...';
  export let emptyStateMessage = 'Start a conversation!';
  export let height = 'h-[400px]';
  
  let userInput = '';
  let chatMessages = writable<ChatMessage[]>([]);
  let chatContainer: HTMLDivElement;
  let inputElement: HTMLInputElement;
  
  // Generate unique IDs for messages
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  // Expose functions for parent components to use
  export function addMessage(message: ChatMessage) {
    chatMessages.update(msgs => [...msgs, message]);
  }
  
  export function updateMessage(messageId: string, updates: Partial<ChatMessage>) {
    chatMessages.update(msgs =>
      msgs.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }
  
  export function clearMessages() {
    chatMessages.set([]);
  }
  
  export function getUserInput(): string {
    return userInput;
  }
  
  export function clearUserInput() {
    userInput = '';
  }
  
  export function focusInput() {
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 10);
  }
  
  function handleSend() {
    // This will be overridden by parent components
    // Parent should listen for 'send' event
    const event = new CustomEvent('send', { 
      detail: { message: userInput.trim() } 
    });
    window.dispatchEvent(event);
  }
  
  function resetChat() {
    clearMessages();
    focusInput();
  }
  
  // Auto-scroll
  $: if (chatContainer) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }
  
  // Handle Enter key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }
  
  // Focus input when component mounts
  function focusInputOnMount() {
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  }
</script>

<div class="flex flex-col w-full {height} border border-zinc-300 rounded-lg bg-zinc-50 shadow-lg">
  <!-- Header -->
  <div class="flex justify-between items-center p-3 border-b border-zinc-200 bg-zinc-100 rounded-t-lg">
    <h3 class="font-semibold text-zinc-800">{title}</h3>
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
          <p class="text-lg mb-2">👋 Welcome!</p>
          <p class="text-sm">{emptyStateMessage}</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div class="p-4 border-t border-zinc-200 bg-zinc-50 rounded-b-lg">
    <div class="flex gap-2">
      <input
        bind:this={inputElement}
        class="flex-1 p-3 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-zinc-600 bg-white"
        type="text"
        bind:value={userInput}
        placeholder={placeholder}
        on:keydown={handleKeydown}
        disabled={$chatMessages.some(msg => msg.status === 'loading')}
        on:mount={focusInputOnMount}
      />
      <button 
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-md transition-colors font-medium" 
        on:click={handleSend}
        disabled={!userInput.trim() || $chatMessages.some(msg => msg.status === 'loading')}
      >
        Send
      </button>
    </div>
  </div>
</div>
