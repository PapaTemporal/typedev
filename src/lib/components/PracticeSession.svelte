<script lang="ts">
	import Keyboard from "./Keyboard.svelte";
	import SessionComplete from "./SessionComplete.svelte";
	import TypingView from "./TypingView.svelte";
	import { LAYOUTS } from "$lib/layouts";
	import { boardContext, resolveBoard } from "$lib/layouts/board";
	import { heatFromCharStats, type CharStatRow } from "$lib/layouts/heat";
	import { settings } from "$lib/settings.svelte";
	import {
		TypingEngine,
		type SessionResult,
	} from "$lib/typing/engine.svelte";
	import { classifyKey } from "$lib/typing/keys";
	import type { Snippet } from "svelte";

	let {
		text,
		mono = false,
		charStats = [],
		oncomplete,
		completeActions,
	}: {
		text: string;
		mono?: boolean;
		charStats?: CharStatRow[];
		oncomplete?: (result: SessionResult) => void;
		completeActions?: Snippet;
	} = $props();

	// Parents must {#key} this component to switch texts; restart() handles reuse.
	// svelte-ignore state_referenced_locally
	let engine = $state(
		new TypingEngine(text, { mustCorrect: settings.mustCorrect }),
	);

	// The keyboard is shown only when the user wants to see it; next-key
	// highlighting is a separate aid layered on top of the visible keyboard.
	const showKeyboardPanel = $derived(settings.showKeyboard);
	const expectedChar = $derived(
		!settings.showKeyboard ||
			!settings.showNextKey ||
			engine.finished ||
			engine.pos >= engine.typeable.length
			? null
			: engine.text[engine.typeable[engine.pos]],
	);
	const geometry = $derived(
		resolveBoard(settings.board, settings.savedBoards),
	);
	// Layout and input mode are properties of the active board, set in the editor.
	const context = $derived(boardContext(geometry));
	const heat = $derived(
		settings.showHeatmap
			? heatFromCharStats(charStats, context.layout, settings.board)
			: null,
	);

	$effect(() => {
		if (engine.startedAt !== null && !engine.finished) {
			const id = setInterval(() => engine.tick(), 250);
			return () => clearInterval(id);
		}
	});

	$effect(() => {
		if (engine.finished) oncomplete?.(engine.result());
	});

	function restart() {
		engine = new TypingEngine(text, { mustCorrect: settings.mustCorrect });
	}

	function onkeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		if (
			target &&
			(target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable)
		) {
			return;
		}
		// 'direct': the board's keycodes are the truth — map event.code through the
		// board's layout. 'translated': the OS applies the layout — match event.key.
		const action = classifyKey(
			e,
			context.inputMode === "direct"
				? LAYOUTS[context.layout]
				: undefined,
		);
		switch (action.kind) {
			case "char":
				e.preventDefault();
				engine.input(action.char);
				break;
			case "backspace":
				e.preventDefault();
				engine.backspace();
				break;
			case "restart":
				e.preventDefault();
				restart();
				break;
			case "trap":
				e.preventDefault();
				break;
		}
	}
</script>

<!-- Only typing resumes the clock; blur and idleness (see engine.tick) pause it. -->
<svelte:window {onkeydown} onblur={() => engine.pause()} />

<div class="mb-6 flex items-center gap-6 font-mono text-sm text-zinc-400">
	<span>WPM <span class="text-zinc-100">{Math.round(engine.wpm)}</span></span>
	<span
		>Accuracy <span class="text-zinc-100"
			>{engine.accuracy.toFixed(1)}%</span
		></span
	>
	<span
		>Progress <span class="text-zinc-100"
			>{Math.round(engine.progress * 100)}%</span
		></span
	>
	{#if engine.pausedAt !== null && !engine.finished}
		<span
			class="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400"
		>
			paused — type to continue
		</span>
	{/if}
</div>

{#if engine.finished}
	<SessionComplete result={engine.result()} onrestart={restart}>
		{#if completeActions}{@render completeActions()}{/if}
	</SessionComplete>
{:else}
	<TypingView {engine} {mono} />
	{#if showKeyboardPanel}
		<div class="mt-8">
			<Keyboard
				layoutId={context.layout}
				{geometry}
				{expectedChar}
				showFingers={settings.showFingers}
				{heat}
			/>
		</div>
	{/if}
	<p class="mt-8 text-xs text-zinc-600">
		Just start typing. Backspace fixes mistakes · Esc restarts
	</p>
{/if}
