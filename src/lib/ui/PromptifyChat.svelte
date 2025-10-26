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
  let previousMessageCount = 0;

  // Generate unique IDs for messages
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
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
      if (inputElement) {
        inputElement.focus();
      }
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
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      chatMessages.update(msgs =>
        msgs.map(msg => 
          msg.id === messageId && msg.status === 'loading' 
            ? { ...msg, text: 'Sorry, I encountered an error. Please try again.', status: 'error' } 
            : msg
        )
      );
    }
    
    // Focus again after loading is complete
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 50);
  }

  async function generatePromptImprovement(userPrompt: string): Promise<string> {
    // REPLACE WITH YOUR API KEY
    const API_KEY = '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';
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const improvementPrompt = `
You are an expert AI prompt engineer helping users write better prompts. The user has submitted this prompt:

"${userPrompt}"

Your task is to provide educational feedback that helps them understand how to write better prompts for AI chatbots, agents, and other AI tools.

IMPORTANT: If the user's prompt contains inappropriate content (sexual material, self-harm, eating disorders, slurs, or offensive language), still provide normal feedback BUT:
1. Do NOT repeat, quote, or build off of the inappropriate parts
2. At the end of your response, append: "⚠️ Please avoid inappropriate content such as sexual material, harmful content, or offensive language in your prompts."

Please provide:

1. **Analysis**: Briefly analyze what the user's prompt is trying to achieve and identify areas for improvement.

2. **3 Improved Versions**: Provide 3 different improved versions of their prompt:
   - Version 1: More specific and detailed
   - Version 2: Better structured with clear sections
   - Version 3: More creative and engaging approach

3. **Why These Are Better**: Explain why each improved version is better than the original, focusing on:
   - Clarity and specificity
   - Structure and organization
   - Context and background information
   - Action-oriented language

4. **General Tips**: Provide 3-4 general tips for writing effective prompts that apply to this type of request.

Keep your response educational, encouraging, and easy to understand for people who are new to AI. Use simple language and explain technical concepts clearly.

Format your response with clear headings and bullet points for easy reading.`;

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
              content: 'You are an expert AI prompt engineer and educator. Help users write better prompts by providing clear, educational feedback with specific examples and actionable tips.'
            },
            {
              role: 'user',
              content: improvementPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });
      
      const data = await response.json();
      return data.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('Prompt improvement API error:', error);
      return 'Sorry, I encountered an error generating the prompt improvement. Please try again.';
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

  // Track previous message count to detect new messages
  previousMessageCount = 0;
  
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
