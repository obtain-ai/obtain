<script lang="ts">
  import { writable } from 'svelte/store';
  
  interface ScenarioStep {
    id: string;
    situation: string;
    context: string;
    vaguePrompt: string;
    structuredPrompt: string;
    rolePrompt: string;
    takeaways: string[];
  }
  
  interface ChatMessage {
    id: string;
    type: 'user' | 'ai' | 'system';
    content: string;
    promptType?: 'vague' | 'structured' | 'role' | 'custom';
    timestamp: Date;
  }
  
  let currentScenario = writable<ScenarioStep | null>(null);
  let currentStep = writable(0);
  let chatMessages = writable<ChatMessage[]>([]);
  let customPrompt = '';
  let isLoading = writable(false);
  let chatContainer: HTMLDivElement;
  
  // Sample scenarios (you can expand this)
  //scenarios are too adult based, make more teenager based ones
  const scenarios: ScenarioStep[] = [
    {
      id: 'email_scenario',
      situation: 'You need to write a professional email to your boss about a project delay.',
      context: 'The project is 2 weeks behind schedule due to unexpected technical issues. You need to explain the situation professionally.',
      vaguePrompt: 'Write an email about being late',
      structuredPrompt: 'Write a professional email to my manager explaining that our Q4 project is 2 weeks behind schedule due to technical challenges. Include: 1) Brief explanation of the delay, 2) Steps being taken to catch up, 3) New timeline estimate.',
      rolePrompt: 'You are a senior project manager. Write a professional email to your direct supervisor explaining a project delay. Use a confident but respectful tone, provide specific details, and show accountability.',
      takeaways: [
        'Vague prompts lead to generic responses',
        'Structured prompts with clear sections get better results',
        'Role-based prompts help AI understand context and tone'
      ]
    },
    {
      id: 'presentation_scenario',
      situation: 'You need to create a presentation outline for a client meeting.',
      context: 'You\'re presenting quarterly results to a major client. They\'re interested in ROI and future projections.',
      vaguePrompt: 'Make a presentation outline',
      structuredPrompt: 'Create a presentation outline for quarterly results meeting with client. Include: 1) Executive summary, 2) Key metrics and KPIs, 3) ROI analysis, 4) Challenges faced, 5) Q4 projections, 6) Next steps.',
      rolePrompt: 'You are a business analyst preparing for a high-stakes client presentation. Create a professional outline that balances transparency with confidence. Focus on data-driven insights and actionable next steps.',
      takeaways: [
        'Context about audience improves relevance',
        'Specific sections help organize information',
        'Role-based prompts consider stakeholder perspective'
      ]
    }
  ];
  
  function generateScenario() {
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    currentScenario.set(randomScenario);
    currentStep.set(0);
    chatMessages.set([]);
    customPrompt = '';
  }
  
  function refreshScenario() {
    generateScenario();
  }
  
  async function tryPresetPrompt(promptType: 'vague' | 'structured' | 'role') {
    if (!$currentScenario) return;
    
    let prompt = '';
    switch (promptType) {
      case 'vague':
        prompt = $currentScenario.vaguePrompt;
        break;
      case 'structured':
        prompt = $currentScenario.structuredPrompt;
        break;
      case 'role':
        prompt = $currentScenario.rolePrompt;
        break;
    }
    
    await sendPrompt(prompt, promptType);
  }
  
  async function sendCustomPrompt() {
    if (!customPrompt.trim()) return;
    await sendPrompt(customPrompt, 'custom');
  }
  
  async function sendPrompt(prompt: string, type: 'vague' | 'structured' | 'role' | 'custom') {
    isLoading.set(true);
    
    // Add user message
    chatMessages.update(msgs => [...msgs, {
      id: `user_${Date.now()}`,
      type: 'user',
      content: prompt,
      promptType: type,
      timestamp: new Date()
    }]);
    
    // Simulate AI response (replace with real API later)
    setTimeout(() => {
      const response = generateAIResponse(prompt, type);
      
      chatMessages.update(msgs => [...msgs, {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: response,
        promptType: type,
        timestamp: new Date()
      }]);
      
      isLoading.set(false);
    }, 1500);
  }
  
  function generateAIResponse(prompt: string, type: string): string {
    // Mock AI responses based on prompt type
    switch (type) {
      case 'vague':
        return "Here's a generic response that doesn't really address your specific needs. It's okay but not very helpful for your situation.";
      case 'structured':
        return "Based on your structured request, here's a well-organized response:\n\n1. [Specific point 1]\n2. [Specific point 2]\n3. [Specific point 3]\n\nThis approach gives you actionable information tailored to your needs.";
      case 'role':
        return "As a professional in this role, I understand the context and can provide insights that consider your specific situation, audience, and objectives. Here's a response that demonstrates expertise and relevance.";
      case 'custom':
        return "Your custom prompt shows thoughtful consideration of the situation. Here's a response that builds on your specific approach and provides targeted guidance.";
      default:
        return "Here's a response to your prompt.";
    }
  }
  
  function continueScenario() {
    // Move to next step or end scenario
    if ($currentStep < 2) {
      currentStep.update(step => step + 1);
      chatMessages.update(msgs => [...msgs, {
        id: `system_${Date.now()}`,
        type: 'system',
        content: `Moving to step ${$currentStep + 1} of the scenario...`,
        timestamp: new Date()
      }]);
    } else {
      chatMessages.update(msgs => [...msgs, {
        id: `system_${Date.now()}`,
        type: 'system',
        content: 'Scenario complete! Click Generate Scenario for a new one.',
        timestamp: new Date()
      }]);
    }
  }
  
  // Auto-scroll
  $: if (chatContainer) {
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
  }
