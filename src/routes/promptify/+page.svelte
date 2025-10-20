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
    const API_KEY = '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'; // Make sure this is your real key
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    console.log('API Key exists:', !!API_KEY);
    console.log('API Key length:', API_KEY?.length);
    console.log('User prompt:', userPrompt);
    
    const combinedPrompt = `You are an expert AI prompt engineer helping users write better prompts. First, check if the user's prompt is appropriate for a family-friendly prompt improvement tool.

User's Prompt: "${userPrompt}"

STEP 1: Content Check
Check if this prompt contains inappropriate content:
- Violence, blood, gore, or graphic content
- Sexual content or innuendo
- Profanity or offensive language
- Drug/alcohol references
- Dark themes (death, suicide, etc.)
- Any content not suitable for ages 13+

If inappropriate, respond with:
⚠️ **Content Warning**: [brief explanation of why it's inappropriate]
Please write a prompt that's appropriate for all audiences. Focus on helpful, constructive prompts.

If appropriate, proceed to STEP 2.

STEP 2: Prompt Improvement (only if content is appropriate)
Provide educational feedback that helps them understand how to write better prompts for AI chatbots, agents, and other AI tools.

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
      console.log('Making API request...');
      
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
              content: 'You are an expert AI prompt engineer and educator. First check content appropriateness, then provide educational feedback for appropriate prompts.'
            },
            {
              role:
