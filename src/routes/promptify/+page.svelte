<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
	import PromptifyChat from '$lib/ui/PromptifyChat.svelte';
</script>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width at all screen sizes -->
	<div class="w-[80%] mx-auto py-16">
		<!-- Header section with logo, title and tagline -->
		<header class="text-center mb-12">
			<!-- Robot logo -->
			<div class="mb-6">
				<div class="inline-block w-16 h-16 bg-purple-600 rounded-lg shadow-lg shadow-purple-500/50 flex items-center justify-center">
					<div class="flex gap-2">
						<div class="w-2 h-2 bg-white rounded-full"></div>
						<div class="w-2 h-2 bg-white rounded-full"></div>
					</div>
				</div>
			</div>
			
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
					Promptify helps you unlock the full potential of AI by learning how to write clear, effective prompts. Chatbots often aren’t utilized to their full potential because the prompts they receive are too vague or incomplete. By improving your prompts, you’ll learn to communicate with AI more precisely and get smarter, more useful answers every time.
				{/snippet}
			</InfoDisplay>
		</div>

		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					Instructions
				{/snippet}
				{#snippet content()}
					Enter your prompt in the chat below to receive feedback from our AI on how to make it more clear and specific.
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- Chat section -->
		<div class="mb-8">
			<PromptifyChat />
		</div>

		<!-- Footer tip -->
		<div class="text-center text-zinc-400 text-sm">
			Tip: The clearer your intent, the smarter your AI.
		</div>
	</div>
</div>
