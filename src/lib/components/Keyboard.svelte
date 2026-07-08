<script lang="ts">
	import {
		boardLayers,
		codeOnLayer,
		findKeyForChar,
		keyHeat,
		type KeyTarget
	} from '$lib/layouts/board';
	import {
		ANSI,
		FINGERS,
		LAYOUTS,
		type KeyboardGeometry,
		type LayoutId,
		type PositionedKey
	} from '$lib/layouts';

	let {
		layoutId,
		geometry = ANSI,
		expectedChar = null,
		showFingers = false,
		heat = null
	}: {
		layoutId: LayoutId;
		geometry?: KeyboardGeometry;
		expectedChar?: string | null;
		showFingers?: boolean;
		/** error rate 0..1 per physical code, for the heatmap overlay */
		heat?: Map<string, number> | null;
	} = $props();

	const U = 44; // px per key unit in SVG space
	const PAD = 8;

	const layout = $derived(LAYOUTS[layoutId]);
	const layers = $derived(boardLayers(geometry));
	const target: KeyTarget | null = $derived(
		expectedChar === null ? null : findKeyForChar(geometry, layoutId, expectedChar)
	);
	/** Legends follow the layer the next character needs. */
	const displayLayer = $derived(target?.layer ?? 0);
	const targetMissing = $derived(expectedChar !== null && target === null);

	const bounds = $derived.by(() => {
		let maxX = 0;
		let maxY = 0;
		let rotated = false;
		for (const k of geometry.keys) {
			maxX = Math.max(maxX, k.x + k.w);
			maxY = Math.max(maxY, k.y + k.h);
			if (k.r !== 0) rotated = true;
		}
		return {
			w: (maxX + (rotated ? 0.8 : 0)) * U + PAD * 2,
			h: (maxY + (rotated ? 0.8 : 0)) * U + PAD * 2
		};
	});

	const FINGER_FILLS: Record<string, string> = {
		'l-pinky': 'fill-rose-500/25',
		'l-ring': 'fill-orange-500/25',
		'l-middle': 'fill-yellow-500/25',
		'l-index': 'fill-lime-500/25',
		thumb: 'fill-zinc-500/25',
		'r-index': 'fill-teal-500/25',
		'r-middle': 'fill-sky-500/25',
		'r-ring': 'fill-violet-500/25',
		'r-pinky': 'fill-fuchsia-500/25'
	};

	const LABELS: Record<string, string> = {
		Backspace: '⌫',
		Tab: 'tab',
		CapsLock: 'caps',
		Enter: '⏎',
		ShiftLeft: 'shift',
		ShiftRight: 'shift',
		Escape: 'esc',
		Space: '',
		ControlLeft: 'ctrl',
		ControlRight: 'ctrl',
		AltLeft: 'alt',
		AltRight: 'alt',
		MetaLeft: 'cmd',
		MetaRight: 'cmd'
	};

	function legend(key: PositionedKey): string {
		const code = codeOnLayer(key, displayLayer);
		if (code === null) {
			if (key.layerToggle !== undefined) return `L${key.layerToggle}`;
			// no binding on this layer: fall back to the (dimmed) base legend
			return key.code ? legendForCode(key.code) : (key.legend ?? '');
		}
		return legendForCode(code);
	}

	function legendForCode(code: string): string {
		if (code in LABELS) return LABELS[code];
		const chars = layout.keys[code];
		if (!chars) return '';
		return /[a-z]/.test(chars.base) ? chars.base.toUpperCase() : chars.base;
	}

	function shiftLegend(key: PositionedKey): string {
		const code = codeOnLayer(key, displayLayer);
		if (!code) return '';
		const chars = layout.keys[code];
		if (!chars || /[a-z]/.test(chars.base)) return '';
		return chars.shift;
	}

	function isDimmed(key: PositionedKey): boolean {
		return displayLayer > 0 && codeOnLayer(key, displayLayer) === null && key.layerToggle === undefined;
	}

	function isTargetKey(index: number, key: PositionedKey): boolean {
		if (target === null) return false;
		if (index === target.keyIndex) return true;
		if (target.shift && (key.code === 'ShiftLeft' || key.code === 'ShiftRight')) return true;
		return false;
	}

	function isToggleKey(index: number): boolean {
		return target !== null && target.toggleIndices.includes(index);
	}

	function keyFill(index: number, key: PositionedKey): string {
		if (isTargetKey(index, key)) return 'fill-emerald-500';
		if (isToggleKey(index)) return 'fill-amber-500';
		if (showFingers && key.code && FINGERS[key.code]) return FINGER_FILLS[FINGERS[key.code]];
		return 'fill-zinc-900';
	}
</script>

<div class="mx-auto w-full max-w-2xl select-none" data-testid="keyboard">
	{#if layers.length > 1}
		<p class="mb-1 text-center text-xs {displayLayer > 0 ? 'text-amber-400' : 'text-zinc-600'}">
			Layer {displayLayer}
			{#if target !== null && target.layer > 0}
				— hold the highlighted layer key
			{/if}
		</p>
	{/if}
	<svg viewBox="0 0 {bounds.w} {bounds.h}" class="w-full" role="img" aria-label="keyboard">
		{#each geometry.keys as key, i (i)}
			{@const heatValue = heat ? keyHeat(key, heat) : 0}
			<g
				data-code={key.code}
				class={isTargetKey(i, key) ? 'is-target' : ''}
				opacity={isDimmed(key) ? 0.35 : 1}
				transform="translate({PAD} {PAD}){key.r !== 0
					? ` rotate(${key.r} ${key.rx * U} ${key.ry * U})`
					: ''}"
			>
				<rect
					x={key.x * U + 2}
					y={key.y * U + 2}
					width={key.w * U - 4}
					height={key.h * U - 4}
					rx="6"
					class="{keyFill(i, key)} {isTargetKey(i, key)
						? 'stroke-emerald-400'
						: isToggleKey(i)
							? 'stroke-amber-400'
							: 'stroke-zinc-800'}"
					stroke-width="1"
				/>
				{#if heatValue > 0}
					<rect
						x={key.x * U + 2}
						y={key.y * U + 2}
						width={key.w * U - 4}
						height={key.h * U - 4}
						rx="6"
						class="pointer-events-none fill-red-500"
						opacity={Math.min(0.75, heatValue * 1.2)}
					/>
				{/if}
				{#if shiftLegend(key)}
					<text
						x={(key.x + key.w / 2) * U}
						y={key.y * U + 14}
						text-anchor="middle"
						class="fill-zinc-600 font-mono text-[9px]"
					>
						{shiftLegend(key)}
					</text>
				{/if}
				<text
					x={(key.x + key.w / 2) * U}
					y={(key.y + key.h / 2) * U + 4}
					text-anchor="middle"
					class="{isTargetKey(i, key) || isToggleKey(i)
						? 'fill-zinc-950'
						: 'fill-zinc-400'} font-mono text-[12px]"
				>
					{legend(key)}
				</text>
			</g>
		{/each}
	</svg>
	{#if targetMissing && expectedChar}
		<p class="mt-1 text-center text-xs text-amber-400">
			next: <code class="rounded bg-zinc-800 px-1.5 font-mono">{expectedChar}</code> — no key for
			this on the current board view
		</p>
	{/if}
</div>
