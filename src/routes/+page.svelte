<script>
	import MenuButton from '$lib/ui/MenuButton.svelte';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';

	export const title = 'ObtAIn';
</script>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200">
	<!-- Header section with title and tagline -->
	<header class="pt-8 md:pt-16 pb-6 md:pb-8 text-center px-4">
		<!-- Gradient title with responsive sizing -->
		<h1 class="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
			ObtAin
		</h1>
		
		<!-- Tagline with responsive sizing -->
		<p class="text-base sm:text-lg md:text-xl text-zinc-300 font-normal px-4">
			Your AI Learning Companion
		</p>
	</header>

	<!-- About section card -->
	<div class="max-w-2xl mx-auto px-4 mb-8 md:mb-12">
		<InfoDisplay>
			{#snippet title()}
				About ObtAin
			{/snippet}
			{#snippet content()}
				ObtAin is here to help you learn how to optimize your use of AI for your benefit. Whether you're just starting or looking to level up, ObtAin teaches you how to maximize AI's potential and make it work for you.
			{/snippet}
		</InfoDisplay>
	</div>

	<!-- Action buttons section - matching InfoDisplay width -->
	<div class="max-w-2xl mx-auto px-4 pb-8 space-y-3 md:space-y-4">
		<!-- All buttons now have the same gradient, font size, and width as InfoDisplay -->
		<div class="w-[90%] sm:w-[85%] md:w-[80%] mx-auto">
			<a href="/promptify" class="block w-full h-12 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-base sm:text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				Promptify
			</a>
		</div>
		
		<div class="w-[90%] sm:w-[85%] md:w-[80%] mx-auto">
			<a href="/promptagonist" class="block w-full h-12 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-base sm:text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				Promptagonist
			</a>
		</div>
		
		<div class="w-[90%] sm:w-[85%] md:w-[80%] mx-auto">
			<a href="/news" class="block w-full h-12 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-base sm:text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				AI News
			</a>
		</div>
		
		<div class="w-[90%] sm:w-[85%] md:w-[80%] mx-auto">
			<a href="/AIListings" class="block w-full h-12 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-base sm:text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				AI Listings
			</a>
		</div>
		
	</div>
</div>
