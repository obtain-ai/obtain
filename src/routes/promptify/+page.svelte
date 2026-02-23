<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
	import PromptifyChat from '$lib/ui/PromptifyChat.svelte';
</script>

<svelte:head>
  <title>Promptify</title>
</svelte:head>

<!-- Main container with theme-aware background -->
<div class="min-h-screen bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width on desktop, wider on mobile -->
	<div class="w-[92%] md:w-[80%] mx-auto py-8 md:py-16">
		<!-- Header section with title and tagline -->
		<header class="text-center mb-8 md:mb-12">
			<!-- Gradient title -->
			<h1 class="text-4xl md:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent leading-normal pb-1">
				Promptify
			</h1>
			
			<!-- Tagline -->
			<p class="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 font-normal">
				Master the art of precise AI prompts
			</p>
		</header>

		<!-- Informational boxes -->
		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					Why This Matters
				{/snippet}
				{#snippet content()}
					Writing clear, effective prompts helps you unlock the full potential of AI and get better responses to your questions and tasks.
				{/snippet}
			</InfoDisplay>
		</div>

		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					Instructions
				{/snippet}
				{#snippet content()}
					Write a sample prompt you'd normally use with an AI, and Promptify will give you tips on how to make it stronger and get better results.
				{/snippet}
			</InfoDisplay>
		</div>

		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					Tips!
				{/snippet}
				{#snippet content()}
					Make sure your prompt includes:<br>
						• Context<br>
						• What your goal is<br>
						• How you want your prompt to be executed<br>
						• Details<br>
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- Chat section -->
		<div class="w-full md:w-[80%] mx-auto mb-8">
			<PromptifyChat />
		</div>

		<!-- Footer tip -->
		<div class="text-center text-zinc-500 dark:text-zinc-400 text-sm">
			Tip: The clearer your intent, the smarter your AI.
		</div>
	</div>
</div>
