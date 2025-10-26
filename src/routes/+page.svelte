<script>
	import MenuButton from '$lib/ui/MenuButton.svelte';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';

	export const title = 'ObtAIn';
</script>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width at all screen sizes -->
	<div class="w-[80%] mx-auto py-[3vw]">
		<!-- Header section with title and tagline -->
		<header class="text-center mb-[3vw]">
			<!-- Gradient title with vw-based sizing -->
			<h1 class="text-[4vw] font-bold mb-[1vw] bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent break-words" style="min-font-size: 24px; max-font-size: 64px;">
				ObtAin
			</h1>
			
			<!-- Tagline with vw-based sizing -->
			<p class="text-[1.5vw] text-zinc-300 font-normal" style="min-font-size: 12px; max-font-size: 20px;">
				Your AI Learning Companion
			</p>
		</header>

		<!-- About section card -->
		<div class="mb-[3vw]">
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
		<div class="space-y-[1.5vw]">
			<a href="/promptify" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-[1.5vw] py-[1.5vw]" style="min-font-size: 12px; max-font-size: 18px; min-height: 40px; max-height: 56px;">
				Promptify
			</a>
			
			<a href="/promptagonist" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-[1.5vw] py-[1.5vw]" style="min-font-size: 12px; max-font-size: 18px; min-height: 40px; max-height: 56px;">
				Promptagonist
			</a>
			
			<a href="/news" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-[1.5vw] py-[1.5vw]" style="min-font-size: 12px; max-font-size: 18px; min-height: 40px; max-height: 56px;">
				AI News
			</a>
			
			<a href="/AIListings" class="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-[1.5vw] py-[1.5vw]" style="min-font-size: 12px; max-font-size: 18px; min-height: 40px; max-height: 56px;">
				AI Listings
			</a>
		</div>
	</div>
</div>
