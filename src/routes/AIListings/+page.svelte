<script lang="ts">
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';
</script>

<svelte:head>
  <title>Promptpedia</title>
  <meta property="og:title" content="Promptpedia" />
</svelte:head>

<!-- Main container -->
<div class="min-h-screen bg-zinc-800 text-zinc-200 w-full">
	<!-- Outer 80% wrapper -->
	<div class="w-[80%] mx-auto py-16">
		<header class="text-center mb-12">
			<h1 class="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
				AI Listings
			</h1>
			<p class="text-xl text-zinc-300 font-normal">Discover the right AI tool for your needs</p>
		</header>

		<div class="mb-8">
			<InfoDisplay>
				{#snippet title()} Why This Matters {/snippet}
				{#snippet content()}
					AI tools come in many shapes and sizes, and each is designed for different tasks. Understanding the differences between chatbots, generative AI, and AI agents helps you choose the right tool for your goals whether it's answering questions, creating content, or automating tasks. This knowledge lets you fully utilize AI and get the most effective results.
				{/snippet}
			</InfoDisplay>
		</div>

		<h2 class="text-2xl font-semibold text-zinc-200 text-center mb-8">Explore AI by Type</h2>

		<!-- Inner 80% wrapper (=> 64% total width) -->
		<div class="w-[80%] mx-auto">
			<!-- CHATBOTS -->
			<details class="mb-4">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors list-none flex items-start gap-3">
					<span class="transform transition-transform duration-200 details-open:rotate-90">▶</span>
					<div>
						<p class="text-lg font-bold mb-2">CHATBOT:</p>
						<p class="text-base font-normal">Why this matters: Chatbots are AI systems designed to simulate conversation with humans. They can answer questions, provide guidance, or help with tasks like research, learning, or customer support. Chatbots are best for interactive problem-solving or information retrieval.</p>
					</div>
				</summary>
				<div class="mt-4 space-y-4 text-zinc-300">
					<p class="leading-relaxed">
						Chatbots are AI systems designed to simulate conversation with humans. They can answer questions, provide guidance, or help with tasks like research, learning, or customer support. Chatbots are best for interactive problem-solving or information retrieval.
					</p>
					<p class="leading-relaxed">
						Explore different chatbots, see what they're best at, and discover which one suits your needs. This tool highlights their strengths, so you can pick the right chatbot for learning, productivity, or problem-solving.
					</p>
					
					<div class="space-y-4 mt-6">
						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://chat.openai.com" target="_blank" rel="noopener noreferrer">ChatGPT</a>
							</h3>
							<p class="mb-2">A conversational AI that can answer questions, generate text, tutor, and brainstorm ideas. It adapts to your prompts and can assist with a wide range of topics.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Great for learning and research</li>
								<li>Can draft essays, stories, or scripts</li>
								<li>Easy to use for beginners</li>
							</ul>
						</div>

						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://chat.deepseek.com" target="_blank" rel="noopener noreferrer">DeepSeek</a>
							</h3>
							<p class="mb-2">Specializes in helping users refine prompts and get more accurate, useful AI responses. It's focused on teaching effective communication with AI.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Improves AI output quality</li>
								<li>Helps users learn how to write effective prompts</li>
								<li>Encourages efficient AI interaction</li>
							</ul>
						</div>

						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://claude.ai" target="_blank" rel="noopener noreferrer">Claude</a>
							</h3>
							<p class="mb-2">A chatbot focused on safe and responsible conversations, ideal for explanations, reasoning, and ethical guidance.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Provides clear and careful responses</li>
								<li>Emphasizes safety and ethics</li>
								<li>Great for educational purposes</li>
							</ul>
						</div>

						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://you.com" target="_blank" rel="noopener noreferrer">YouChat</a>
							</h3>
							<p class="mb-2">Combines conversational AI with live search results, providing answers that include up-to-date information.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Accesses current information quickly</li>
								<li>Interactive learning tool</li>
								<li>Combines search and AI reasoning</li>
							</ul>
						</div>
					</div>
				</div>
			</details>

			<hr class="my-10 border-zinc-700/70">

			<!-- GENERATIVE AI -->
			<details class="mb-4">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors list-none flex items-start gap-3">
					<span class="transform transition-transform duration-200 details-open:rotate-90">▶</span>
					<div>
						<p class="text-lg font-bold mb-2">Generative AI:</p>
						<p class="text-base font-normal">Why this matters: Generative AI creates new content based on prompts you give it including text, images, music, or code. It's useful for creative projects, idea generation, writing, and visual design.</p>
					</div>
				</summary>
				<div class="mt-4 space-y-4 text-zinc-300">
					<p class="leading-relaxed">
						Generative AI creates new content based on prompts you give it including text, images, music, or code. It's useful for creative projects, idea generation, writing, and visual design.
					</p>
					<p class="leading-relaxed">
						See the most popular generative AI tools and learn what they're best at. This section helps you choose the right AI to create content, explore ideas, or bring your imagination to life.
					</p>
					
					<div class="space-y-4 mt-6">
						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://openai.com/dall-e-3" target="_blank" rel="noopener noreferrer">DALL·E</a>
							</h3>
							<p class="mb-2">Generates images from text prompts, turning ideas into visual art.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Great for creativity and design</li>
								<li>Produces high-quality visuals</li>
								<li>Fast concept visualization</li>
							</ul>
						</div>

						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://www.midjourney.com" target="_blank" rel="noopener noreferrer">MidJourney</a>
							</h3>
							<p class="mb-2">Focused on artistic image generation, producing detailed and stylized visuals from prompts.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Ideal for artistic projects</li>
								<li>Produces professional-looking results</li>
								<li>Supports creative experimentation</li>
							</ul>
						</div>

						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://openai.com/sora" target="_blank" rel="noopener noreferrer">Sora</a>
							</h3>
							<p class="mb-2">Sora converts text prompts or images into video clips, offering users the ability to generate videos up to 20 seconds long.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Generate professional-quality videos swiftly</li>
								<li>Utilize tools to personalize videos</li>
								<li>Enables video generation directly on smartphones</li>
							</ul>
						</div>
					</div>
				</div>
			</details>

			<hr class="my-10 border-zinc-700/70">

			<!-- AI AGENTS -->
			<details class="mb-4">
				<summary class="text-xl font-bold cursor-pointer text-zinc-200 hover:text-purple-400 transition-colors list-none flex items-start gap-3">
					<span class="transform transition-transform duration-200 details-open:rotate-90">▶</span>
					<div>
						<p class="text-lg font-bold mb-2">Agent:</p>
						<p class="text-base font-normal">Why this matters: AI agents are autonomous systems that can perform tasks for you, often combining multiple steps or tools. They can handle complex workflows, research topics, summarize information, generate content, or even write code so you don't need to know everything, just the basics. This makes them ideal for boosting productivity, learning, or creative projects.</p>
					</div>
				</summary>
				<div class="mt-4 space-y-4 text-zinc-300">
					<p class="leading-relaxed">
						AI agents are autonomous systems that can perform tasks for you, often combining multiple steps or tools. They can handle complex workflows, research topics, summarize information, generate content, or even write code so you don't need to know everything, just the basics. This makes them ideal for boosting productivity, learning, or creative projects.
					</p>
					<p class="leading-relaxed">
						Discover AI agents that can work for you automatically. This section shows you which agents excel at productivity, research, or task automation so you can pick the right one to simplify your work.
					</p>
					
					<div class="space-y-4 mt-6">
						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://claude.ai" target="_blank" rel="noopener noreferrer">Claude</a>
							</h3>
							<p class="mb-2">An advanced AI model by Anthropic designed for natural conversation, analysis, and creative or technical writing. Known for its strong reasoning, long context window, and safety alignment.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Excellent at understanding nuanced instructions</li>
								<li>Great for writing, summarizing, and analysis</li>
								<li>Handles large documents and long conversations effectively</li>
							</ul>
						</div>

						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://cursor.sh" target="_blank" rel="noopener noreferrer">Cursor</a>
							</h3>
							<p class="mb-2">An AI-powered code editor that integrates models like GPT and Claude to provide intelligent autocompletion, debugging, and documentation generation directly in your coding workspace.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Streamlines coding and debugging</li>
								<li>Improves productivity for developers</li>
								<li>Integrates seamlessly with GitHub and existing projects</li>
							</ul>
						</div>

						<div class="border-l-4 border-purple-500 pl-4">
							<h3 class="text-lg font-bold text-zinc-200 mb-2">
								<a class="text-purple-400 hover:text-purple-300 underline" href="https://www.perplexity.ai" target="_blank" rel="noopener noreferrer">Perplexity</a>
							</h3>
							<p class="mb-2">An AI search and research assistant that combines conversational AI with real-time web access to provide accurate, sourced answers and summaries.</p>
							<p class="font-semibold text-zinc-200">Pros:</p>
							<ul class="list-disc list-inside ml-2 space-y-1">
								<li>Provides up-to-date, cited information</li>
								<li>Great for research and fact-checking</li>
								<li>Fast, intuitive, and easy to use</li>
							</ul>
						</div>
					</div>
				</div>
			</details>

			<hr class="my-10 border-zinc-700/70">

			<div class="text-center text-zinc-400 text-sm mt-12">
				Tip: Choose the right AI tool for your specific task to get the best results.
			</div>
		</div>
	</div>
</div>
