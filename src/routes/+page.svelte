<script>
	import MenuButton from '$lib/ui/MenuButton.svelte';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';

	export const title = 'ObtAIn';
</script>

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

		<!-- Action buttons section - full width of container -->
		<div class="space-y-6">
			<a href="/promptify" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-8">
				Promptify
			</a>
			
			<a href="/promptagonist" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-8">
				Promptagonist
			</a>
			
			<a href="/news" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-8">
				AI News
			</a>
			
			<a href="/AIListings" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-8">
				AI Listings
			</a>
		</div>
	</div>
</div>
