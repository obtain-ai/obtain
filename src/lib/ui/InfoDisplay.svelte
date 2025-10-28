<script lang="ts">
	let { title, content } = $props();
</script>

<div class="mx-auto mb-4 w-[80%]">
	{#if title}
		<span class="flex flex-row items-center gap-2 font-bold text-lg text-zinc-200 mb-2">
			{@render title()}
		</span>
	{/if}
	<p class="text-zinc-300 mb-4">
		{@render content()}
	</p>
	<hr class="border-zinc-600">
</div>
