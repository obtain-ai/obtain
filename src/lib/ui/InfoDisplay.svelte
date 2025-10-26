<script lang="ts">
	let { title, content } = $props();
</script>

<div
	class="mx-auto mb-4 flex w-[80%] flex-col gap-2 rounded-md border-1 border-zinc-200 bg-zinc-900 p-4"
>
	{#if title}
		<span class="flex flex-row items-center gap-2 font-bold text-lg">
			{@render title()}
		</span>
	{/if}
	<p>
		{@render content()}
	</p>
</div>
