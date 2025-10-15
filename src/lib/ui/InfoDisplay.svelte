<script lang="ts">
	let { title, content } = $props();
</script>

<div
	class="mx-auto mb-4 flex w-[80%] flex-col gap-2 rounded-md border-1 border-zinc-200 bg-zinc-600 p-4"
>
	{#if title}
		<span class="flex flex-row items-center gap-2">
			<svg
				width="18px"
				height="18px"
				stroke-width="1.5"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				color="#e4e4e7"
				><path
					d="M12 11.5V16.5"
					stroke="#e4e4e7"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				></path><path
					d="M12 7.51L12.01 7.49889"
					stroke="#e4e4e7"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				></path><path
					d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
					stroke="#e4e4e7"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				></path></svg
			>

			{@render title()}
		</span>
	{/if}
	<p>
		{@render content()}
	</p>
</div>
