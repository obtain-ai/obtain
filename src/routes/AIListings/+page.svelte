<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
</script>

<!-- Main container -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Outer 80% wrapper -->
	<div class="w-[80%] mx-auto py-16">
		<header class="text-center mb-12">
			<h1 class="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
				Promptpedia
			</h1>
			<p class="text-xl text-zinc-300 font-normal">Discover the right AI tool for your needs</p>
		</header>

		<!-- Inner 80% wrapper (=> 64% total width) -->
		<div class="w-[80%] mx-auto">
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

			<h2 class="text-2xl font-semibold text-zinc-200 text-center mb-8">Explore AI by Type</h2>

			<!-- CHATBOTS -->
			<details class="w-full border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors">💬 Chatbots</summary>
				<p class="mt-4 text-zinc-300 leading-relaxed">
					Chatbots simulate conversation and are best for interactive problem‑solving or information retrieval.
				</p>
				<ul class="mt-4 space-y-3 text-zinc-300">
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://chat.openai.com" target="_blank" rel="noopener noreferrer">ChatGPT</a>
						</strong> — Q&A, tutoring, brainstorming, drafting.
					</li>
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://chat.deepseek.com" target="_blank" rel="noopener noreferrer">DeepSeek</a>
						</strong> — Prompt refinement; better outputs.
					</li>
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://claude.ai" target="_blank" rel="noopener noreferrer">Claude</a>
						</strong> — Clear, safe explanations.
					</li>
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://you.com" target="_blank" rel="noopener noreferrer">YouChat</a>
						</strong> — Chat + live web search.
					</li>
				</ul>
			</details>

			<!-- GENERATIVE AI -->
			<details class="w-full border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors">🎨 Generative AI</summary>
				<p class="mt-4 text-zinc-300 leading-relaxed">
					Creates new content — text, images, music, or video — from prompts.
				</p>
				<ul class="mt-4 space-y-3 text-zinc-300">
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://openai.com/dall-e-3" target="_blank" rel="noopener noreferrer">DALL·E</a>
						</strong> — Images from text.
					</li>
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://www.midjourney.com" target="_blank" rel="noopener noreferrer">MidJourney</a>
						</strong> — Stylized images.
					</li>
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://openai.com/sora" target="_blank" rel="noopener noreferrer">Sora</a>
						</strong> — Short videos from text.
					</li>
				</ul>
			</details>

			<!-- AI AGENTS -->
			<details class="w-full border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors">🤖 AI Agents</summary>
				<p class="mt-4 text-zinc-300 leading-relaxed">
					Autonomous systems that combine tools to perform multi‑step tasks.
				</p>
				<ul class="mt-4 space-y-3 text-zinc-300">
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://autogpt.net" target="_blank" rel="noopener noreferrer">AutoGPT</a>
						</strong> — Plans and executes tasks.
					</li>
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://agentgpt.reworkd.ai" target="_blank" rel="noopener noreferrer">AgentGPT</a>
						</strong> — Build custom agents.
					</li>
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://huggingface.co/docs/transformers/agents" target="_blank" rel="noopener noreferrer">Hugging Face Agents</a>
						</strong> — Modular pipelines.
					</li>
					<li>
						<strong class="text-zinc-200">
							<a class="text-purple-400 hover:text-purple-300 underline" href="https://www.notion.so/product/ai" target="_blank" rel="noopener noreferrer">Notion AI</a>
						</strong> — Writing and organization inside Notion.
					</li>
				</ul>
			</details>

			<div class="text-center text-zinc-400 text-sm mt-12">
				Tip: Choose the right AI tool for your specific task to get the best results.
			</div>
		</div>
	</div>
</div>
