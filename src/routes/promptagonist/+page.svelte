<script lang="ts">
  import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
  import MessageBubble from '$lib/ui/MessageBubble.svelte';
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';

  // Interfaces
  interface StoryScenario {
    id: string;
    title: string;
    description: string;
    initialContext: string;
    genre: string;
    isCustom?: boolean;
  }
  
  interface PromptEvaluation {
    specificity: number; // 1-10
    overallScore: number; // Same as specificity
    feedback: string;
    isAppropriate: boolean;
  }
  
  interface ChatMessage {
    id: string;
    type: 'user' | 'ai' | 'system';
    content: string;
    evaluation?: PromptEvaluation;
    timestamp: Date;
    status?: 'normal' | 'loading' | 'error';
  }

  // State variables
  let userInput = '';
  let chatMessages = writable<ChatMessage[]>([]);
  let chatContainer: HTMLDivElement;
  let inputElement: HTMLInputElement;
  let currentScenario = writable<StoryScenario | null>(null);
  let isLoading = writable(false);
  let customScenarioTitle = '';
  let customScenarioDescription = '';
  let customScenarioContext = '';
  let showCustomForm = false;

  // Scenarios
  const scenarios: StoryScenario[] = [
    {
      id: '1',
      title: 'The Campus Mystery',
      description: 'You\'re a new student at a prestigious university, and strange things are happening in the old library. Can you uncover the secret?',
      initialContext: 'The old university library, known for its towering shelves and dusty archives, has been the subject of hushed whispers. Students claim to hear faint music and see flickering lights after hours. You, a curious freshman, decide to investigate one night.',
      genre: 'Mystery'
    },
    {
      id: '2',
      title: 'Startup Showdown',
      description: 'You\'re part of a small tech startup, and your big pitch to investors is tomorrow. Your lead developer just quit! Can you save the day?',
      initialContext: 'The air in your cramped startup office is thick with tension. The pitch deck is almost ready, but your crucial AI model needs a last-minute tweak, and the only person who knows how just walked out. Your team looks to you for a solution.',
      genre: 'Tech Drama'
    },
    {
      id: '3',
      title: 'Festival Frenzy',
      description: 'You\'re organizing a massive music festival, and a key headliner has cancelled last minute. Can you find a replacement and keep the crowd happy?',
      initialContext: 'The main stage is set, thousands of tickets are sold, and the biggest act just pulled out due to a sudden illness. Panic is starting to ripple through your team. The festival is just hours away, and you need a miracle.',
      genre: 'Event Management'
    },
    {
      id: '4',
      title: 'Galactic Delivery',
      description: 'You\'re a space courier on a critical mission to deliver a rare artifact across the galaxy, but your ship breaks down in hostile territory.',
      initialContext: 'Your cargo hold hums with the energy of the ancient artifact. Suddenly, alarms blare as your ship\'s engines sputter and die, leaving you adrift near an uncharted asteroid field, rumored to be home to space pirates.',
      genre: 'Sci-Fi Adventure'
    }
  ];

  // Functions
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function selectScenario(scenario: StoryScenario) {
    currentScenario.set(scenario);
    chatMessages.set([]);
    userInput = '';
    showCustomForm = false;
    focusInput();
    
    // Add initial system message
    chatMessages.update(msgs => [...msgs, {
      id: generateId(),
      type: 'system',
      content: `**Scenario Selected:** ${scenario.title}\n\n**Context:** ${scenario.initialContext}\n\nWhat is your first prompt to the AI?`,
      timestamp: new Date()
    }]);
  }

  function generateScenario() {
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    selectScenario(scenarios[randomIndex]);
  }

  function resetStory() {
    currentScenario.set(null);
    chatMessages.set([]);
    userInput = '';
    showCustomForm = false;
    focusInput();
  }

  function toggleCustomForm() {
    showCustomForm = !showCustomForm;
  }

  function createCustomScenario() {
    if (customScenarioTitle.trim() && customScenarioDescription.trim() && customScenarioContext.trim()) {
      const newScenario: StoryScenario = {
        id: generateId(),
        title: customScenarioTitle.trim(),
        description: customScenarioDescription.trim(),
        initialContext: customScenarioContext.trim(),
        genre: 'Custom',
        isCustom: true
      };
      selectScenario(newScenario);
      customScenarioTitle = '';
      customScenarioDescription = '';
      customScenarioContext = '';
    } else {
      alert('Please fill in all fields for the custom scenario.');
    }
  }

  async function sendMessage() {
    const scenario = $currentScenario;
    if (!userInput.trim() || !scenario) return;
    
    isLoading.set(true);
    
    const input = userInput.trim();
    userInput = '';

    // Add user message
    chatMessages.update(msgs => [...msgs, {
      id: generateId(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }]);
    
    // Add loading message
    const loadingId = generateId();
    chatMessages.update(msgs => [...msgs, {
      id: loadingId,
      type: 'ai',
      content: '',
      status: 'loading',
      timestamp: new Date()
    }]);
    
    // Focus immediately after clearing input
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);

    try {
      // Single API call for content check + evaluation + story generation
      const response = await processPromptWithAI(input, scenario);
      
      // Update AI response with evaluation
      chatMessages.update(msgs =>
        msgs.map(msg => 
          msg.id === loadingId && msg.status === 'loading' 
            ? { 
                ...msg, 
                content: response.storyResponse, 
                evaluation: response.evaluation, 
                status: response.evaluation.isAppropriate ? 'normal' : 'error',
                timestamp: new Date()
              } 
            : msg
        )
      );
      
      // Add feedback message
      if (response.evaluation.feedback) {
        chatMessages.update(msgs => [...msgs, {
          id: generateId(),
          type: 'system',
          content: `**Feedback:** ${response.evaluation.feedback}`,
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error('Error generating response:', error);
      
      chatMessages.update(msgs =>
        msgs.map(msg => 
          msg.id === loadingId && msg.status === 'loading' 
            ? { 
                ...msg, 
                content: 'Sorry, I encountered an error. Please try again.', 
                status: 'error',
                timestamp: new Date()
              } 
            : msg
        )
      );
    } finally {
      isLoading.set(false);
      
      // Focus again after loading is complete
      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
        }
      }, 50);
    }
  }

  async function processPromptWithAI(prompt: string, scenario: StoryScenario): Promise<{storyResponse: string, evaluation: PromptEvaluation}> {
    // REPLACE WITH YOUR API KEY
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
Continue the story based on the specificity score.
If the specificity score is high (8-10), write an exciting, successful story continuation with positive outcomes, character success, and engaging plot developments.
If the specificity score is medium (6-7), write a story continuation that progresses but with some challenges or minor setbacks due to unclear instructions.
If the specificity score is low (1-5), write a story continuation with some confusion or obstacles due to the vague prompt, but keep it positive and family-friendly.

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

  // Auto-scroll to bottom when new messages are added
  $: if ($chatMessages && chatContainer) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }

  // Handle Enter key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      eve
