<!-- lib/ui/PromptagonistChat.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  
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
  }
  
  let currentScenario = writable<StoryScenario | null>(null);
  let chatMessages = writable<ChatMessage[]>([]);
  let userInput = '';
  let isLoading = writable(false);
  let chatContainer: HTMLDivElement;
  let inputElement: HTMLInputElement;
  let showScenarioSelection = writable(true);
  let showCustomForm = writable(false);
  
  // Custom scenario form
  let customTitle = '';
  let customDescription = '';
  let customContext = '';
  let customGenre = '';
  
  // Pre-made scenarios
  const scenarios: StoryScenario[] = [
    {
      id: 'space_explorer',
      title: 'Space Explorer',
      description: 'You\'re an astronaut on a mission to explore a mysterious planet.',
      initialContext: 'You\'ve just landed on Planet X-47, an uncharted world with strange energy readings. Your mission is to investigate the source of these readings and determine if the planet is safe for colonization.',
      genre: 'Sci-Fi Adventure'
    },
    {
      id: 'detective_mystery',
      title: 'Detective Mystery',
      description: 'You\'re a detective solving a complex case in a noir city.',
      initialContext: 'A wealthy businessman has been found dead in his locked office. The only clues are a cryptic note and a broken window. You have 24 hours before the case goes cold.',
      genre: 'Mystery Thriller'
    },
    {
      id: 'fantasy_quest',
      title: 'Fantasy Quest',
      description: 'You\'re a hero on a quest to save a magical kingdom.',
      initialContext: 'The Crystal of Power has been stolen by the Dark Sorcerer, plunging the kingdom into eternal winter. You must journey through dangerous lands to retrieve it before the kingdom falls.',
      genre: 'Fantasy Adventure'
    },
    {
      id: 'college_drama',
      title: 'College Drama',
      description: 'Navigate the challenges of college life and relationships.',
      initialContext: 'It\'s your first week of sophomore year. You\'re trying to balance academics, friendships, and a new romantic interest while dealing with family pressure about your major choice.',
      genre: 'Contemporary Drama'
    },
    {
      id: 'startup_founder',
      title: 'Startup Founder',
      description: 'Build your tech startup from the ground up.',
      initialContext: 'You\'ve just launched your app MVP and secured your first round of funding. Now you need to scale your team, acquire users, and prepare for your Series A pitch in 6 months.',
      genre: 'Business Drama'
    }
  ];
  
  function selectScenario(scenario: StoryScenario) {
    currentScenario.set(scenario);
    showScenarioSelection.set(false);
    showCustomForm.set(false);
    chatMessages.set([]);
    userInput = '';
    
    // Add initial story context
    chatMessages.update(msgs => [...msgs, {
      id: `system_${Date.now()}`,
      type: 'system',
      content: `🎭 **${scenario.title}**\n\n${scenario.initialContext}\n\n*Write a prompt to take action in this story. The better your prompt, the more exciting the story becomes!*`,
      timestamp: new Date()
    }]);
  }
  
  function showCustomScenarioForm() {
    showCustomForm.set(true);
    customTitle = '';
    customDescription = '';
    customContext = '';
    customGenre = '';
  }
  
  function createCustomScenario() {
    if (!customTitle || !customDescription || !customContext || !customGenre) {
      alert('Please fill in all fields');
      return;
    }
    
    const customScenario: StoryScenario = {
      id: `custom_${Date.now()}`,
      title: customTitle,
      description: customDescription,
      initialContext: customContext,
      genre: customGenre,
      isCustom: true
    };
    
    selectScenario(customScenario);
  }
  
  function cancelCustomScenario() {
    showCustomForm.set(false);
    customTitle = '';
    customDescription = '';
    customContext = '';
    customGenre = '';
  }
  
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
      // Check content appropriateness first
      const contentCheck = await checkContentAppropriateness(input);
      
      if (!contentCheck.isAppropriate) {
        // Add inappropriate content warning
        chatMessages.update(msgs => [...msgs, {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: `⚠️ **Content Warning**: ${contentCheck.feedback}\n\nPlease write a prompt that's appropriate for all audiences. Focus on creative problem-solving and positive actions.`,
          timestamp: new Date()
        }]);
        isLoading.set(false);
        return;
      }
      
      // Evaluate the prompt using AI API (only specificity)
      const evaluation = await evaluatePromptWithAI(input, $currentScenario);
      
      // Generate story response using AI API
      const storyResponse = await generateStoryResponseWithAI(input, evaluation, $currentScenario);
      
      // Add AI response with evaluation
      chatMessages.update(msgs => [...msgs, {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: storyResponse,
        evaluation: evaluation,
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
  
  async function checkContentAppropriateness(prompt: string): Promise<{isAppropriate: boolean, feedback: string}> {
    // TODO: Replace with your API key
    const API_KEY = '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';
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const contentCheckPrompt = `
Check if this prompt contains inappropriate content for a family-friendly story game. Look for:
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
              content: 'You are a content moderator for a family-friendly story game. Always respond with valid JSON.'
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
  
  async function evaluatePromptWithAI(prompt: string, scenario: StoryScenario): Promise<PromptEvaluation> {
    // TODO: Replace with your API key
    const API_KEY = 'YOUR_API_KEY_HERE';
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const evaluationPrompt = `
Evaluate this prompt based ONLY on specificity and clarity. Specificity includes:
- How clear and detailed the prompt is
- Whether it provides enough context
- If it specifies what actions to take
- If it includes relevant details
- How well-structured the prompt is

Scenario: ${scenario.title} - ${scenario.initialContext}
User's Prompt: "${prompt}"

Rate the prompt on SPECIFICITY only (1-10):
- 1-3: Very vague, unclear, lacks context
- 4-6: Somewhat clear but missing important details
- 7-8: Clear and well-structured with good context
- 9-10: Excellent specificity with comprehensive context and clear actions

Respond in this exact JSON format:
{
  "specificity": [number 1-10],
  "overallScore": [same as specificity],
  "feedback": "[constructive feedback on how to improve specificity and context]"
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
              content: 'You are an expert prompt evaluator focusing on specificity and clarity. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: evaluationPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      });
      
      const data = await response.json();
      const evaluationText = data.choices[0].message.content;
      
      // Parse JSON response
      const evaluation = JSON.parse(evaluationText);
      evaluation.isAppropriate = true; // Already checked above
      return evaluation;
      
    } catch (error) {
      console.error('Evaluation API error:', error);
      
      // Fallback evaluation
      return {
        specificity: 5,
        overallScore: 5,
        feedback: 'Unable to evaluate prompt. Please try again.',
        isAppropriate: true
      };
    }
  }
  
  async function generateStoryResponseWithAI(prompt: string, evaluation: PromptEvaluation, scenario: StoryScenario): Promise<string> {
    // TODO: Replace with your API key
    const API_KEY = 'YOUR_API_KEY_HERE';
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const storyPrompt = `
You are a creative storyteller for a family-friendly story game. Continue this story based on the user's prompt and their specificity score.

Scenario: ${scenario.title}
Context: ${scenario.initialContext}
User's Prompt: "${prompt}"
Specificity Score: ${evaluation.specificity}/10

IMPORTANT: Keep all content appropriate for ages 13+. No violence, blood, sexual content, or dark themes.

${evaluation.specificity >= 8 ? 
  'HIGH SPECIFICITY: Write an exciting, successful story continuation with positive outcomes, character success, and engaging plot developments.' :
  evaluation.specificity >= 6 ?
  'MEDIUM SPECIFICITY: Write a story continuation that progresses but with some challenges or minor setbacks due to unclear instructions.' :
  'LOW SPECIFICITY: Write a story continuation with some confusion or obstacles due to the vague prompt, but keep it positive and family-friendly.'
}

Keep the response to 2-3 sentences. Make it engaging, positive, and continue the story naturally while maintaining appropriate content.`;

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
              content: 'You are a creative storyteller for a family-friendly story game. Always keep content appropriate for ages 13+.'
            },
            {
              role: 'user',
              content: storyPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 200
        })
      });
      
      const data = await response.json();
      return data.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('Story generation API error:', error);
      return 'Sorry, I encountered an error generating the story response. Please try again.';
    }
  }
  
  function resetStory() {
    showScenarioSelection.set(true);
    showCustomForm.set(false);
    currentScenario.set(null);
    chatMessages.set([]);
    userInput = '';
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  // Auto-scroll
  $: if (chatContainer) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }
