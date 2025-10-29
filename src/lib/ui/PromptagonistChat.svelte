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
    clarity: number;
    specificity: number;
    aiInterpretability: number;
    overallScore: number;
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

  const scenarios: StoryScenario[] = [
    {
      id: 'space_explorer',
      title: 'Space Explorer',
      description: "You're an astronaut on a mission to explore a mysterious planet.",
      initialContext:
        "You've just landed on Planet X-47, an uncharted world with strange energy readings. Your mission is to investigate the source of these readings and determine if the planet is safe for colonization.",
      genre: 'Sci-Fi Adventure'
    },
    {
      id: 'detective_mystery',
      title: 'Detective Mystery',
      description: "You're a detective solving a complex case in a noir city.",
      initialContext:
        'A wealthy businessman has been found dead in his locked office. The only clues are a cryptic note and a broken window. You have 24 hours before the case goes cold.',
      genre: 'Mystery Thriller'
    },
    {
      id: 'fantasy_quest',
      title: 'Fantasy Quest',
      description: "You're a hero on a quest to save a magical kingdom.",
      initialContext:
        'The Crystal of Power has been stolen by the Dark Sorcerer, plunging the kingdom into eternal winter. You must journey through dangerous lands to retrieve it before the kingdom falls.',
      genre: 'Fantasy Adventure'
    },
    {
      id: 'college_drama',
      title: 'College Drama',
      description: 'Navigate the challenges of college life and relationships.',
      initialContext:
        "It's your first week of sophomore year. You're trying to balance academics, friendships, and a new romantic interest while dealing with family pressure about your major choice.",
      genre: 'Contemporary Drama'
    },
    {
      id: 'startup_founder',
      title: 'Startup Founder',
      description: 'Build your tech startup from the ground up.',
      initialContext:
        "You've just launched your app MVP and secured your first round of funding. Now you need to scale your team, acquire users, and prepare for your Series A pitch in 6 months.",
      genre: 'Business Drama'
    }
  ];

  function selectScenario(scenario: StoryScenario) {
    currentScenario.set(scenario);
    showScenarioSelection.set(false);
    showCustomForm.set(false);
    chatMessages.set([]);
    userInput = '';

    chatMessages.update((msgs) => [
      ...msgs,
      {
        id: `system_${Date.now()}`,
        type: 'system',
        content: `<strong>${scenario.title}</strong>\n\n${scenario.initialContext}\n\nWrite a prompt to take action in this story. The better your prompt, the more exciting the story becomes!`,
        timestamp: new Date()
      }
    ]);
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
    chatMessages.update((msgs) => [
      ...msgs,
      {
        id: `user_${Date.now()}`,
        type: 'user',
        content: userInput,
        timestamp: new Date()
      }
    ]);

    const input = userInput;
    userInput = '';

    try {
      // 1) Evaluate prompt via server route
      const evaluation = await evaluatePrompt(input, $currentScenario);

      // 2) Generate story via server route
      const storyResponse = await generateStory(input, evaluation, $currentScenario);

      // 3) Append AI response
      chatMessages.update((msgs) => [
        ...msgs,
        {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: storyResponse,
          evaluation,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error generating response:', error);
      chatMessages.update((msgs) => [
        ...msgs,
        {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      isLoading.set(false);
      setTimeout(() => {
        if (inputElement) inputElement.focus();
      }, 10);
    }
  }

  async function evaluatePrompt(prompt: string, scenario: StoryScenario): Promise<PromptEvaluation> {
    try {
      const res = await fetch('/promptagonist/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, scenario })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      // Ensure the shape is correct
      return {
        clarity: Number(data.clarity ?? 5),
        specificity: Number(data.specificity ?? 5),
        aiInterpretability: Number(data.aiInterpretability ?? 5),
        overallScore: Number(data.overallScore ?? 5),
        feedback: String(data.feedback ?? 'No feedback provided.')
      };
    } catch (err) {
      console.error('Evaluation API error:', err);
      return {
        clarity: 5,
        specificity: 5,
        aiInterpretability: 5, // fixed typo to match UI usage
        overallScore: 5,
        feedback: 'Unable to evaluate prompt. Please try again.'
      };
    }
  }

  async function generateStory(
    prompt: string,
    evaluation: PromptEvaluation,
    scenario: StoryScenario
  ): Promise<string> {
    try {
      const res = await fetch('/promptagonist/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, evaluation, scenario })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      return String(data.response || '').trim() || '...';
    } catch (err) {
      console.error('Story generation API error:', err);
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

  // Auto-scroll to bottom ONLY when new messages are added
  previousMessageCount = 0;
  $: if (chatContainer && $chatMessages.length > previousMessageCount) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
    previousMessageCount = $chatMessages.length;
  }
</script>

{#if $showScenarioSelection}
  <div class="flex flex-col w-full h-[600px] border border-zinc-600 rounded-lg bg-zinc-700 shadow-lg">
    <div class="p-6">
      <h3 class="text-2xl font-bold text-zinc-200 mb-2 text-center">Choose Your Adventure</h3>
      <p class="text-center text-zinc-400 mb-6">Select a scenario or create your own story!</p>

      {#if $showCustomForm}
        <div class="max-w-2xl mx-auto mb-6 p-6 bg-zinc-800 border border-zinc-600 rounded-lg">
          <h4 class="text-lg font-semibold text-zinc-200 mb-4">Create Custom Scenario</h4>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-1">Title</label>
              <input
                type="text"
                bind:value={customTitle}
                class="w-full p-2 rounded-md border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-200 placeholder-zinc-500 bg-zinc-700"
                placeholder="e.g., Zombie Apocalypse"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-1">Description</label>
              <input
                type="text"
                bind:value={customDescription}
                class="w-full p-2 rounded-md border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-200 placeholder-zinc-500 bg-zinc-700"
                placeholder="e.g., You're a survivor in a post-apocalyptic world"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-1">Initial Context</label>
              <textarea
                bind:value={customContext}
                class="w-full p-2 rounded-md border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-200 placeholder-zinc-500 bg-zinc-700"
                placeholder="Describe the starting situation and what the user needs to do..."
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-1">Genre</label>
              <input
                type="text"
                bind:value={customGenre}
                class="w-full p-2 rounded-md border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-200 placeholder-zinc-500 bg-zinc-700"
                placeholder="e.g., Horror Thriller"
              />
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <button
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
              on:click={createCustomScenario}
            >
              Create Scenario
            </button>
            <button
              class="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-md transition-colors"
              on:click={cancelCustomScenario}
            >
              Cancel
            </button>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {#each scenarios as scenario}
            <button
              class="p-4 bg-zinc-700 border border-zinc-600 rounded-lg hover:shadow-md hover:bg-zinc-650 transition-colors text-left"
              on:click={() => selectScenario(scenario)}
            >
              <h4 class="font-semibold text-zinc-200 mb-2">{scenario.title}</h4>
              <p class="text-sm text-zinc-400 mb-2">{scenario.description}</p>
              <span class="text-xs text-purple-400 font-medium">{scenario.genre}</span>
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
  <div class="flex flex-col w-full h-[600px] border border-zinc-600 rounded-lg bg-zinc-700 shadow-lg">
    <div class="flex justify-between items-center p-4 border-b border-zinc-600 bg-zinc-800 rounded-t-lg">
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 transition-colors shadow"
          on:click={resetStory}
        >
          Reset Story
        </button>
      </div>
      <h3 class="font-semibold text-zinc-200">{$currentScenario?.title}</h3>
    </div>

    <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-800">
      {#each $chatMessages as msg (msg.id)}
        <div class="flex {msg.type === 'user' ? 'justify-end' : 'justify-start'}">
          <div
            class="max-w-[80%] p-3 rounded-lg border {
              msg.type === 'user'
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-zinc-50 text-zinc-800 border-zinc-200'
            }"
          >
            <div class="whitespace-pre-wrap text-sm break-words">{msg.content}</div>

            {#if msg.evaluation}
              <div class="mt-2 pt-2 border-t border-zinc-500">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-semibold text-zinc-300">Prompt Score:</span>
                  <span class="text-xs font-bold {
                    msg.evaluation.overallScore >= 8 ? 'text-green-400' :
                    msg.evaluation.overallScore >= 6 ? 'text-yellow-400' :
                    'text-red-400'
                  }">
                    {msg.evaluation.overallScore}/10
                  </span>
                </div>
                <div class="text-xs text-zinc-400 mb-1">
                  Clarity: {msg.evaluation.clarity}/10 |
                  Specificity: {msg.evaluation.specificity}/10 |
                  AI Interpretability: {msg.evaluation.aiInterpretability}/10
                </div>
                <div class="text-xs font-medium {
                  msg.evaluation.overallScore >= 8 ? 'text-green-400' :
                  msg.evaluation.overallScore >= 6 ? 'text-yellow-400' :
                  'text-red-400'
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
          <div class="bg-zinc-700 p-3 rounded-lg border border-zinc-600">
            <div class="flex items-center gap-2">
              <div class="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
              <span class="text-sm text-zinc-300">Generating story response...</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="p-4 border-t border-zinc-600 bg-zinc-800 rounded-b-lg">
      <div class="flex gap-2">
        <textarea
          bind:this={inputElement}
          class="flex-1 p-3 rounded-md border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-200 placeholder-zinc-500 bg-zinc-700 resize-none overflow-y-auto"
          bind:value={userInput}
          placeholder="Write your prompt to continue the story..."
          on:keydown={handleKeydown}
          on:input={adjustTextareaHeight}
          disabled={$isLoading}
          rows="1"
          style="max-height: 150px;"
        />
        <button
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-600 text-white rounded-md transition-colors font-medium"
          on:click={sendMessage}
          disabled={!userInput.trim() || $isLoading}
        >
          Send
        </button>
      </div>
    </div>
  </div>
{/if}
