<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
	import PromptifyChat from '$lib/ui/PromptifyChat.svelte';
	import BackButton from '$lib/ui/BackButton.svelte';
</script>

<svelte:head>
  <title>Promptify</title>
</svelte:head>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width at all screen sizes -->
	<div class="w-[80%] mx-auto py-16">
		<!-- Back Button -->
		<div class="mb-8">
			<BackButton href="/" />
		</div>
		<!-- Header section with title and tagline -->
		<header class="text-center mb-12">
			<!-- Gradient title -->
			<h1 class="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
				Promptify
			</h1>
			
			<!-- Tagline -->
			<p class="text-xl text-zinc-300 font-normal">
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
					Write a sample prompt you’d normally use with an AI, and Promptify will give you tips on how to make it stronger and get better results.
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- Chat section scaled to 64% -->
		<div class="w-[80%] mx-auto mb-8">
			<PromptifyChat />
		</div>

		<!-- Footer tip -->
		<div class="text-center text-zinc-400 text-sm">
			Tip: The clearer your intent, the smarter your AI.
		</div>
	</div>
</div>
