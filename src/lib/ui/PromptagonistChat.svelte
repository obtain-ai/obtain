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
    clarity: number; // 1-10
    specificity: number; // 1-10
    aiInterpretability: number; // 1-10
    overallScore: number; // 1-10
    feedback: string;
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
  let inputElement: HTMLTextAreaElement;
  let showScenarioSelection = writable(true);
  let showCustomForm = writable(false);
  let previousMessageCount = 0;
  
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
      // Evaluate the prompt using AI API
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
  
  async function evaluatePromptWithAI(prompt: string, scenario: StoryScenario): Promise<PromptEvaluation> {
    // TODO: Replace with your API key
    const API_KEY = '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';
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const evaluationPrompt = `
      Evaluate this prompt for a story scenario. Rate each aspect from 1-10 and provide feedback.
      
      Scenario: ${scenario.title} - ${scenario.initialContext}
      User's Prompt: "${prompt}"
      
      IMPORTANT: Only if the user's prompt contains INAPPROPRIATE content (explicitly sexual/pornographic material, detailed suicide/self-harm instructions, graphic eating disorder content, or racial/sexual orientation slurs)(if the intent is unclear, don't flag it), you should:
      1. Still provide normal feedback with analysis, improved versions, and tips
      2. Do NOT quote or build off the inappropriate parts
      3. At the end, append: "⚠️ Please avoid inappropriate content such as explicit sexual material, graphic violence, self-harm, or offensive slurs in your prompts."
      
      Rate the prompt(Be relatively strict here to help the user improve) on:
      1. Clarity (1-10): How clear and unambiguous are the instructions? 
      2. Specificity (1-10): How detailed and specific is the prompt? (Does it provide good context and direction?)
      3. AI Interpretability (1-10): How easy is it for an AI understand and follow these instructions? 
      
      Respond in this exact JSON format:
      {
        "clarity": [number],
        "specificity": [number], 
        "aiInterpretability": [number],
        "overallScore": [average of the three scores],
        "feedback": "[constructive feedback message]"
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
              content: 'You are an expert prompt evaluator. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: evaluationPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });
      
      const data = await response.json();
      const evaluationText = data.choices[0].message.content;
      
      // Parse JSON response
      const evaluation = JSON.parse(evaluationText);
      return evaluation;
      
    } catch (error) {
      console.error('Evaluation API error:', error);
      
      // Fallback evaluation
      return {
        clarity: 5,
        specificity: 5,
        aiInterpretibility: 5,
        overallScore: 5,
        feedback: 'Unable to evaluate prompt. Please try again.'
      } as unknown as PromptEvaluation;
    }
  }
  
  async function generateStoryResponseWithAI(prompt: string, evaluation: PromptEvaluation, scenario: StoryScenario): Promise<string> {
    // TODO: Replace with your API key
    const API_KEY = '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';
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const storyPrompt = `
      You are a creative storyteller. Continue this story based on the user's prompt and their prompt quality score.
      
      Scenario: ${scenario.title}
      Context: ${scenario.initialContext}
      User's Prompt: "${prompt}"
      Prompt Quality Score: ${evaluation.overallScore}/10
      
      ${evaluation.overallScore >= 8 ? 
        'HIGH QUALITY PROMPT: Write an exciting, successful story continuation with positive outcomes, character success, and engaging plot developments.' :
        evaluation.overallScore >= 6 ?
        'MEDIUM QUALITY PROMPT: Write a story continuation that progresses but with some challenges, awkward moments, or minor setbacks.' :
        'LOW QUALITY PROMPT: Write a story continuation with chaotic events, character failures, or unexpected obstacles due to the vague prompt.'
      }

      Keep the response to 2-3 sentences. Make it engaging and continue the story naturally.`;

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
              content: 'You are a creative storyteller who adapts story outcomes based on prompt quality.'
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

  function adjustTextareaHeight() {
    if (inputElement) {
      inputElement.style.height = 'auto';
      inputElement.style.height = `${Math.min(inputElement.scrollHeight, 150)}px`;
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
    setTimeout(() => adjustTextareaHeight(), 0);
  }
  
  // Watch userInput for changes and adjust height
  $: if (userInput !== undefined) {
    setTimeout(() => adjustTextareaHeight(), 0);
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
</script>

{#if $showScenarioSelection}
  <div class="flex flex-col w-full h-[600px] rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-xl overflow-hidden">
    <div class="p-6 md:p-8">
      <h3 class="text-2xl font-bold text-zinc-100 mb-2 text-center tracking-tight">
        Choose Your Adventure
      </h3>
      <p class="text-center text-zinc-400 mb-8">
        Select a scenario or craft your own story.
      </p>
      
      {#if $showCustomForm}
        <div class="max-w-2xl mx-auto mb-8 p-6 md:p-7 rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-sm">
          <h4 class="text-lg font-semibold text-zinc-100 mb-4">Create Custom Scenario</h4>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-1">Title</label>
              <input
                type="text"
                bind:value={customTitle}
                class="w-full h-11 px-3 rounded-lg border border-white/10 bg-zinc-900/70 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400/40 transition"
                placeholder="e.g., Zombie Apocalypse"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-1">Description</label>
              <input
                type="text"
                bind:value={customDescription}
                class="w-full h-11 px-3 rounded-lg border border-white/10 bg-zinc-900/70 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400/40 transition"
                placeholder="e.g., You're a survivor in a post-apocalyptic world"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-1">Initial Context</label>
              <textarea
                bind:value={customContext}
                class="w-full px-3 py-2 rounded-lg border border-white/10 bg-zinc-900/70 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400/40 transition"
                placeholder="Describe the starting situation and what the user needs to do..."
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-1">Genre</label>
              <input
                type="text"
                bind:value={customGenre}
                class="w-full h-11 px-3 rounded-lg border border-white/10 bg-zinc-900/70 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400/40 transition"
                placeholder="e.g., Horror Thriller"
              />
            </div>
          </div>
          
          <div class="flex gap-3 mt-5">
            <button 
              class="px-4 py-2.5 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 transition-colors shadow-md"
              on:click={createCustomScenario}
            >
              Create Scenario
            </button>
            <button 
              class="px-4 py-2.5 rounded-lg text-zinc-100 font-medium bg-zinc-800/70 hover:bg-zinc-800 border border-white/10 transition"
              on:click={cancelCustomScenario}
            >
              Cancel
            </button>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {#each scenarios as scenario}
            <button 
              class="group p-5 rounded-xl text-left border border-white/10 bg-zinc-900/60 backdrop-blur-sm hover:bg-zinc-900/80 hover:border-fuchsia-500/30 transition shadow-sm hover:shadow-fuchsia-600/10"
              on:click={() => selectScenario(scenario)}
            >
              <h4 class="font-semibold text-zinc-100 mb-2 tracking-tight">{scenario.title}</h4>
              <p class="text-sm text-zinc-400 mb-3">{scenario.description}</p>
              <span class="inline-flex items-center text-xs font-medium text-fuchsia-300">
                {scenario.genre}
              </span>
            </button>
          {/each}
        </div>
        
        <div class="text-center">
          <button 
            class="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 transition-colors shadow-lg"
            on:click={showCustomScenarioForm}
          >
            Create Custom Scenario
          </button>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="flex flex-col w-full h-[600px] rounded-2xl border border-white/10 bg-zinc-950 shadow-xl overflow-hidden">
    <div class="flex justify-between items-center p-4 border-b border-white/10 bg-zinc-900/70 backdrop-blur-sm">
      <div class="flex gap-2">
        <button 
          class="px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 transition-colors shadow"
          on:click={resetStory}
        >
          Reset Story
        </button>
      </div>
      <h3 class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
        {$currentScenario?.title}
      </h3>
    </div>

    <div 
      bind:this={chatContainer} 
      class="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(1200px_600px_at_80%_-100px,rgba(139,92,246,0.15),transparent)]"
    >
      {#each $chatMessages as msg (msg.id)}
        <div class="flex {msg.type === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] p-3 rounded-xl border shadow-sm {
            msg.type === 'user' ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white border-fuchsia-500/30 shadow-fuchsia-600/20' : 
            msg.type === 'system' ? 'bg-amber-100/90 text-amber-900 border-amber-300' :
            'bg-zinc-900/70 text-zinc-100 border-white/10'
          }">
            <div class="whitespace-pre-wrap text-sm leading-relaxed break-words">{msg.content}</div>
            
            {#if msg.evaluation}
              <div class="mt-2 pt-2 border-t {msg.type === 'user' ? 'border-white/30' : 'border-white/10'}">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-semibold {msg.type === 'user' ? 'text-white/90' : 'text-zinc-300'}">Prompt Score:</span>
                  <span class="text-xs font-bold {
                    msg.evaluation.overallScore >= 8 ? 'text-emerald-400' :
                    msg.evaluation.overallScore >= 6 ? 'text-amber-300' :
                    'text-rose-300'
                  }">
                    {msg.evaluation.overallScore}/10
                  </span>
                </div>
                <div class="text-[11px] {msg.type === 'user' ? 'text-white/85' : 'text-zinc-400'} mb-1">
                  Clarity: {msg.evaluation.clarity}/10 · 
                  Specificity: {msg.evaluation.specificity}/10 · 
                  AI Interpretability: {msg.evaluation.aiInterpretability}/10
                </div>
                <div class="text-xs font-medium {
                  msg.evaluation.overallScore >= 8 ? 'text-emerald-300' :
                  msg.evaluation.overallScore >= 6 ? 'text-amber-300' :
                  'text-rose-300'
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
          <div class="p-3 rounded-xl border border-white/10 bg-zinc-900/70 text-zinc-200">
            <div class="flex items-center gap-2">
              <div class="animate-spin w-4 h-4 border-2 border-fuchsia-400/60 border-t-transparent rounded-full"></div>
              <span class="text-sm">Generating story response...</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="p-4 border-t border-white/10 bg-zinc-900/60 backdrop-blur-sm">
      <div class="flex gap-2">
        <textarea
          bind:this={inputElement}
          class="flex-1 p-3 rounded-xl border border-white/10 bg-zinc-950/60 text-zinc-100 placeholder-zinc-500 outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400/40 transition resize-none overflow-y-auto"
          bind:value={userInput}
          placeholder="Write your prompt to continue the story..."
          on:keydown={handleKeydown}
          on:input={adjustTextareaHeight}
          disabled={$isLoading}
          rows="1"
          style="max-height: 150px;"
        />
        <button 
          class="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-300/60 transition-colors shadow-lg" 
          on:click={sendMessage}
          disabled={!userInput.trim() || $isLoading}
        >
          Send
        </button>
      </div>
    </div>
  </div>
{/if}