</script>

<!-- Scenario Selection Screen -->
{#if $showScenarioSelection}
  <div class="flex flex-col w-full h-[600px] border border-zinc-300 rounded-lg bg-zinc-50 shadow-lg">
    <div class="p-6">
      <h3 class="text-2xl font-bold text-zinc-800 mb-4 text-center">Choose Your Adventure</h3>
      <p class="text-center text-zinc-600 mb-6">Select a scenario or create your own story!</p>
      
      <!-- Custom Scenario Form -->
      {#if $showCustomForm}
        <div class="max-w-2xl mx-auto mb-6 p-6 bg-white border border-zinc-200 rounded-lg">
          <h4 class="text-lg font-semibold text-zinc-800 mb-4">Create Custom Scenario</h4>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-700 mb-1">Title</label>
              <input
                type="text"
                bind:value={customTitle}
                class="w-full p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Zombie Apocalypse"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <input
                type="text"
                bind:value={customDescription}
                class="w-full p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., You're a survivor in a post-apocalyptic world"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-zinc-700 mb-1">Initial Context</label>
              <textarea
                bind:value={customContext}
                class="w-full p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                placeholder="Describe the starting situation and what the user needs to do..."
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-zinc-700 mb-1">Genre</label>
              <input
                type="text"
                bind:value={customGenre}
                class="w-full p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Horror Thriller"
              />
            </div>
          </div>
          
          <div class="flex gap-2 mt-4">
            <button 
              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              on:click={createCustomScenario}
            >
              Create Scenario
            </button>
            <button 
              class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
              on:click={cancelCustomScenario}
            >
              Cancel
            </button>
          </div>
        </div>
      {:else}
        <!-- Pre-made Scenarios -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        
        <div class="text-center">
          <button 
            class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
            on:click={showCustomScenarioForm}
          >
            Create Custom Scenario
          </button>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- Chat Interface -->
  <div class="flex flex-col w-full h-[600px] border border-zinc-300 rounded-lg bg-zinc-50 shadow-lg">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b border-zinc-200 bg-zinc-100 rounded-t-lg">
      <div class="flex gap-2">
        <button 
          class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors" 
          on:click={resetStory}
        >
          Reset Story
        </button>
      </div>
      <h3 class="font-semibold text-zinc-800">{$currentScenario?.title}</h3>
    </div>

    <!-- Chat Area -->
    <div 
      bind:this={chatContainer} 
      class="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
    >
      {#each $chatMessages as msg (msg.id)}
        <div class="flex {msg.type === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] p-3 rounded-lg {
            msg.type === 'user' ? 'bg-blue-600 text-white' : 
            msg.type === 'system' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
            'bg-zinc-100 text-zinc-800 border border-zinc-200'
          }">
            <div class="whitespace-pre-wrap text-sm">{msg.content}</div>
            
            {#if msg.evaluation}
              <div class="mt-2 pt-2 border-t border-zinc-300">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-semibold">Prompt Score:</span>
                  <span class="text-xs font-bold {
                    msg.evaluation.specificity >= 8 ? 'text-green-600' :
                    msg.evaluation.specificity >= 6 ? 'text-yellow-600' :
                    'text-red-600'
                  }">
                    {msg.evaluation.specificity}/10
                  </span>
                </div>
                <div class="text-xs font-medium {
                  msg.evaluation.specificity >= 8 ? 'text-green-700' :
                  msg.evaluation.specificity >= 6 ? 'text-yellow-700' :
                  'text-red-700'
                }">
                  {msg.evaluation.feedback}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
      
      {#if $isLoading}
        <div class="flex justify-start">
          <div class="bg-zinc-100 p-3 rounded-lg">
            <div class="flex items-center gap-2">
              <div class="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
              <span class="text-sm text-zinc-600">Generating story response...</span>
            </div>
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
          disabled={$isLoading}
        />
        <button 
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-md transition-colors font-medium" 
          on:click={sendMessage}
          disabled={!userInput.trim() || $isLoading}
        >
          Send
        </button>
      </div>
    </div>
  </div>
{/if}
