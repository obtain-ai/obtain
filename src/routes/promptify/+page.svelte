<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
	import ChatBox from '$lib/ui/ChatBox.svelte';
</script>

<InfoDisplay>
	{#snippet title()}
		Why this Matters:
	{/snippet}
	{#snippet content()}
		Promptify helps you unlock the full potential of AI by learning how to write clear, effective prompts. Chatbots often aren’t utilized to their full potential because the prompts they receive are too vague or incomplete. By improving your prompts, you’ll learn to communicate with AI more precisely and get smarter, more useful answers every time.
	{/snippet}
</InfoDisplay>

<InfoDisplay>
	{#snippet title()}
		Instructions:
	{/snippet}
	{#snippet content()}
		Think of something you might want help with from a chatbot, then enter your prompt below. Our chatbot will give you feedback and show you how to make your prompt more precise so you can get clearer, more effective results.
	{/snippet}
</InfoDisplay>

<InfoDisplay>
	{#snippet content()}
		<ChatBox />
	{/snippet}
</InfoDisplay>
