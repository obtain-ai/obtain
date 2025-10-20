<script>
	import MenuButton from '$lib/ui/MenuButton.svelte';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';

	export const title = 'ObtAIn';
</script>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200">
	<!-- Header section with title and tagline -->
	<header class="pt-16 pb-8 text-center">
		<!-- Gradient title -->
		<h1 class="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
			ObtAin
		</h1>
		
		<!-- Tagline -->
		<p class="text-xl text-zinc-300 font-normal">
			Your AI Learning Companion
		</p>
	</header>

	<!-- About section card -->
	<div class="max-w-2xl mx-auto px-4 mb-12">
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
	<div class="max-w-md mx-auto px-4 space-y-4">
		<!-- Primary button with gradient -->
		<div class="w-full">
			<a href="/promptify" class="block w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
				Promptify
			</a>
		</div>
		
		<!-- Secondary buttons -->
		<div class="w-full">
			<a href="/promptagonist" class="block w-full h-12 bg-zinc-700 text-white font-bold text-base rounded-xl flex items-center justify-center border border-zinc-600 hover:bg-zinc-600 transition-all duration-300">
				Promptagonist
			</a>
		</div>
		
		<div class="w-full">
			<a href="/news" class="block w-full h-12 bg-zinc-700 text-white font-bold text-base rounded-xl flex items-center justify-center border border-zinc-600 hover:bg-zinc-600 transition-all duration-300">
				AI News
			</a>
		</div>
		
		<div class="w-full">
			<a href="/AIListings" class="block w-full h-12 bg-zinc-700 text-white font-bold text-base rounded-xl flex items-center justify-center border border-zinc-600 hover:bg-zinc-600 transition-all duration-300">
				AI Listings
			</a>
		</div>
		
		<div class="w-full">
			<a href="#" class="block w-full h-12 bg-zinc-700 text-white font-bold text-base rounded-xl flex items-center justify-center border border-zinc-600 hover:bg-zinc-600 transition-all duration-300">
				Other Button 2
			</a>
		</div>
	</div>
</div>
