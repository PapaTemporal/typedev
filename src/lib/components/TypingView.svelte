<script lang="ts">
	import { CORRECT, WRONG, type TypingEngine } from '$lib/typing/engine.svelte';

	let { engine, mono = false }: { engine: TypingEngine; mono?: boolean } = $props();

	const caretIdx = $derived(
		engine.finished || engine.pos >= engine.typeable.length ? -1 : engine.typeable[engine.pos]
	);

	function charClass(i: number, ch: string): string {
		const status = engine.status[i];
		let cls = '';
		if (status === CORRECT) cls = 'text-zinc-100';
		else if (status === WRONG)
			cls = ch === ' ' || ch === '\n' ? 'bg-red-500/40 text-red-300' : 'text-red-400 underline';
		else cls = 'text-zinc-500';
		if (i === caretIdx) cls += ' rounded-sm bg-emerald-400/25 text-zinc-100';
		return cls;
	}
</script>

<div
	class="text-lg leading-relaxed whitespace-pre-wrap select-none {mono
		? 'font-mono text-base'
		: ''}"
>
	{#each engine.text as ch, i (i)}
		{#if ch === '\n'}
			<span class={charClass(i, ch)}>{i === caretIdx || engine.status[i] === WRONG ? '⏎' : ''}</span
			>{'\n'}
		{:else}
			<span class={charClass(i, ch)}>{ch}</span>
		{/if}
	{/each}
</div>
