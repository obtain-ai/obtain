<script lang="ts">
	interface Props {
		image?: { src: string; alt?: string };
		title: string;
		href?: string;
	}

	let { image, title, href }: Props = $props();
</script>

<a
	class="flex w-[80%] cursor-pointer items-center justify-center gap-8 rounded-md
         bg-zinc-200 dark:bg-zinc-600 
         text-zinc-800 dark:text-zinc-200
         p-4 shadow-lg shadow-zinc-400/20 dark:shadow-zinc-900/30
         hover:bg-zinc-300 dark:hover:bg-zinc-500
         transition-all duration-300"
	href={href ?? '#'}
>
	{#if image}
		<img src={image.src} alt={image.alt ?? ''} />
	{/if}
	<h2 class="text-2xl font-semibold">{title}</h2>
</a>
