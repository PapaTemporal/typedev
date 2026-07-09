<script lang="ts">
	import { base } from '$app/paths';
	import type { LibraryItem } from '$lib/data';

	let { item }: { item: LibraryItem } = $props();

	const href = $derived(`${base}/practice/${item.id}?page=${item.resumePage ?? 0}`);
	const difficultyLabel = $derived(['', 'easy', 'medium', 'symbol-heavy'][item.difficulty] ?? '');
</script>

<a
	{href}
	class="block rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-emerald-600"
>
	<div class="flex items-start justify-between gap-2">
		<h3 class="font-medium text-zinc-100">{item.title}</h3>
		{#if item.language}
			<span class="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-emerald-400">
				{item.language}
			</span>
		{/if}
	</div>
	<p class="mt-1 text-sm text-zinc-500">
		{#if item.author}{item.author} · {/if}{item.pageCount}
		{item.pageCount === 1 ? 'page' : 'pages'}
		{#if item.kind === 'code'}
			· {difficultyLabel}{/if}
	</p>
	<p class="mt-2 text-xs">
		{#if item.completed}
			<span class="text-emerald-400">✓ Completed</span>
		{:else if item.resumePage != null && item.resumePage > 0}
			<span class="text-amber-400">Resume at page {item.resumePage + 1}</span>
		{:else}
			<span class="text-zinc-600">Not started</span>
		{/if}
	</p>
</a>
