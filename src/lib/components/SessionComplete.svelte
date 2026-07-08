<script lang="ts">
	import type { SessionResult } from '$lib/typing/engine.svelte';
	import type { Snippet } from 'svelte';

	let {
		result,
		onrestart,
		children
	}: { result: SessionResult; onrestart: () => void; children?: Snippet } = $props();

	const stats = $derived([
		{ label: 'WPM', value: Math.round(result.wpm).toString() },
		{ label: 'Raw WPM', value: Math.round(result.rawWpm).toString() },
		{ label: 'Accuracy', value: `${result.accuracy.toFixed(1)}%` },
		{ label: 'Time', value: `${(result.durationMs / 1000).toFixed(1)}s` },
		{ label: 'Errors', value: result.errorCount.toString() }
	]);
</script>

<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
	<h2 class="mb-6 text-xl font-bold text-emerald-400">Complete!</h2>
	<div class="mb-8 flex justify-center gap-10">
		{#each stats as stat (stat.label)}
			<div>
				<div class="text-3xl font-bold text-zinc-100">{stat.value}</div>
				<div class="mt-1 text-xs tracking-wide text-zinc-500 uppercase">{stat.label}</div>
			</div>
		{/each}
	</div>
	<div class="flex justify-center gap-4">
		<button
			onclick={onrestart}
			class="rounded-md border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
		>
			Try again <span class="text-zinc-500">(Esc)</span>
		</button>
		{#if children}{@render children()}{/if}
	</div>
</div>
