<script lang="ts">
  import { writable } from 'svelte/store';
  import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
  import MessageBubble from '$lib/ui/MessageBubble.svelte';

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
      // Single API call for content check + improvement
      const response = await generatePromptImprovement(input);
      
      chatMessages.update(msgs =>
        msgs.map(msg => 
          msg.id === messageId && msg.status === 'loading' 
            ? { ...msg, text: response.content, status: response.isAppropriate ? 'normal' : 'error' } 
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

  async function generatePromptImprovement(userPrompt: string): Promise<{content: string, isAppropriate: boolean}> {
    // REPLACE WITH YOUR API KEY
    const API_KEY = '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';
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const combinedPrompt = `
You are an expert AI prompt engineer helping users write better prompts. First, check if the user's prompt is appropriate for a family-friendly prompt improvement tool.

User's Prompt: "${userPrompt}"

STEP 1: Content Check
Check if this prompt contains inappropriate content:
- Violence, blood, gore, or graphic content
- Sexual content or innuendo
- Profanity or offensive language
- Drug/alcohol references
