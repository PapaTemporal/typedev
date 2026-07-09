<script lang="ts">
	import { base } from '$app/paths';
	import PracticeSession from '$lib/components/PracticeSession.svelte';
	import { api } from '$lib/data';
	import { boardContext, resolveBoard } from '$lib/layouts/board';
	import { settings } from '$lib/settings.svelte';
	import type { SessionResult } from '$lib/typing/engine.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const isLastPage = $derived(data.pageIndex + 1 >= data.content.pageCount);
	const nextHref = $derived(`${base}/practice/${data.content.id}?page=${data.pageIndex + 1}`);
	const layout = $derived(
		boardContext(resolveBoard(settings.board, settings.savedBoards)).layout
	);

	async function saveSession(result: SessionResult) {
		await api.saveSession(fetch, {
			contentId: data.content.id,
			kind: data.content.kind,
			pageIndex: data.pageIndex,
			wpm: result.wpm,
			rawWpm: result.rawWpm,
			accuracy: result.accuracy,
			durationMs: result.durationMs,
			charCount: result.charCount,
			errorCount: result.errorCount,
			layout,
			board: settings.board,
			charTally: [...result.charTally.entries()].map(([char, t]) => ({ char, ...t })),
			pageCount: data.content.pageCount,
			title: data.content.title
		});
	}
</script>

<div class="mb-6">
	<h1 class="text-2xl font-bold">{data.content.title}</h1>
	<p class="mt-1 text-sm text-zinc-500">
		{#if data.content.author}{data.content.author} · {/if}
		Page {data.pageIndex + 1} of {data.content.pageCount}
		{#if data.content.source}
			· <a href={data.content.source} class="underline hover:text-zinc-300" target="_blank">
				source
			</a>
		{/if}
	</p>
</div>

{#key `${data.content.id}:${data.pageIndex}`}
	<PracticeSession
		text={data.pageText}
		mono={data.content.kind !== 'book'}
		charStats={data.charStats}
		oncomplete={saveSession}
	>
		{#snippet completeActions()}
			{#if !isLastPage}
				<a
					href={nextHref}
					class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
				>
					Next page →
				</a>
			{:else}
				<a
					href="{base}/"
					class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
				>
					Finished! Back to library
				</a>
			{/if}
		{/snippet}
	</PracticeSession>
{/key}
