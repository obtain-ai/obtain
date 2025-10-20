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
  let inputElement: HTMLInputElement;

  // Generate unique IDs for messages
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async function sendMessage() {
  function sendMessage() {
    if (!userInput.trim()) return;
    
    const input = userInput.trim();
    userInput = '';

    // Check content appropriateness first
    const contentCheck = await checkContentAppropriateness(input);
    
    if (!contentCheck.isAppropriate) {
      // Add inappropriate content warning
      chatMessages.update(msgs => [...msgs, { 
        id: generateId(), 
        user: 'bot', 
        text: `⚠️ **Content Warning**: ${contentCheck.feedback}\n\nPlease write a prompt that's appropriate for all audiences. Focus on helpful, constructive prompts.`,
        status: 'normal'
      }]);
      return;
    }
    
    const messageId = generateId();
    const userMessageId = generateId();
    
    // Add user message
    chatMessages.update(msgs => [...msgs, { 
      id: userMessageId, 
      user: 'you', 
      text: input
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

    // Focus immediately after clearing input (before disabled state)
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);

    // Simulate API call (replace this with actual API call later)
    setTimeout(() => {
      chatMessages.update(msgs =>
        msgs.map(msg => 
          msg.id === messageId && msg.status === 'loading' 
            ? { ...msg, text: `Echo: ${input}`, status: 'normal' } 
            : msg
        )
      );
      
      // Focus again after loading is complete
      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
        }
      }, 50);
    }, 1000);
  }

  async function checkContentAppropriateness(prompt: string): Promise<{isAppropriate: boolean, feedback: string}> {
    // TODO: Replace with your API key
    const API_KEY = 'YOUR_API_KEY_HERE';
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const contentCheckPrompt = `
Check if this prompt contains inappropriate content for a family-friendly prompt improvement tool. Look for:
- Violence, blood, gore, or graphic content
- Sexual content or innuendo
- Profanity or offensive language
- Drug/alcohol references
- Dark themes (death, suicide, etc.)
- Any content not suitable for ages 13+

User's Prompt: "${prompt}"

Respond in this exact JSON format:
{
  "isAppropriate": [true or false],
  "feedback": "[brief explanation if inappropriate, or 'Content is appropriate' if okay]"
}`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a content moderator for a family-friendly prompt improvement tool. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: contentCheckPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 100
        })
      });
      
      const data = await response.json();
      const checkText = data.choices[0].message.content;
      
      // Parse JSON response
      const contentCheck = JSON.parse(checkText);
      return contentCheck;
      
    } catch (error) {
      console.error('Content check API error:', error);
      
      // Fallback - assume appropriate if API fails
      return {
        isAppropriate: true,
        feedback: 'Content check unavailable'
      };
    }
  }

  function resetChat() {
    chatMessages.set([]);
    // Focus input after reset
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 50);
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

  // Focus input when component mounts
  function focusInput() {
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  }
</script>

<div class="flex flex-col w-full h-[400px] border border-zinc-300 rounded-lg bg-zinc-50 shadow-lg">
  <!-- Reset Button -->
  <div class="flex justify-between items-center p-3 border-b border-zinc-200 bg-zinc-100 rounded-t-lg">
    <h3 class="font-semibold text-zinc-800">Promptify Chat</h3>
    <button 
      class="px-3 py-1 bg-black hover:bg-gray-800 text-white text-sm rounded-md transition-colors" 
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
        bind:this={inputElement}
        class="flex-1 p-3 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-zinc-600 bg-white"
        type="text"
        bind:value={userInput}
        placeholder="Type your prompt here..."
        on:keydown={handleKeydown}
        disabled={$chatMessages.some(msg => msg.status === 'loading')}
        on:mount={focusInput}
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
