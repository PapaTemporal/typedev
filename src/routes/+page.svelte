<script lang="ts">
	import ContentCard from '$lib/components/ContentCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const books = $derived(data.library.filter((i) => i.kind === 'book'));
	const code = $derived(data.library.filter((i) => i.kind === 'code'));
	const custom = $derived(data.library.filter((i) => i.kind === 'custom'));
	const codeByDifficulty = $derived(
		[1, 2, 3]
			.map((d) => ({ difficulty: d, items: code.filter((i) => i.difficulty === d) }))
			.filter((g) => g.items.length > 0)
	);
	const difficultyHeading: Record<number, string> = {
		1: 'Code — getting comfortable',
		2: 'Code — intermediate',
		3: 'Code — symbol-heavy'
	};
</script>

<h1 class="mb-8 text-2xl font-bold">Library</h1>

{#each codeByDifficulty as group (group.difficulty)}
	<section class="mb-10">
		<h2 class="mb-4 text-lg font-semibold text-zinc-300">
			{difficultyHeading[group.difficulty]}
		</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each group.items as item (item.id)}
				<ContentCard {item} />
			{/each}
		</div>
	</section>
{/each}

{#if books.length > 0}
	<section class="mb-10">
		<h2 class="mb-4 text-lg font-semibold text-zinc-300">Books</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each books as item (item.id)}
				<ContentCard {item} />
			{/each}
		</div>
	</section>
{/if}

{#if custom.length > 0}
	<section class="mb-10">
		<h2 class="mb-4 text-lg font-semibold text-zinc-300">Imported</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each custom as item (item.id)}
				<ContentCard {item} />
			{/each}
		</div>
	</section>
{/if}

{#if data.library.length === 0}
	<p class="text-zinc-500">Library is empty — run <code class="font-mono">pnpm seed</code>.</p>
{/if}
