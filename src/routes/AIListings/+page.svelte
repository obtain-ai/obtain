<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
</script>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Outer 80% wrapper -->
	<div class="w-[80%] mx-auto py-16">
		<!-- Header section with title and tagline -->
		<header class="text-center mb-12">
			<h1 class="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
				Promptpedia
			</h1>
			<p class="text-xl text-zinc-300 font-normal">
				Discover the right AI tool for your needs
			</p>
		</header>

		<!-- Inner 80% wrapper (-> 64% total width) -->
		<div class="w-[80%] mx-auto">
			<!-- Informational boxes -->
			<div class="mb-8">
				<InfoDisplay>
					{#snippet title()} Why This Matters {/snippet}
					{#snippet content()}
						AI tools come in many shapes and sizes, and each is designed for different tasks. Understanding the differences between chatbots, generative AI, and AI agents helps you choose the right tool for your goals whether it's answering questions, creating content, or automating tasks. This knowledge lets you fully utilize AI and get the most effective results.
					{/snippet}
				</InfoDisplay>
			</div>

			<div class="mb-8">
				<InfoDisplay>
					{#snippet title()} Instructions {/snippet}
					{#snippet content()}
						This section introduces popular AI tools, explains what they do, and highlights their strengths. You can explore examples of chatbots, generative AI, and AI agents, learn what they are best at, and decide which ones fit your needs.
					{/snippet}
				</InfoDisplay>
			</div>

			<!-- AI Types Section -->
			<div class="space-y-6">
				<h2 class="text-2xl font-semibold text-zinc-200 text-center mb-8">Explore AI by Type</h2>

				<!-- CHATBOTS -->
				<details class="w-full border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
					<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors"> Chatbots</summary>
					<p class="mt-4 text-zinc-300 leading-relaxed">
						Chatbots simulate conversation with humans and are best for interactive problem‑solving or information retrieval.
					</p>
					<ul class="mt-4 space-y-3">
						<li class="text-zinc-300"><strong class="text-zinc-200">ChatGPT</strong> — Q&A, tutoring, brainstorming, drafting.</li>
						<li class="text-zinc-300"><strong class="text-zinc-200">DeepSeek</strong> — Prompt refinement; better outputs.</li>
						<li class="text-zinc-300"><strong class="text-zinc-200">Claude</strong> — Clear, safe explanations.</li>
						<li class="text-zinc-300"><strong class="text-zinc-200">YouChat</strong> — Chat + live web search.</li>
					</ul>
				</details>

				<!-- GENERATIVE AI -->
				<details class="w-full border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
					<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors"> Generative AI</summary>
					<p class="mt-4 text-zinc-300 leading-relaxed">
						Creates new content — text, images, music, or video — from prompts.
					</p>
					<ul class="mt-4 space-y-3">
						<li class="text-zinc-300"><strong class="text-zinc-200">DALL·E</strong> — Images from text.</li>
						<li class="text-zinc-300"><strong class="text-zinc-200">MidJourney</strong> — Stylized images.</li>
						<li class="text-zinc-300"><strong class="text-zinc-200">Sora</strong> — Short videos from text.</li>
					</ul>
				</details>

				<!-- AI AGENTS -->
				<details class="w-full border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
					<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors"> AI Agents</summary>
					<p class="mt-4 text-zinc-300 leading-relaxed">
						Autonomous systems that combine tools to perform multi‑step tasks.
					</p>
					<ul class="mt-4 space-y-3">
						<li class="text-zinc-300"><strong class="text-zinc-200">AutoGPT</strong> — Plans and executes tasks.</li>
						<li class="text-zinc-300"><strong class="text-zinc-200">AgentGPT</strong> — Build custom agents.</li>
						<li class="text-zinc-300"><strong class="text-zinc-200">HuggingFace Agents</strong> — Modular pipelines.</li>
						<li class="text-zinc-300"><strong class="text-zinc-200">Notion AI</strong> — Writing and organization inside Notion.</li>
					</ul>
				</details>
			</div>

			<!-- Footer tip -->
			<div class="text-center text-zinc-400 text-sm mt-12">
				Tip: Choose the right AI tool for your specific task to get the best results.
			</div>
		</div>
	</div>
</div>
