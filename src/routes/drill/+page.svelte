<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';
	import PracticeSession from '$lib/components/PracticeSession.svelte';
	import { api } from '$lib/data';
	import { boardContext, resolveBoard } from '$lib/layouts/board';
	import { settings } from '$lib/settings.svelte';
	import type { SessionResult } from '$lib/typing/engine.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const layout = $derived(
		boardContext(resolveBoard(settings.board, settings.savedBoards)).layout
	);

	// The drill is generated for the layout/board in the URL; if the active
	// board's context differs, re-request with the right ones.
	$effect(() => {
		if (data.layout !== layout || data.board !== settings.board) {
			goto(`${base}/drill?layout=${layout}&board=${encodeURIComponent(settings.board)}`, {
				replaceState: true
			});
		}
	});

	async function saveSession(result: SessionResult) {
		await api.saveSession(fetch, {
			contentId: null,
			kind: 'drill',
			pageIndex: null,
			wpm: result.wpm,
			rawWpm: result.rawWpm,
			accuracy: result.accuracy,
			durationMs: result.durationMs,
			charCount: result.charCount,
			errorCount: result.errorCount,
			layout,
			board: settings.board,
			charTally: [...result.charTally.entries()].map(([char, t]) => ({ char, ...t })),
			title: 'Drill'
		});
	}
</script>

<div class="mb-6">
	<h1 class="text-2xl font-bold">Drill</h1>
	<p class="mt-1 text-sm text-zinc-500">
		{#if data.fromHistory}
			Targeting your weakest keys:
		{:else}
			Not enough history yet — practicing common dev symbols:
		{/if}
		{#each data.weakChars as ch (ch)}
			<code class="mx-0.5 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-emerald-400">{ch}</code>
		{/each}
	</p>
</div>

{#key data.text}
	<PracticeSession text={data.text} mono oncomplete={saveSession}>
		{#snippet completeActions()}
			<button
				onclick={() => invalidateAll()}
				class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
			>
				New drill
			</button>
		{/snippet}
	</PracticeSession>
{/key}
