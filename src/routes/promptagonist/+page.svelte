<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
	import PromptagonistChat from '$lib/ui/PromptagonistChat.svelte';
</script>

<svelte:head>
  <title>Promptagonist</title>
</svelte:head>

<!-- Main container with theme-aware background -->
<div class="min-h-screen bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width on desktop, wider on mobile -->
	<div class="w-[92%] md:w-[80%] mx-auto py-8 md:py-16">
		<!-- Title with gradient -->
		<div class="text-center mb-6 md:mb-8">
			<h1 class="text-4xl md:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent leading-normal pb-1">
				Promptagonist
			</h1>
			<!-- Tagline -->
			<p class="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 font-normal">
				Prompt. Play. Learn.
			</p>
		</div>

		<!-- Description Box -->
		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					About:
				{/snippet}
				{#snippet content()}
					Promptagonist helps you practice real-world prompting skills through interactive, branching scenarios. Each short story puts you in a situation where you must decide what kind of prompt to give the AI and your choice changes how the story unfolds. By seeing the outcomes of different prompts side by side, you'll learn how clarity, context, and structure affect the results. It's an engaging way to understand what makes a prompt effective and how small wording changes can lead to completely different AI responses.
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- How To Box -->
		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					How to Use:
				{/snippet}
				{#snippet content()}
					Click Generate Scenario to start.<br><br>
					For each step, you can:<br>
						• Write your own prompt in the input box.<br>
						• Read the Prompt score and feedback for quick tips on how to improve your prompts.<br>
						• Use ↻ Refresh anytime for a new scenario<br>
					Have fun being the Promptagonist!
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- Chatbox Area -->
		<div class="mx-auto mb-4 w-full md:w-[80%]">
			<PromptagonistChat />
		</div>
	</div>
</div>
