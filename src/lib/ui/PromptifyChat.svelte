<div class="flex flex-col w-full border border-zinc-200 rounded-lg bg-zinc-700 shadow-lg overflow-hidden">
  <!-- Reset Button -->
  <div class="flex justify-between items-center p-3 border-b border-zinc-600 bg-zinc-800">
    <h3 class="font-semibold text-zinc-200">Promptify Chat</h3>
    <button 
      class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors" 
      on:click={resetChat}
    >
      Reset Chat
    </button>
  </div>

  <!-- Messages Container -->
  <div 
    bind:this={chatContainer} 
    class="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-800 min-h-[300px]"
  >
    {#each $chatMessages as msg (msg.id)}
      <MessageBubble {...msg} />
    {/each}

    <!-- Empty state -->
    {#if $chatMessages.length === 0}
      <div class="flex items-center justify-center h-full text-zinc-400">
        <div class="text-center">
          <p class="text-lg mb-2 font-semibold text-zinc-200">👋 Welcome to Promptify!</p>
          <p class="text-sm text-zinc-400">Start by typing your prompt to get AI-powered feedback.</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div class="p-4 border-t border-zinc-600 bg-zinc-800">
    <div class="flex gap-2">
      <input
        bind:this={inputElement}
        class="flex-1 p-3 rounded-md border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-200 placeholder-zinc-500 bg-zinc-700"
        type="text"
        bind:value={userInput}
        placeholder="Tip your prompt here.."
        on:keydown={handleKeydown}
        disabled={$chatMessages.some(msg => msg.status === 'loading')}
        on:mount={focusInput}
      />
      <button 
        class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 text-white rounded-md transition-colors font-medium" 
        on:click={sendMessage}
        disabled={!userInput.trim() || $chatMessages.some(msg => msg.status === 'loading')}
      >
        Send
      </button>
    </div>
  </div>
</div>
