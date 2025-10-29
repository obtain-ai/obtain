<script>
	import MenuButton from '$lib/ui/MenuButton.svelte';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';

	export const title = 'ObtAIn';
</script>

<svelte:head>
  <title>ObtAIn</title>
</svelte:head>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width at all screen sizes -->
	<div class="w-[80%] mx-auto py-16">
		<!-- Header section with title and tagline -->
		<header class="text-center mb-16">
			<!-- Gradient title with constant size -->
			<h1 class="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
				ObtAin
			</h1>
			
			<!-- Tagline with constant size -->
			<p class="text-xl text-zinc-300 font-normal">
				Your AI Learning Companion
			</p>
		</header>

		<!-- About section card -->
		<div class="mb-16">
			<InfoDisplay>
				{#snippet title()}
					About ObtAin
				{/snippet}
				{#snippet content()}
					ObtAin is here to help you learn how to optimize your use of AI for your benefit. Whether you're just starting or looking to level up, ObtAin teaches you how to maximize AI's potential and make it work for you.
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- Action buttons section - 64% width to match InfoDisplay -->
		<div class="w-[80%] mx-auto space-y-6">
			<a href="/promptify" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-2xl rounded-xl flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-8">
				Promptify
				<div class="text-sm font-normal mt-1">Improve your prompts</div>
			</a>
			
			<a href="/promptagonist" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-2xl rounded-xl flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-8">
				Promptagonist
			   <div class="text-sm font-normal mt-1">Prompt your own story</div>
			</a>
			
			<a href="/news" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-2xl rounded-xl flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-8">
				Promptpress
			   <div class="text-sm font-normal mt-1">AI News</div>
			</a>
			
			<a href="/AIListings" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-2xl rounded-xl flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-8">
				Promptpedia
				<div class="text-sm font-normal mt-1">Different AI's explained</div>
			</a>
		</div>
	</div>
</div>
