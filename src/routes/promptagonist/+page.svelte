<!-- In the PromptagonistChat.svelte, replace the sendMessage function with this: -->

async function sendMessage() {
  if (!userInput.trim() || !$currentScenario) return;
  
  isLoading.set(true);
  
  // Add user message
  chatMessages.update(msgs => [...msgs, {
    id: `user_${Date.now()}`,
    type: 'user',
    content: userInput,
    timestamp: new Date()
  }]);
  
  const input = userInput;
  userInput = '';
  
  try {
    // Single API call for content check + evaluation + story generation
    const response = await processPromptWithAI(input, $currentScenario);
    
    // Add AI response with evaluation
    chatMessages.update(msgs => [...msgs, {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content: response.storyResponse,
      evaluation: response.evaluation,
      timestamp: new Date()
    }]);
    
  } catch (error) {
    console.error('Error generating response:', error);
    
    // Fallback response if API fails
    chatMessages.update(msgs => [...msgs, {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date()
    }]);
  } finally {
    isLoading.set(false);
    
    // Keep input focused
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 10);
  }
}

async function processPromptWithAI(prompt: string, scenario: StoryScenario): Promise<{storyResponse: string, evaluation: PromptEvaluation}> {
  // TODO: Replace with your API key
  const API_KEY = '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';
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

${evaluation.specificity >= 8 ? 
  'HIGH SPECIFICITY: Write an exciting, successful story continuation with positive outcomes, character success, and engaging plot developments.' :
  evaluation.specificity >= 6 ?
  'MEDIUM SPECIFICITY: Write a story continuation that progresses but with some challenges or minor setbacks due to unclear instructions.' :
  'LOW SPECIFICITY: Write a story continuation with some confusion or obstacles due to the vague prompt, but keep it positive and family-friendly.'
}

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
