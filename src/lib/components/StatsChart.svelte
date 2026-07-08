<script lang="ts">
	import type { DashboardSession } from '$lib/server/stats';

	let { sessions }: { sessions: DashboardSession[] } = $props();

	const W = 640;
	const H = 220;
	const PAD = { top: 12, right: 12, bottom: 24, left: 40 };

	const maxWpm = $derived(Math.max(40, ...sessions.map((s) => s.wpm)) * 1.1);
	const innerW = W - PAD.left - PAD.right;
	const innerH = H - PAD.top - PAD.bottom;

	const points = $derived(
		sessions.map((s, i) => ({
			x: PAD.left + (sessions.length === 1 ? innerW / 2 : (i / (sessions.length - 1)) * innerW),
			y: PAD.top + innerH - (s.wpm / maxWpm) * innerH,
			session: s
		}))
	);
	const polyline = $derived(points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));

	const gridLines = $derived(
		[0.25, 0.5, 0.75, 1].map((f) => ({
			y: PAD.top + innerH - f * innerH,
			label: Math.round(f * maxWpm)
		}))
	);
</script>

{#if sessions.length === 0}
	<p class="text-sm text-zinc-500">No sessions yet — complete a page to see your progress.</p>
{:else}
	<svg viewBox="0 0 {W} {H}" class="w-full" role="img" aria-label="WPM over time">
		{#each gridLines as line (line.label)}
			<line
				x1={PAD.left}
				x2={W - PAD.right}
				y1={line.y}
				y2={line.y}
				class="stroke-zinc-800"
				stroke-dasharray="3 4"
			/>
			<text x={PAD.left - 8} y={line.y + 4} text-anchor="end" class="fill-zinc-500 text-[10px]">
				{line.label}
			</text>
		{/each}
		{#if points.length > 1}
			<polyline
				points={polyline}
				fill="none"
				class="stroke-emerald-500"
				stroke-width="2"
				stroke-linejoin="round"
			/>
		{/if}
		{#each points as p (p.session.id)}
			<circle cx={p.x} cy={p.y} r="3.5" class="fill-emerald-400">
				<title>
					{Math.round(p.session.wpm)} wpm · {p.session.accuracy.toFixed(1)}% · {p.session.title ??
						p.session.kind}
				</title>
			</circle>
		{/each}
		<text x={PAD.left} y={H - 6} class="fill-zinc-600 text-[10px]">older</text>
		<text x={W - PAD.right} y={H - 6} text-anchor="end" class="fill-zinc-600 text-[10px]">
			recent
		</text>
	</svg>
{/if}
