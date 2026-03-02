<!-- added manual scroll to bottom for chatbot messages -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import MessageBubble from './MessageBubble.svelte';
  import { auth } from '$lib/stores/authStore';
  import { savePromptifySession, getSavedPromptifySessions, type SavedPromptifySession } from '$lib/stores/savedSessionsStore';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let userInput = '';
  let chatMessages = writable<{ 
    id: string; 
    user: 'you' | 'bot'; 
    text: string; 
    status?: 'normal' | 'loading' | 'error' 
  }[]>([]);
  let chatContainer: HTMLDivElement;
  let inputElement: HTMLTextAreaElement;
  let previousMessageCount = 0;

  // Auto-save tracking
  let currentSessionId = '';
  let autoSaveName = '';

  // Generate unique IDs for messages
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Load saved session if ?load= param is present
  onMount(() => {
    focusInput();
    void loadSessionFromQuery();
  });

  function focusInputElement() {
    if (inputElement) {
      inputElement.focus({ preventScroll: true });
    }
  }

  async function loadSessionFromQuery() {
    const loadId = $page.url.searchParams.get('load');
    if (loadId && $auth) {
      const sessions = await getSavedPromptifySessions($auth.username);
      const session = sessions.find(s => s.id === loadId);
      if (session) {
        loadSession(session);
      }
    }
  }

  function loadSession(session: SavedPromptifySession) {
    currentSessionId = session.id;
    autoSaveName = session.name;
    chatMessages.set(session.messages.map(m => ({
      ...m,
      status: m.status as 'normal' | 'loading' | 'error' | undefined
    })));
  }

  // Auto-save after each bot response
  async function autoSave() {
    if (!$auth) return;

    const messagesToSave = $chatMessages.filter(m => m.status !== 'loading');
    if (messagesToSave.length === 0) return;

    if (!currentSessionId) {
      currentSessionId = `pf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    if (!autoSaveName) {
      const firstUserMsg = messagesToSave.find(m => m.user === 'you');
      const preview = firstUserMsg ? firstUserMsg.text.slice(0, 40) : 'Promptify Session';
      autoSaveName = `${preview}${firstUserMsg && firstUserMsg.text.length > 40 ? '…' : ''} - ${new Date().toLocaleDateString()}`;
    }

    const session: SavedPromptifySession = {
      id: currentSessionId,
      username: $auth.username,
      messages: messagesToSave.map(m => ({
        id: m.id,
        user: m.user,
        text: m.text,
        status: m.status
      })),
      savedAt: new Date().toISOString(),
      name: autoSaveName
    };

    await savePromptifySession(session);
  }

  async function sendMessage() {
    if (!userInput.trim()) return;
    
    const input = userInput.trim();
    userInput = '';

    const messageId = generateId();
    const userMessageId = generateId();
    
    // Add user message
    chatMessages.update(msgs => [...msgs, { 
      id: userMessageId, 
      user: 'you', 
      text: input
    }]);
    
    // Add loading bot message
    chatMessages.update(msgs => [...msgs, { 
      id: messageId, 
      user: 'bot', 
      text: '', 
      status: 'loading' 
    }]);

    // Focus immediately after clearing input
    setTimeout(() => {
      focusInputElement();
    }, 0);

    try {
      // Generate AI response for prompt improvement
      const aiResponse = await generatePromptImprovement(input);
      
      chatMessages.update(msgs =>
        msgs.map(msg => 
          msg.id === messageId && msg.status === 'loading' 
            ? { ...msg, text: aiResponse, status: 'normal' } 
            : msg
        )
      );
      
      // Auto-save after bot responds
      await autoSave();
      
      // Scroll to bottom after content is updated
      setTimeout(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 50);
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      chatMessages.update(msgs =>
        msgs.map(msg => 
          msg.id === messageId && msg.status === 'loading' 
            ? { ...msg, text: 'Sorry, I encountered an error. Please try again.', status: 'error' } 
            : msg
        )
      );
      
      // Scroll to bottom after error content is updated
      setTimeout(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 50);
    }
    
    // Focus again after loading is complete
    setTimeout(() => {
      focusInputElement();
    }, 50);
  }

  async function generatePromptImprovement(userPrompt: string): Promise<string> {
    try {
      const response = await fetch('/promptify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userPrompt })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.response;
      
    } catch (error) {
      console.error('Prompt improvement API error:', error);
      return 'Sorry, I encountered an error generating the prompt improvement. Please try again.';
    }
  }

  function resetChat() {
    chatMessages.set([]);
    currentSessionId = '';
    autoSaveName = '';
    // Focus input after reset
    setTimeout(() => {
      focusInputElement();
    }, 50);
  }

  function adjustTextareaHeight() {
    if (inputElement) {
      inputElement.style.height = 'auto';
      inputElement.style.height = `${Math.min(inputElement.scrollHeight, 150)}px`;
    }
  }
  
  // Watch userInput for changes and adjust height
  $: if (userInput !== undefined) {
    setTimeout(() => adjustTextareaHeight(), 0);
  }

  // Auto-scroll to bottom ONLY when new messages are added
  $: if (chatContainer && $chatMessages.length > previousMessageCount) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
    
    previousMessageCount = $chatMessages.length;
  }

  // Handle Enter key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
    setTimeout(() => adjustTextareaHeight(), 0);
  }

  // Focus input when component mounts
  function focusInput() {
    setTimeout(() => {
      focusInputElement();
    }, 100);
  }
</script>

<div class="flex flex-col w-full h-[450px] md:h-[600px] border border-zinc-300 dark:border-zinc-600 rounded-lg bg-zinc-100 dark:bg-zinc-800 shadow-lg">
  <!-- Header with Reset Button -->
  <div class="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 rounded-t-lg">
    <div class="flex items-center gap-2">
      <h3 class="font-semibold text-zinc-800 dark:text-zinc-100">Promptify Chat</h3>
    </div>
    <button 
      class="h-9 w-28 flex items-center justify-center rounded-md text-white text-sm font-medium bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-sm"
      on:click={resetChat}
    >
      Reset Chat
    </button>
  </div>

  <!-- Messages Container -->
  <div 
    bind:this={chatContainer} 
    class="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50 dark:bg-zinc-800"
  >
    {#each $chatMessages as msg (msg.id)}
      <MessageBubble {...msg} />
    {/each}

    <!-- Empty state -->
    {#if $chatMessages.length === 0}
      <div class="flex justify-start">
        <div class="max-w-[80%] p-3 rounded-lg border bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-600">
          <p class="whitespace-pre-wrap text-sm break-words">
            Welcome to Promptify. Write your prompt and get feedback to make it clearer, more specific, and easier for AI to follow.
          </p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div class="p-4 border-t border-zinc-200 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 rounded-b-lg">
    <div class="flex gap-2">
      <textarea
        bind:this={inputElement}
        class="flex-1 p-3 rounded-md border border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-400 bg-white dark:bg-zinc-800 resize-none overflow-y-auto"
        bind:value={userInput}
        placeholder="Write your prompt to improve..."
        on:keydown={handleKeydown}
        on:input={adjustTextareaHeight}
        disabled={$chatMessages.some(msg => msg.status === 'loading')}
        rows="1"
        style="max-height: 150px;"
      ></textarea>
      <button 
        class="h-12 w-24 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-white rounded-md transition-colors font-medium" 
        on:click={sendMessage}
        disabled={!userInput.trim() || $chatMessages.some(msg => msg.status === 'loading')}
      >
        Send
      </button>
    </div>
  </div>
</div>
