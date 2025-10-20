<!-- lib/ui/PromptifyChatBox.svelte -->
<script lang="ts">
  import ChatBox from './ChatBox.svelte';
  import { onMount } from 'svelte';
  
  let chatBoxRef: ChatBox;
  
  onMount(() => {
    // Listen for send events from the generic ChatBox
    window.addEventListener('send', handleSend);
    
    return () => {
      window.removeEventListener('send', handleSend);
    };
  });
  
  async function handleSend(event: CustomEvent) {
    const userMessage = event.detail.message;
    if (!userMessage) return;
    
    // Add user message
    chatBoxRef.addMessage({
      id: generateId(),
      user: 'you',
      text: userMessage,
      status: 'normal'
    });
    
    // Add loading message
    const loadingId = generateId();
    chatBoxRef.addMessage({
      id: loadingId,
      user: 'bot',
      text: '',
      status: 'loading'
    });
    
    // Clear input
    chatBoxRef.clearUserInput();
    chatBoxRef.focusInput();
    
    try {
      // Single API call for content check + improvement
      const response = await generatePromptImprovement(userMessage);
      
      chatBoxRef.updateMessage(loadingId, {
        text: response.content,
        status: response.isAppropriate ? 'normal' : 'error'
      });
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      chatBoxRef.updateMessage(loadingId, {
        text: 'Sorry, I encountered an error. Please try again.',
        status: 'error'
      });
    }
  }
  
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  async function generatePromptImprovement(userPrompt: string): Promise<{content: string, isAppropriate: boolean}> {
    // TODO: Replace with your API key
    const API_KE  
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
              role: 'user',
              content: combinedPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Check if response contains content warning
      const isAppropriate = !content.includes('⚠️ **Content Warning**');
      
      return {
        content: content,
        isAppropriate: isAppropriate
      };
      
    } catch (error) {
      console.error('Prompt improvement API error:', error);
      return {
        content: 'Sorry, I encountered an error. Please try again.',
        isAppropriate: true
      };
    }
  }
</script>

<ChatBox 
  bind:this={chatBoxRef}
  title="Promptify Chat"
  placeholder="Type your prompt here..."
  emptyStateMessage="Start by typing a prompt below to get feedback on how to improve it."
  height="h-[400px]"
/>
