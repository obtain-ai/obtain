<script>
	import MenuButton from '$lib/ui/MenuButton.svelte';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';

	export const title = 'ObtAIn';
</script>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width at all screen sizes -->
	<div class="w-[80%] mx-auto py-6 sm:py-8 md:py-12 lg:py-16">
		<!-- Header section with title and tagline -->
		<header class="text-center mb-6 sm:mb-8 md:mb-12">
			<!-- Gradient title with responsive sizing -->
			<h1 class="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent break-words">
				ObtAin
			</h1>
			
			<!-- Tagline with responsive sizing -->
			<p class="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-300 font-normal">
				Your AI Learning Companion
			</p>
		</header>

		<!-- About section card -->
		<div class="mb-6 sm:mb-8 md:mb-12">
			<InfoDisplay>
				{#snippet title()}
					About ObtAin
				{/snippet}
				{#snippet content()}
					ObtAin is here to help you learn how to optimize your use of AI for your benefit. Whether you're just starting or looking to level up, ObtAin teaches you how to maximize AI's potential and make it work for you.
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- Action buttons section -->
		<div class="space-y-3 sm:space-y-4">
			<a href="/promptify" class="block w-full h-11 sm:h-12 md:h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				Promptify
			</a>
			
			<a href="/promptagonist" class="block w-full h-11 sm:h-12 md:h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				Promptagonist
			</a>
			
			<a href="/news" class="block w-full h-11 sm:h-12 md:h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				AI News
			</a>
			
			<a href="/AIListings" class="block w-full h-11 sm:h-12 md:h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-base md:text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				AI Listings
			</a>
		</div>
	</div>
</div>
