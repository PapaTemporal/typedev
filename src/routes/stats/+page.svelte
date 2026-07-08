<script lang="ts">
	import StatsChart from '$lib/components/StatsChart.svelte';
	import { boardDisplayName } from '$lib/layouts/board';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Kind = 'all' | 'book' | 'code' | 'custom' | 'drill';
	let filter = $state<Kind>('all');
	let boardFilter = $state('all');
	const kinds: Kind[] = ['all', 'book', 'code', 'custom', 'drill'];

	const boards = $derived(['all', ...new Set(data.sessions.map((s) => s.board))]);

	const filtered = $derived(
		data.sessions
			.filter((s) => filter === 'all' || s.kind === filter)
			.filter((s) => boardFilter === 'all' || s.board === boardFilter)
	);

	const totals = $derived.by(() => {
		const n = filtered.length;
		if (n === 0) return null;
		return {
			sessions: n,
			minutes: filtered.reduce((a, s) => a + s.durationMs, 0) / 60000,
			bestWpm: Math.max(...filtered.map((s) => s.wpm)),
			avgWpm: filtered.reduce((a, s) => a + s.wpm, 0) / n,
			avgAccuracy: filtered.reduce((a, s) => a + s.accuracy, 0) / n
		};
	});

	const recent = $derived(filtered.slice(-10).reverse());

	function fmtWhen(ts: number): string {
		return new Date(ts).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-2">
	<h1 class="text-2xl font-bold">Stats</h1>
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex gap-1">
			{#each kinds as kind (kind)}
				<button
					onclick={() => (filter = kind)}
					class="rounded-md px-3 py-1 text-sm capitalize transition-colors {filter === kind
						? 'bg-emerald-600 text-white'
						: 'text-zinc-400 hover:bg-zinc-800'}"
				>
					{kind}
				</button>
			{/each}
		</div>
		{#if boards.length > 2}
			<div class="flex gap-1 border-l border-zinc-800 pl-3">
				{#each boards as board (board)}
					<button
						onclick={() => (boardFilter = board)}
						class="rounded-md px-3 py-1 text-sm transition-colors {boardFilter === board
							? 'bg-sky-600 text-white'
							: 'text-zinc-400 hover:bg-zinc-800'}"
					>
						{board === 'all' ? 'All boards' : boardDisplayName(board)}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if totals}
	<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
		{#each [['Sessions', totals.sessions.toString()], ['Time typed', `${totals.minutes.toFixed(1)}m`], ['Best WPM', Math.round(totals.bestWpm).toString()], ['Avg WPM', Math.round(totals.avgWpm).toString()], ['Avg accuracy', `${totals.avgAccuracy.toFixed(1)}%`]] as [label, value] (label)}
			<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
				<div class="text-2xl font-bold text-zinc-100">{value}</div>
				<div class="mt-1 text-xs tracking-wide text-zinc-500 uppercase">{label}</div>
			</div>
		{/each}
	</div>
{/if}

<div class="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
	<h2 class="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">WPM over time</h2>
	<StatsChart sessions={filtered} />
</div>

{#if recent.length > 0}
	<h2 class="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">Recent sessions</h2>
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
				<th class="py-2 pr-4 font-medium">When</th>
				<th class="py-2 pr-4 font-medium">What</th>
				<th class="py-2 pr-4 text-right font-medium">WPM</th>
				<th class="py-2 text-right font-medium">Accuracy</th>
			</tr>
		</thead>
		<tbody>
			{#each recent as s (s.id)}
				<tr class="border-b border-zinc-900">
					<td class="py-2 pr-4 text-zinc-400">{fmtWhen(s.completedAt)}</td>
					<td class="py-2 pr-4">{s.title ?? s.kind}</td>
					<td class="py-2 pr-4 text-right font-mono">{Math.round(s.wpm)}</td>
					<td class="py-2 text-right font-mono">{s.accuracy.toFixed(1)}%</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
