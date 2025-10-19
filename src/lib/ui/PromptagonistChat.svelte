<!-- lib/ui/PromptagonistChatBox.svelte -->
<script lang="ts">
  import ChatBox from './ChatBox.svelte';
  import { onMount } from 'svelte';
  
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
      // Single API call for content check + evaluation + story generation
      const response = await processPromptWithAI(userMessage, $currentScenario);
      
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
  
  // ... rest of your Promptagonist logic (scenarios, API calls, etc.)
</script>

<ChatBox 
  bind:this={chatBoxRef}
  title="Promptagonist"
  placeholder="Write your prompt to continue the story..."
  emptyStateMessage="Click 'Generate Scenario' to start practicing your prompting skills."
  height="h-[600px]"
/>
