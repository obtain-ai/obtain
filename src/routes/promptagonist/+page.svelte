<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
	import PromptagonistChat from '$lib/ui/PromptagonistChat.svelte';
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
		Click Generate Scenario to start.<br><br>
		For each step, you can:<br>
		• Try a sample prompt (Vague, Structured, or Role-based) and<br>
		• Write your own prompt in the input box.<br>
		• Compare the AI's answers. Notice how small wording changes affect results.<br>
		• Read the Takeaways for quick tips (clarity, constraints, role, audience, format).<br>
		• Tell the chatbox to continue to move to the next step of the scenario.<br>
		• Use ↻ Refresh anytime for a new scenario
	{/snippet}
</InfoDisplay>

<!-- Chatbox Area -->
<div class="mx-auto mb-4 w-[80%]">
	<PromptagonistChat />
</div>
