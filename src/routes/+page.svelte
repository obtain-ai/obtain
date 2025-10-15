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
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
		labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
		laboris nisi ut aliquip ex ea commodo consequat.
	{/snippet}
</InfoDisplay>

<hr class="mx-auto mt-8 mb-8 w-[70%] border-1 border-zinc-200" />

<div class="grid grid-cols-1 justify-items-center gap-8">
	<MenuButton title="Promptify" href="/promptify" />
	<MenuButton title="AI News" href="/news" />
	<MenuButton title="Other Button 1" />
	<MenuButton title="Other Button 2" />
</div>
