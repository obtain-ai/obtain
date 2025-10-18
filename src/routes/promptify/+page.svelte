<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
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
		How to Use
	{/snippet}
	{#snippet content()}
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
		labore et dolore magna aliqua.
	{/snippet}
</InfoDisplay>
