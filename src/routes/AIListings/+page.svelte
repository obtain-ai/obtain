<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
</script>

<!-- Main container with dark background -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Wrapper that maintains 80% width at all screen sizes -->
	<div class="w-[80%] mx-auto py-16">
		<!-- Header section with title and tagline -->
		<header class="text-center mb-12">
			<!-- Gradient title -->
			<h1 class="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
				Promptpedia
			</h1>
			
			<!-- Tagline -->
			<p class="text-xl text-zinc-300 font-normal">
				Discover the right AI tool for your needs
			</p>
		</header>

		<!-- Informational boxes -->
		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					Why This Matters
				{/snippet}
				{#snippet content()}
					AI tools come in many shapes and sizes, and each is designed for different tasks. Understanding the differences between chatbots, generative AI, and AI agents helps you choose the right tool for your goals whether it's answering questions, creating content, or automating tasks. This knowledge lets you fully utilize AI and get the most effective results.
				{/snippet}
			</InfoDisplay>
		</div>

		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()}
					Instructions
				{/snippet}
				{#snippet content()}
					This section introduces popular AI tools, explains what they do, and highlights their strengths. You can explore examples of chatbots, generative AI, and AI agents, learn what they are best at, and decide which ones fit your needs.
				{/snippet}
			</InfoDisplay>
		</div>

		<!-- AI Types Section -->
		<div class="space-y-6">
			<h2 class="text-2xl font-semibold text-zinc-200 text-center mb-8">Explore AI by Type</h2>

			<!-- CHATBOT -->
			<details class="border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors">💬 Chatbots</summary>
				<p class="mt-4 text-zinc-300 leading-relaxed">
					Chatbots simulate conversation with humans and are best for interactive problem-solving or information retrieval.
					They can answer questions, guide research, or support learning.
				</p>

				<ul class="mt-4 space-y-3">
					<li class="text-zinc-300">
						<strong class="text-zinc-200">ChatGPT</strong> — A conversational AI that can answer questions, tutor, brainstorm, or draft content.<br>
						<em class="text-purple-400">Pros:</em> Great for learning, writing, and general chat.
					</li>
					<li class="text-zinc-300">
						<strong class="text-zinc-200">DeepSeek</strong> — Helps you refine prompts and improve AI output quality.<br>
						<em class="text-purple-400">Pros:</em> Teaches effective communication with AI; ideal for prompt learning.
					</li>
					<li class="text-zinc-300">
						<strong class="text-zinc-200">Claude</strong> — Focuses on safe, ethical, and clear explanations.<br>
						<em class="text-purple-400">Pros:</em> Reliable reasoning and ethical discussions; great for education.
					</li>
					<li class="text-zinc-300">
						<strong class="text-zinc-200">YouChat</strong> — Combines chat with live web search.<br>
						<em class="text-purple-400">Pros:</em> Fast, up-to-date information; perfect for research.
					</li>
				</ul>
			</details>

			<!-- GENERATIVE AI -->
			<details class="border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors">🎨 Generative AI</summary>
				<p class="mt-4 text-zinc-300 leading-relaxed">
					Generative AI creates new content — text, images, music, or video — from your prompts.
					It's ideal for creative projects, idea generation, writing, and design.
				</p>

				<ul class="mt-4 space-y-3">
					<li class="text-zinc-300">
						<strong class="text-zinc-200">DALL·E</strong> — Generates images from text prompts.<br>
						<em class="text-purple-400">Pros:</em> Fast concept visualization and high-quality visuals.
					</li>
					<li class="text-zinc-300">
						<strong class="text-zinc-200">MidJourney</strong> — Creates artistic, stylized images.<br>
						<em class="text-purple-400">Pros:</em> Ideal for professional-looking art and design projects.
					</li>
					<li class="text-zinc-300">
						<strong class="text-zinc-200">Sora</strong> — Turns text prompts into short video clips.<br>
						<em class="text-purple-400">Pros:</em> Professional-quality videos up to 20 seconds; simple to use on smartphones.
					</li>
				</ul>
			</details>

			<!-- AGENT -->
			<details class="border border-zinc-600 rounded-xl p-6 bg-zinc-700 hover:bg-zinc-750 transition-colors">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors">🤖 AI Agents</summary>
				<p class="mt-4 text-zinc-300 leading-relaxed">
					AI agents are autonomous systems that combine tools to perform multi-step tasks automatically.
					They're useful for managing workflows, generating reports, or automating creative and technical work.
				</p>

				<ul class="mt-4 space-y-3">
					<li class="text-zinc-300">
						<strong class="text-zinc-200">AutoGPT</strong> — Plans and completes multi-step tasks independently.<br>
						<em class="text-purple-400">Pros:</em> Automates research, report generation, and complex goals.
					</li>
					<li class="text-zinc-300">
						<strong class="text-zinc-200">AgentGPT</strong> — Builds custom AI agents for productivity and workflow automation.<br>
						<em class="text-purple-400">Pros:</em> Reduces manual coordination; supports multiple tool integrations.
					</li>
					<li class="text-zinc-300">
						<strong class="text-zinc-200">HuggingFace Agents</strong> — Customizable pipelines for AI tasks like translation or summarization.<br>
						<em class="text-purple-400">Pros:</em> Highly flexible and modular; ideal for developers.
					</li>
					<li class="text-zinc-300">
						<strong class="text-zinc-200">Notion AI</strong> — Automates writing, summarizing, and organizing tasks inside Notion.<br>
						<em class="text-purple-400">Pros:</em> Simplifies creative workflows and boosts organization.
					</li>
				</ul>
			</details>
		</div>

		<!-- Footer tip -->
		<div class="text-center text-zinc-400 text-sm mt-12">
			Tip: Choose the right AI tool for your specific task to get the best results.
		</div>
	</div>
</div>
