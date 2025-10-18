<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
</script>

<InfoDisplay>
	{#snippet title()}
		Why this Matters:
	{/snippet}
	{#snippet content()}
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
		labore et dolore magna aliqua.
	{/snippet}
</InfoDisplay>

<InfoDisplay>
	{#snippet title()}
		How to Use
	{/snippet}
	{#snippet content()}
		Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
		labore et dolore magna aliqua.
	{/snippet}
</InfoDisplay>
