//before change
<!-- lib/ui/PromptagonistChatBox.svelte -->
<script lang="ts">
  import PromptifyChat from '$lib/ui/PromptifyChat.svelte';
  import { onMount } from 'svelte';
  import { currentScenario } from '$lib/stores/promptagonistStore';
  
  let chatBoxRef: ChatBox;
  
  onMount(() => {
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
    
    // Clear input and focus
    chatBoxRef.clearUserInput();
    chatBoxRef.focusInput();
    
    try {
      // Access the store value properly
      const scenario = $currentScenario;
      if (!scenario) {
        chatBoxRef.updateMessage(loadingId, {
          text: 'Please select a scenario first.',
          status: 'error'
        });
        return;
      }
      
      // Single API call for content check + evaluation + story generation
      const response = await processPromptWithAI(userMessage, scenario);
      
      chatBoxRef.updateMessage(loadingId, {
        text: response.storyResponse,
        status: 'normal'
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
  
  async function processPromptWithAI(prompt: string, scenario: any): Promise<{storyResponse: string, evaluation: any}> {
    // TODO: Replace with your API key
    const API_KEY = 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  
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const combinedPrompt = `
You are a creative storyteller and prompt evaluator for a family-friendly story game.

Scenario: ${scenario.title}
Context: ${scenario.initialContext}
User's Prompt: "${prompt}"

STEP 1: Content Check
Check if this prompt contains inappropriate content for ages 13+:
- Violence, blood, gore, or graphic content
- Sexual content or innuendo
- Profanity or offensive language
- Drug/alcohol references
- Dark themes (death, suicide, etc.)

If inappropriate, respond with:
⚠️ **Content Warning**: [brief explanation]
Please write a prompt that's appropriate for all audiences. Focus on creative problem-solving and positive actions.

If appropriate, proceed to STEP 2.

STEP 2: Prompt Evaluation (only if content is appropriate)
Evaluate the prompt based ONLY on specificity and clarity. Specificity includes:
- How clear and detailed the prompt is
- Whether it provides enough context
- If it specifies what actions to take
- If it includes relevant details
- How well-structured the prompt is

Rate specificity from 1-10:
- 1-3: Very vague, unclear, lacks context
- 4-6: Somewhat clear but missing important details
- 7-8: Clear and well-structured with good context
- 9-10: Excellent specificity with comprehensive context and clear actions

STEP 3: Story Generation (only if content is appropriate)
Continue the story based on the specificity score:

IMPORTANT: Keep all content appropriate for ages 13+. No violence, blood, sexual content, or dark themes.

Respond in this exact JSON format:
{
  "isAppropriate": [true or false],
  "specificity": [number 1-10],
  "overallScore": [same as specificity],
  "feedback": "[constructive feedback on how to improve specificity and context]",
  "storyResponse": "[2-3 sentence story continuation based on specificity score]"
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
              content: 'You are a creative storyteller and prompt evaluator for a family-friendly story game. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: combinedPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 400
        })
      });
      
      const data = await response.json();
      const responseText = data.choices[0].message.content;
      
      // Parse JSON response
      const result = JSON.parse(responseText);
      
      if (!result.isAppropriate) {
        return {
          storyResponse: result.storyResponse || '⚠️ **Content Warning**: Please write a prompt that\'s appropriate for all audiences.',
          evaluation: {
            specificity: 0,
            overallScore: 0,
            feedback: result.feedback || 'Content not appropriate',
            isAppropriate: false
          }
        };
      }
      
      return {
        storyResponse: result.storyResponse,
        evaluation: {
          specificity: result.specificity,
          overallScore: result.overallScore,
          feedback: result.feedback,
          isAppropriate: true
        }
      };
      
    } catch (error) {
      console.error('Combined API error:', error);
      
      return {
        storyResponse: 'Sorry, I encountered an error. Please try again.',
        evaluation: {
          specificity: 5,
          overallScore: 5,
          feedback: 'Unable to process prompt. Please try again.',
          isAppropriate: true
        }
      };
    }
  }
</script>

<ChatBox 
  bind:this={chatBoxRef}
  title="Promptagonist"
  placeholder="Write your prompt to continue the story..."
  emptyStateMessage="Click 'Generate Scenario' to start practicing your prompting skills."
  height="h-[600px]"
/>
