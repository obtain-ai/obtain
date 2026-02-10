<script lang="ts">
	import { auth } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import InfoDisplay from '$lib/ui/InfoDisplay.svelte';

	let mode: 'login' | 'signup' = 'login';
	let username = '';
	let displayName = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let isSubmitting = false;

	async function handleSubmit() {
		error = '';
		isSubmitting = true;

		try {
			if (mode === 'signup') {
				if (password !== confirmPassword) {
					error = 'Passwords do not match';
					isSubmitting = false;
					return;
				}

				if (!displayName.trim()) {
					error = 'Display name is required';
					isSubmitting = false;
					return;
				}

				const result = await auth.signup(username.trim(), displayName.trim(), password);
				if (result.success) {
					goto('/');
				} else {
					error = result.error || 'Signup failed';
				}
			} else {
				const result = await auth.login(username.trim(), password);
				if (result.success) {
					goto('/');
				} else {
					error = result.error || 'Login failed';
				}
			}
		} catch {
			error = 'Something went wrong. Please try again.';
		}

		isSubmitting = false;
	}

	function toggleMode() {
		mode = mode === 'login' ? 'signup' : 'login';
		error = '';
		password = '';
		confirmPassword = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Log In' : 'Sign Up'} - ObtAIn</title>
</svelte:head>

<div class="min-h-screen bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 w-full">
	<div class="w-[80%] max-w-md mx-auto py-16">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent leading-normal pb-1">
				{mode === 'login' ? 'Welcome Back' : 'Join ObtAIn'}
			</h1>
			<p class="text-lg text-zinc-600 dark:text-zinc-300 font-normal">
				{mode === 'login' ? 'Log in to access your saved sessions' : 'Create an account to save your progress'}
			</p>
		</div>

		<!-- Form Card -->
		<div class="bg-white dark:bg-zinc-700 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-600 p-8">
			<!-- Error message -->
			{#if error}
				<div class="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
					{error}
				</div>
			{/if}

			<div class="space-y-5">
				<!-- Username -->
				<div>
					<label for="username" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
						Username
					</label>
					<input
						id="username"
						type="text"
						bind:value={username}
						on:keydown={handleKeydown}
						class="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500"
						placeholder="Enter your username"
					/>
				</div>

				<!-- Display Name (signup only) -->
				{#if mode === 'signup'}
					<div>
						<label for="displayName" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
							Display Name
						</label>
						<input
							id="displayName"
							type="text"
							bind:value={displayName}
							on:keydown={handleKeydown}
							class="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500"
							placeholder="How should we call you?"
						/>
					</div>
				{/if}

				<!-- Password -->
				<div>
					<label for="password" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
						Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						on:keydown={handleKeydown}
						class="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500"
						placeholder="Enter your password"
					/>
				</div>

				<!-- Confirm Password (signup only) -->
				{#if mode === 'signup'}
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							on:keydown={handleKeydown}
							class="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500"
							placeholder="Confirm your password"
						/>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					on:click={handleSubmit}
					disabled={isSubmitting || !username.trim() || !password}
					class="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
				>
					{mode === 'login' ? 'Log In' : 'Create Account'}
				</button>
			</div>

			<!-- Toggle mode -->
			<div class="mt-6 text-center">
				<p class="text-sm text-zinc-600 dark:text-zinc-400">
					{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
					<button
						on:click={toggleMode}
						class="ml-1 font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
					>
						{mode === 'login' ? 'Sign Up' : 'Log In'}
					</button>
				</p>
			</div>
		</div>

		<!-- Info -->
		<div class="mt-8">
			<InfoDisplay>
				{#snippet title()}
					Why create an account?
				{/snippet}
				{#snippet content()}
					With an account, you can save your Promptagonist story adventures and Promptify sessions to revisit them later. Your progress is stored locally on this device.
				{/snippet}
			</InfoDisplay>
		</div>
	</div>
</div>
