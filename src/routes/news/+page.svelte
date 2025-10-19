<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores/themeStore';
  import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
  import Button from '$lib/ui/Button.svelte';
  import ThemeToggle from '$lib/ui/ThemeToggle.svelte';

  let currentTheme: 'light' | 'dark';

  onMount(() => {
    theme.subscribe(value => {
      currentTheme = value;
    });
  });
</script>

<svelte:head>
  <title>ObtAin - Your AI Learning Companion</title>
</svelte:head>

<div class="min-h-screen bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white flex flex-col items-center py-12 px-4 transition-colors duration-300">
  <!-- Theme Toggle -->
  <div class="absolute top-4 right-4">
    <ThemeToggle />
  </div>

  <!-- Main Title -->
  <h1 class="text-6xl md:text-7xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
    ObtAin
  </h1>

  <!-- Subtitle -->
  <p class="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 mb-12">
    Your AI Learning Companion
  </p>

  <!-- About ObtAin Section -->
  <div class="w-[80%] max-w-2xl mb-8">
    <InfoDisplay>
      {#snippet title()}
        About ObtAin
      {/snippet}
      {#snippet content()}
        ObtAin is here to help you learn how to optimize your use of AI for your benefit. Whether you're
        just starting or looking to level up, ObtAin teaches you how to maximize AI's potential and
        make it work for you.
      {/snippet}
    </InfoDisplay>
  </div>

  <!-- Buttons Section -->
  <div class="flex flex-col gap-4 w-[80%] max-w-2xl">
    <Button variant="primary" href="/promptify">Promptify</Button>
    <Button variant="secondary" href="/news">AI News</Button>
    <Button variant="secondary" href="/other-button-2">Other Button 2</Button>
  </div>
</div>
