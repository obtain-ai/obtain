<script lang="ts">
  let { title, content } = $props();
</script>

<div class="mx-auto mb-4 flex w-[80%] flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800 p-6 shadow-sm
            dark:border-zinc-700 dark:bg-zinc-800 transition-colors duration-300">
  {#if title}
    <span class="flex flex-row items-center gap-2 font-bold text-lg text-white dark:text-white">
      {@render title()}
    </span>
  {/if}
  <p class="text-zinc-300 dark:text-zinc-300 leading-relaxed">
    {@render content()}
  </p>
</div>
