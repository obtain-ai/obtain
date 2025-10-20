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

  // Original 6 Scenarios
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
    },
    {
      id: '5',
      title: 'Noir Detective',
      description: 'You\'re a detective in a dark, rainy city solving a complex case with mysterious clues.',
      initialContext: 'The rain pounds against your office window as you examine the case file. A wealthy businessman has been found dead in his locked office. The only clues are a cryptic note and a broken window. You have 24 hours before the case goes cold.',
      genre: 'Mystery Thriller'
    },
    {
      id: '6',
      title: 'Fantasy Quest',
      description: 'You\'re a hero on a quest to save a magical kingdom from eternal winter.',
      initialContext: 'The Crystal of Power has been stolen by the Dark Sorcerer, plunging the kingdom into eternal winter. You must journey through dangerous lands to retrieve it before the kingdom falls. The villagers look to you for hope.',
      genre: 'Fantasy Adventure'
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
                content: response.storyResponse || 'No story continuation - content was inappropriate', 
                evaluation: response.evaluation, 
                status: 'normal', // Always show as normal, not error
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
    const API_KEY = 'YOUR_API_KEY_HERE'; // Make sure this is your real key
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    console.log('API Key exists:', !!API_KEY);
    console.log('API Key length:', API_KEY?.length);
    console.log('User prompt:', prompt);
    console.log('Scenario:', scenario.title);
    
    const combinedPrompt = `You are a creative storyteller and prompt evaluator for a family-friendly story game.

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
  "feedback": "[Write friendly, encouraging feedback that helps them improve. Be warm and supportive, like a helpful teacher. Give specific suggestions for improvement. Examples: 'Great start! Try adding more details about what you want to do next.' or 'Nice idea! Consider being more specific about your character's actions.' or 'Good thinking! Next time, try including more context about the situation.']",
  "storyResponse": "[2-3 sentence story continuation based on specificity score, or empty string if inappropriate]"
}`;

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
              content: 'You are a creative storyteller and prompt evaluator for a family-friendly story game. Always respond with valid JSON. Be warm, encouraging, and helpful in your feedback.'
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
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      const responseText = data.choices[0].message.content;
      
      // Clean up the response text (remove markdown code blocks if present)
      let cleanResponse = responseText.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned response:', cleanResponse);
      
      // Parse JSON response
      const result = JSON.parse(cleanResponse);
      
      if (!result.isAppropriate) {
        return {
          storyResponse: '', // Empty story response for inappropriate content
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
      console.error('Full error details:', error);
      
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

  // Smart auto-scroll - only scroll to bottom if user is already near the bottom
  let isUserScrolling = false;
  let lastScrollTop = 0;

  $: if ($chatMessages && chatContainer) {
    setTimeout(() => {
      // Only auto-scroll if user is near the bottom (within 100px)
      const isNearBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 100;
      
      if (isNearBottom && !isUserScrolling) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 50);
  }

  // Track when user manually scrolls
  function handleScroll() {
    const currentScrollTop = chatContainer.scrollTop;
    const isNearBottom = currentScrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 100;
    
    // If user scrolls up significantly, they're reading old messages
    if (currentScrollTop < lastScrollTop - 10) {
      isUserScrolling = true;
    }
    
    // If user scrolls back near bottom, resume auto-scroll
    if (isNearBottom) {
      isUserScrolling = false;
    }
    
    lastScrollTop = currentScrollTop;
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

  onMount(() => {
    focusInput();
  });
</script>

<!-- Title -->
<div class="text-center mb-8">
  <h1 class="text-4xl font-bold text-zinc-800">Promptagonist</h1>
</div>

<!-- Description Box -->
<InfoDisplay>
	{#snippet content()}
		Promptagonist helps you practice real-world prompting through interactive scenarios that show how clarity, context, and structure affect AI's responses.
	{/snippet}
</InfoDisplay>

<!-- How To Box -->
<InfoDisplay>
	{#snippet title()}
		How to Use:
	{/snippet}
	{#snippet content()}
		<ul class="list-disc list-inside space-y-1">
			<li>Choose a scenario from the options below to start.</li>
			<li>Write your own prompt in the input box.</li>
			<li>Compare the AI's answers. Notice how small wording changes affect results.</li>
			<li>Read the Takeaways for quick tips (clarity, constraints, role, audience, format).</li>
			<li>Tell the chatbox to continue to move to the next step of the scenario.</li>
			<li>Use ↻ Refresh anytime for a new scenario</li>
		</ul>
	{/snippet}
</InfoDisplay>

<!-- Scenario Selection -->
<div class="mx-auto mb-4 w-[80%] p-4 border border-zinc-300 rounded-lg bg-zinc-50 shadow-lg">
  <h3 class="font-semibold text-zinc-800 mb-2">Current Scenario: {$currentScenario?.title || 'No scenario selected'}</h3>
  <p class="text-sm text-zinc-600 mb-4">{$currentScenario?.description || 'Choose a scenario to begin.'}</p>
  
  {#if !$currentScenario}
    <!-- Scenario Selection Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {#each scenarios as scenario}
        <button 
          class="p-4 bg-white border border-zinc-200 rounded-lg hover:shadow-md transition-shadow text-left"
          on:click={() => selectScenario(scenario)}
        >
          <h4 class="font-semibold text-zinc-800 mb-2">{scenario.title}</h4>
          <p class="text-sm text-zinc-600 mb-2">{scenario.description}</p>
          <span class="text-xs text-blue-600 font-medium">{scenario.genre}</span>
        </button>
      {/each}
    </div>
    
    <!-- Action Buttons -->
    <div class="flex gap-2">
      <button 
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium" 
        on:click={generateScenario}
      >
        Random Scenario
      </button>
      <button 
        class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors font-medium" 
        on:click={toggleCustomForm}
      >
        {showCustomForm ? 'Hide Custom Form' : 'Create Custom Scenario'}
      </button>
    </div>
  {:else}
    <!-- Current Scenario Display -->
    <div class="flex gap-2">
      <button 
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium" 
        on:click={() => currentScenario.set(null)}
      >
        Choose Different Scenario
      </button>
      <button 
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors font-medium" 
        on:click={resetStory}
      >
        Reset Story
      </button>
    </div>
  {/if}

  <!-- Custom Scenario Form -->
  {#if showCustomForm}
    <div class="mt-4 p-4 border border-zinc-300 rounded-md bg-white">
      <h4 class="font-semibold text-zinc-800 mb-3">Create Custom Scenario</h4>
      <div class="flex flex-col gap-3">
        <input 
          type="text" 
          bind:value={customScenarioTitle} 
          placeholder="Custom Scenario Title" 
          class="p-2 rounded-md border border-zinc-300 bg-white text-black placeholder-zinc-600" 
        />
        <textarea 
          bind:value={customScenarioDescription} 
          placeholder="Custom Scenario Description" 
          rows="2"
          class="p-2 rounded-md border border-zinc-300 bg-white text-black placeholder-zinc-600"
        ></textarea>
        <textarea 
          bind:value={customScenarioContext} 
          placeholder="Initial Context" 
          rows="3"
          class="p-2 rounded-md border border-zinc-300 bg-white text-black placeholder-zinc-600"
        ></textarea>
        <button 
          on:click={createCustomScenario}
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium"
        >
          Create & Select Custom
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Chatbot UI -->
<div class="mx-auto mb-4 w-[80%]">
  <div class="flex flex-col w-full h-[600px] border border-zinc-300 rounded-lg bg-zinc-50 shadow-lg">
    <!-- Header -->
    <div class="flex justify-between items-center p-3 border-b border-zinc-200 bg-zinc-100 rounded-t-lg">
      <h3 class="font-semibold text-zinc-800">Promptagonist Chat</h3>
      <button 
        class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors" 
        on:click={resetStory}
      >
        Reset Chat
      </button>
    </div>

    <!-- Messages Container -->
    <div 
	  bind:this={chatContainer} 
	  class="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
	  on:scroll={handleScroll}
	>
      {#each $chatMessages as msg (msg.id)}
        <MessageBubble 
          user={msg.type === 'user' ? 'you' : 'bot'} 
          text={msg.content} 
          status={msg.type === 'ai' && msg.status === 'loading' ? 'loading' : 'normal'}
        />
      {/each}
      
      <!-- Empty state -->
      {#if $chatMessages.length === 0 && !$currentScenario}
        <div class="flex items-center justify-center h-full text-zinc-500">
          <div class="text-center">
            <p class="text-lg mb-2">👋 Welcome to Promptagonist!</p>
            <p class="text-sm">Choose a scenario above to start practicing your prompting skills.</p>
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
          placeholder="Write your prompt to continue the story..."
          on:keydown={handleKeydown}
          disabled={$isLoading || !$currentScenario}
          on:mount={focusInput}
        />
        <button 
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-md transition-colors font-medium" 
          on:click={sendMessage}
          disabled={!userInput.trim() || $isLoading || !$currentScenario}
        >
          Send
        </button>
      </div>
    </div>
  </div>
</div>
