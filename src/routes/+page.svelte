<script>
	import MenuButton from '$lib/ui/MenuButton.svelte';

	export const title = 'ObtAIn';
</script>

<div class="mx-auto mb-8 min-h-[4lh] w-[80%] rounded-md border-1 border-zinc-200 bg-zinc-600">
	<p class="p-4">
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
		labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
		laboris nisi ut aliquip ex ea commodo consequat.
	</p>
</div>

<hr class="mx-auto mb-8 w-[70%] border-1 border-zinc-200" />

<div class="grid grid-cols-1 justify-items-center gap-8">
	<MenuButton title="Promptify" href="/promptify" />
	<MenuButton title="AI News" href="/news" />
	<MenuButton title="Other Button 1" />
	<MenuButton title="Other Button 2" />
</div>