</script>

<div class="flex flex-col w-full h-[600px] border border-zinc-300 rounded-lg bg-zinc-50 shadow-lg">
  <!-- Header with Controls -->
  <div class="flex justify-between items-center p-4 border-b border-zinc-200 bg-zinc-100 rounded-t-lg">
    <div class="flex gap-2">
      <button 
        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
        on:click={generateScenario}
      >
        Generate Scenario
      </button>
      <button 
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        on:click={refreshScenario}
      >
        ↻ Refresh
      </button>
    </div>
    <h3 class="font-semibold text-zinc-800">Promptagonist</h3>
  </div>

  <!-- Scenario Display -->
  {#if $currentScenario}
    <div class="p-4 bg-blue-50 border-b border-zinc-200">
      <h4 class="font-semibold text-blue-800 mb-2">Current Scenario:</h4>
      <p class="text-sm text-blue-700 mb-2"><strong>Situation:</strong> {$currentScenario.situation}</p>
      <p class="text-sm text-blue-700"><strong>Context:</strong> {$currentScenario.context}</p>
    </div>
  {/if}

  <!-- Chat Area -->
  <div 
    bind:this={chatContainer} 
    class="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
  >
    {#if $chatMessages.length === 0}
      <div class="text-center py-8 text-zinc-500">
        <p class="text-lg mb-2">🎭 Welcome to Promptagonist!</p>
        <p class="text-sm">Click "Generate Scenario" to start practicing your prompting skills.</p>
      </div>
    {/if}
    
    {#each $chatMessages as msg (msg.id)}
      <div class="flex {msg.type === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[80%] p-3 rounded-lg {
          msg.type === 'user' ? 'bg-blue-600 text-white' : 
          msg.type === 'system' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
          'bg-zinc-100 text-zinc-800 border border-zinc-200'
        }">
          {#if msg.promptType}
            <div class="text-xs font-semibold mb-1 uppercase">
              {msg.promptType} prompt
            </div>
          {/if}
          <div class="whitespace-pre-wrap text-sm">{msg.content}</div>
        </div>
      </div>
    {/each}
    
    {#if $isLoading}
      <div class="flex justify-start">
        <div class="bg-zinc-100 p-3 rounded-lg">
          <div class="flex items-center gap-2">
            <div class="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
            <span class="text-sm text-zinc-600">AI is thinking...</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Preset Prompts -->
  {#if $currentScenario}
    <div class="p-4 border-t border-zinc-200 bg-zinc-50">
      <h4 class="text-sm font-semibold text-zinc-700 mb-3">Try Preset Prompts:</h4>
      <div class="flex gap-2 mb-3">
        <button 
          class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors"
          on:click={() => tryPresetPrompt('vague')}
          disabled={$isLoading}
        >
          Vague
        </button>
        <button 
          class="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md text-sm transition-colors"
          on:click={() => tryPresetPrompt('structured')}
          disabled={$isLoading}
        >
          Structured
        </button>
        <button 
          class="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-md text-sm transition-colors"
          on:click={() => tryPresetPrompt('role')}
          disabled={$isLoading}
        >
          Role-based
        </button>
      </div>
      
      <!-- Custom Input -->
      <div class="flex gap-2 mb-3">
        <input
          class="flex-1 p-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-zinc-600 bg-white"
          type="text"
          bind:value={customPrompt}
          placeholder="Write your own prompt here..."
          disabled={$isLoading}
        />
        <button 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          on:click={sendCustomPrompt}
          disabled={!customPrompt.trim() || $isLoading}
        >
          Send Custom
        </button>
      </div>
      
      <!-- Continue Button -->
      <div class="flex justify-between items-center">
        <button 
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          on:click={continueScenario}
        >
          Continue Scenario
        </button>
        
        {#if $currentScenario}
          <div class="text-xs text-zinc-600">
            <strong>Takeaways:</strong> {$currentScenario.takeaways.join(', ')}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
