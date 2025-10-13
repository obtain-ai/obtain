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
         bg-zinc-600 p-4 shadow-xl shadow-zinc-200/10"
	href={href ?? '#'}
>
	{#if image}
		<img src={image.src} alt={image.alt ?? ''} />
	{/if}
	<h2 class="text-2xl font-semibold">{title}</h2>
</a>
