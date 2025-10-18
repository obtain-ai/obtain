<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
</script>

<InfoDisplay>
	{#snippet title()}
		Why this Matters:
	{/snippet}
	{#snippet content()}
		Keeping up with AI news is important because new tools and features can make everyday tasks easier, from organizing your schedule to learning new skills. Staying informed helps you take advantage of these updates and use AI safely and effectively in your daily life.
	{/snippet}
</InfoDisplay>

<InfoDisplay>
	{#snippet title()}
		Instructions:
	{/snippet}
	{#snippet content()}
		Latest news on artificial intelligence will be updated weekly here!
	{/snippet}
</InfoDisplay>

<div class="mx-auto mb-4 w-[80%]">
	<ChatBox />
</div>

