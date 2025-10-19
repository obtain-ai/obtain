<script>
	import MenuButton from '$lib/ui/MenuButton.svelte';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';

	export const title = 'ObtAIn';
</script>

<InfoDisplay>
	{#snippet title()}
		About ObtAIn
	{/snippet}
	{#snippet content()}
		ObtAIn is here to help you learn how to optimize your use of AI for your benefit. Whether you’re just starting or looking to level up, ObtAIn teaches you how to maximize AI’s potential and make it work for you.
	{/snippet}
</InfoDisplay>

<hr class="mx-auto mt-8 mb-8 w-[70%] border-1 border-zinc-200" />

<div class="grid grid-cols-1 justify-items-center gap-8">
	<MenuButton title="Promptify" href="/promptify" />
	<MenuButton title="AI News" href="/news" />
	<MenuButton title="AI Listings" href="/AIListings" />
	<MenuButton title="Other Button 2" />
</div>
