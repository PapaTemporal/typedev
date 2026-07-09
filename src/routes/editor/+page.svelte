<script lang="ts">
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import {
		boardLayers,
		codeOnLayer,
		serializeBoard,
	} from "$lib/layouts/board";
	import {
		GEOMETRIES,
		LAYOUTS,
		type KeyboardGeometry,
		type LayoutId,
		type PositionedKey,
	} from "$lib/layouts";
	import { parseKle } from "$lib/layouts/kle";
	import { resolveBoard } from "$lib/layouts/board";
	import { settings } from "$lib/settings.svelte";

	const U = 44;
	const PAD = 8;
	const SNAP = 0.25;

	function clone(g: KeyboardGeometry): KeyboardGeometry {
		return JSON.parse(JSON.stringify(g));
	}

	function defaultName(boardId: string): string {
		if (boardId.startsWith("saved:")) return boardId.slice("saved:".length);
		return GEOMETRIES[boardId]?.label ?? "My board";
	}

	// The editor always edits the keyboard selected in the header. Presets load
	// as a starting point and become a named saved board on Save.
	// svelte-ignore state_referenced_locally
	let board = $state(clone(resolveBoard(settings.board, settings.savedBoards)));
	// svelte-ignore state_referenced_locally
	let boardName = $state(defaultName(settings.board));
	let loadedFrom = settings.board;
	let selected = $state<number | null>(null);
	let editLayer = $state(0);
	let listening = $state(false);
	let savedFlash = $state(false);
	let kleDraft = $state("");
	let kleError = $state("");

	// Switching the header selector (or clicking a saved-board chip) reloads
	// the canvas with that keyboard.
	$effect(() => {
		if (settings.board !== loadedFrom) {
			board = clone(resolveBoard(settings.board, settings.savedBoards));
			boardName = defaultName(settings.board);
			loadedFrom = settings.board;
			selected = null;
			editLayer = 0;
			pendingModifier = null;
			listening = false;
		}
	});

	const layers = $derived(boardLayers(board));
	const selectedKey = $derived(
		selected === null ? null : board.keys[selected],
	);

	const bounds = $derived.by(() => {
		let maxX = 4;
		let maxY = 2;
		let rotated = false;
		for (const k of board.keys) {
			maxX = Math.max(maxX, k.x + k.w);
			maxY = Math.max(maxY, k.y + k.h);
			if (k.r !== 0) rotated = true;
		}
		return {
			w: (maxX + (rotated ? 0.8 : 0)) * U + PAD * 2,
			h: (maxY + (rotated ? 0.8 : 0)) * U + PAD * 2,
		};
	});

	// --- key legends -------------------------------------------------------
	const LABELS: Record<string, string> = {
		Backspace: "⌫",
		Tab: "tab",
		CapsLock: "caps",
		Enter: "⏎",
		ShiftLeft: "shift",
		ShiftRight: "shift",
		Escape: "esc",
		Space: "space",
		ControlLeft: "ctrl",
		ControlRight: "ctrl",
		AltLeft: "alt",
		AltRight: "alt",
		MetaLeft: "cmd",
		MetaRight: "cmd",
	};

	function codeName(code: string): string {
		if (code in LABELS) return LABELS[code];
		const chars = LAYOUTS.qwerty.keys[code];
		if (chars)
			return /[a-z]/.test(chars.base)
				? chars.base.toUpperCase()
				: chars.base;
		return code.replace(/^(Key|Digit)/, "");
	}

	function keyLegend(key: PositionedKey): string {
		const code = codeOnLayer(key, editLayer);
		if (code) return codeName(code);
		if (key.layerToggle !== undefined) return `L${key.layerToggle}`;
		return key.legend ?? "·";
	}

	// --- dragging ----------------------------------------------------------
	let svgEl: SVGSVGElement | undefined = $state();
	let drag: {
		index: number;
		startX: number;
		startY: number;
		keyX: number;
		keyY: number;
	} | null = null;

	function onKeyPointerDown(e: PointerEvent, index: number) {
		// A modifier held from before a selection change must not bind to the new key.
		pendingModifier = null;
		selected = index;
		const key = board.keys[index];
		drag = {
			index,
			startX: e.clientX,
			startY: e.clientY,
			keyX: key.x,
			keyY: key.y,
		};
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!drag || !svgEl) return;
		const scale = svgEl.clientWidth / bounds.w;
		let dx = (e.clientX - drag.startX) / (scale * U);
		let dy = (e.clientY - drag.startY) / (scale * U);
		const key = board.keys[drag.index];
		if (key.r !== 0) {
			// x/y live in the rotated frame (KLE semantics): counter-rotate the delta
			const rad = (-key.r * Math.PI) / 180;
			const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
			const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
			dx = rx;
			dy = ry;
		}
		key.x = Math.round((drag.keyX + dx) / SNAP) * SNAP;
		key.y = Math.round((drag.keyY + dy) / SNAP) * SNAP;
	}

	function onPointerUp() {
		drag = null;
	}

	// --- bind by pressing the physical key ----------------------------------
	const MODIFIER_CODES = [
		"ShiftLeft",
		"ShiftRight",
		"ControlLeft",
		"ControlRight",
		"AltLeft",
		"AltRight",
		"MetaLeft",
		"MetaRight",
	];
	// A held modifier is a layer/shift chord in progress; a *tapped* modifier
	// (down then up with nothing else pressed) is a bind of the modifier itself.
	let pendingModifier: string | null = null;
	let manualCodeInput = $state("");
	const COMMON_BIND_CODES = [
		"Backspace",
		"Tab",
		"CapsLock",
		"Enter",
		"Escape",
		"Space",
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"ShiftLeft",
		"ShiftRight",
		"ControlLeft",
		"ControlRight",
		"AltLeft",
		"AltRight",
		"MetaLeft",
		"MetaRight",
		"Backquote",
		"Minus",
		"Equal",
		"BracketLeft",
		"BracketRight",
		"Backslash",
		"Semicolon",
		"Quote",
		"Comma",
		"Period",
		"Slash",
		"PageUp",
		"PageDown",
		"Home",
		"End",
		"Delete",
		"Insert",
		"F1",
		"F2",
		"F3",
		"F4",
		"F5",
		"F6",
		"F7",
		"F8",
		"F9",
		"F10",
		"F11",
		"F12",
	];

	function onListenKeydown(e: KeyboardEvent) {
		if (!listening || selected === null) return;
		e.preventDefault();
		e.stopPropagation();
		if (MODIFIER_CODES.includes(e.code)) {
			pendingModifier = e.code;
			return;
		}
		pendingModifier = null;
		bindCode(e.code);
		listening = false;
	}

	function onListenKeyup(e: KeyboardEvent) {
		if (!listening || selected === null || pendingModifier === null) return;
		if (e.code === pendingModifier) {
			e.preventDefault();
			bindCode(e.code);
			pendingModifier = null;
			listening = false;
		}
	}

	function bindCode(code: string) {
		const key = board.keys[selected!];
		if (editLayer === 0) {
			key.code = code;
		} else {
			key.layers = { ...(key.layers ?? {}), [String(editLayer)]: code };
		}
	}

	function toggleListening() {
		pendingModifier = null;
		listening = !listening;
	}

	function bindManualCode() {
		const code = manualCodeInput.trim();
		if (!code) return;
		bindCode(code);
		manualCodeInput = "";
		pendingModifier = null;
		listening = false;
	}

	function clearBinding() {
		if (selected === null) return;
		const key = board.keys[selected];
		if (editLayer === 0) {
			key.code = null;
		} else if (key.layers) {
			delete key.layers[String(editLayer)];
		}
	}

	// --- structure edits -----------------------------------------------------
	function addKey() {
		const maxX = Math.max(0, ...board.keys.map((k) => k.x + k.w));
		board.keys.push({
			code: null,
			x: maxX + 0.5,
			y: 0,
			w: 1,
			h: 1,
			r: 0,
			rx: 0,
			ry: 0,
		});
		selected = board.keys.length - 1;
	}

	function duplicateKey() {
		if (selected === null) return;
		const copy = JSON.parse(
			JSON.stringify(board.keys[selected]),
		) as PositionedKey;
		copy.x += 1;
		board.keys.push(copy);
		selected = board.keys.length - 1;
	}

	function deleteKey() {
		if (selected === null) return;
		board.keys.splice(selected, 1);
		selected = null;
	}

	function addLayer() {
		editLayer = Math.max(...layers) + 1;
	}

	function save() {
		const name = boardName.trim() || "My board";
		board.id = "custom-board";
		board.label = name;
		settings.savedBoards = {
			...settings.savedBoards,
			[name]: serializeBoard(board),
		};
		// Saving keeps this board active in the header without reloading the canvas.
		loadedFrom = `saved:${name}`;
		settings.board = loadedFrom;
		boardName = name;
		savedFlash = true;
		setTimeout(() => (savedFlash = false), 1500);
	}

	function deleteSaved(name: string) {
		const { [name]: _removed, ...rest } = settings.savedBoards;
		settings.savedBoards = rest;
		if (settings.board === `saved:${name}`) settings.board = "ansi";
	}

	function importKle() {
		try {
			board = parseKle(kleDraft);
			kleError = "";
			selected = null;
			editLayer = 0;
		} catch (e) {
			kleError =
				e instanceof Error ? e.message : "Could not parse that JSON.";
		}
	}

	const inputClass =
		"w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none";
</script>

<svelte:window
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onkeydown={onListenKeydown}
	onkeyup={onListenKeyup}
/>

<div class="mb-4 flex items-center justify-between">
	<h1 class="text-2xl font-bold">Key editor</h1>
	<div class="flex items-center gap-2">
		<input
			type="text"
			bind:value={boardName}
			placeholder="Board name"
			class="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
		/>
		<button
			onclick={save}
			class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
		>
			{savedFlash ? "Saved ✓" : "Save"}
		</button>
	</div>
</div>

<p class="mb-2 text-sm text-zinc-500">
	Editing <b class="text-zinc-300">{defaultName(settings.board)}</b> — the keyboard selected in
	the header. Pick a preset there to use it as a starting point; saving stores it under the name
	above and keeps it active.
</p>

<p class="mb-4 text-sm text-zinc-500">
	Select a key, drag it into place, and use <b>Bind</b> to assign the keycode it
	sends. This is the hardware mapping. The layout setting below only changes how
	the app interprets that key for practice and lesson text (QWERTY, Colemak, etc.).
</p>

<!-- board-level context: what characters the emitted codes mean, and who applies the layout -->
<div
	class="mb-3 flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm"
>
	<label class="flex items-center gap-2 text-zinc-400">
		Input handling
		<select
			value={board.inputMode ?? "direct"}
			onchange={(e) =>
				(board.inputMode = e.currentTarget.value as
					| "direct"
					| "translated")}
			class="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100"
		>
			<option value="direct">firmware / direct keycode</option>
			<option value="translated">OS / remapped keycode</option>
		</select>
	</label>
	<label class="flex items-center gap-2 text-zinc-400">
		Practice layout
		<select
			value={board.layout ?? "qwerty"}
			onchange={(e) => (board.layout = e.currentTarget.value as LayoutId)}
			disabled={(board.inputMode ?? "direct") === "direct"}
			class="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 disabled:opacity-40"
		>
			{#each Object.values(LAYOUTS) as l (l.id)}
				<option value={l.id}>{l.label}</option>
			{/each}
		</select>
	</label>
	<span class="text-xs text-zinc-600">
		{#if (board.inputMode ?? "direct") === "direct"}
			Custom keyboard: the firmware already assigns final keycodes, so the
			app reads them as-is — bind keys by pressing them and the legends
			match your board. No layout needed.
		{:else}
			Regular keyboard: the OS remaps digitally — pick the layout the OS is
			set to so highlighting finds the right physical keys.
		{/if}
	</span>
</div>

<!-- layer tabs -->
<div class="mb-3 flex items-center gap-2 text-sm">
	<span class="text-zinc-500">Layer:</span>
	{#each layers as layer (layer)}
		<button
			onclick={() => (editLayer = layer)}
			class="rounded px-3 py-1 {editLayer === layer
				? 'bg-emerald-600 text-white'
				: 'text-zinc-400 hover:bg-zinc-800'}"
		>
			{layer}
		</button>
	{/each}
	{#if !layers.includes(editLayer)}
		<button class="rounded bg-emerald-600 px-3 py-1 text-white"
			>{editLayer}</button
		>
	{/if}
	<button
		onclick={addLayer}
		class="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-800"
		>+ layer</button
	>
</div>

<div class="mb-4 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
	<svg
		bind:this={svgEl}
		viewBox="0 0 {bounds.w} {bounds.h}"
		class="w-full touch-none select-none"
	>
		{#each board.keys as key, i (i)}
			<g
				onpointerdown={(e) => onKeyPointerDown(e, i)}
				role="button"
				tabindex="-1"
				class="cursor-move"
				opacity={editLayer > 0 &&
				codeOnLayer(key, editLayer) === null &&
				key.layerToggle === undefined
					? 0.45
					: 1}
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
					class={selected === i
						? "fill-emerald-600/40 stroke-emerald-400"
						: "fill-zinc-900 stroke-zinc-700"}
					stroke-width={selected === i ? 2 : 1}
				/>
				<text
					x={(key.x + key.w / 2) * U}
					y={(key.y + key.h / 2) * U + 4}
					text-anchor="middle"
					class="pointer-events-none fill-zinc-300 font-mono text-[12px]"
				>
					{keyLegend(key)}
				</text>
			</g>
		{/each}
	</svg>
</div>

<div class="mb-4 flex gap-2">
	<button
		onclick={addKey}
		class="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
		>+ Add key</button
	>
	{#if selectedKey}
		<button
			onclick={duplicateKey}
			class="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
			>Duplicate</button
		>
		<button
			onclick={deleteKey}
			class="rounded-md border border-red-900 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950"
			>Delete</button
		>
	{/if}
</div>

{#if selectedKey}
	<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
		<div class="mb-4 flex flex-wrap items-end gap-4">
			{#each [["x", "x"], ["y", "y"], ["w", "w"], ["h", "h"]] as [label, prop] (prop)}
				<label class="text-xs text-zinc-500">
					{label}
					<input
						type="number"
						step="0.25"
						bind:value={selectedKey[prop as "x" | "y" | "w" | "h"]}
						class="{inputClass} mt-1 block"
					/>
				</label>
			{/each}
			<label class="text-xs text-zinc-500">
				rotation°
				<input
					type="number"
					step="5"
					value={selectedKey.r}
					oninput={(e) => {
						const v = Number(e.currentTarget.value) || 0;
						if (selectedKey!.r === 0 && v !== 0) {
							// first rotation: anchor at the key's own position
							selectedKey!.rx = selectedKey!.x;
							selectedKey!.ry = selectedKey!.y;
						}
						selectedKey!.r = v;
					}}
					class="{inputClass} mt-1 block"
				/>
			</label>
			<label class="text-xs text-zinc-500">
				layer toggle
				<select
					value={selectedKey.layerToggle ?? ""}
					onchange={(e) => {
						const v = e.currentTarget.value;
						if (v === "") delete selectedKey!.layerToggle;
						else selectedKey!.layerToggle = Number(v);
					}}
					class="mt-1 block rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
				>
					<option value="">none</option>
					{#each layers.filter((l) => l > 0) as l (l)}
						<option value={l}>activates layer {l}</option>
					{/each}
					{#if !layers.includes(editLayer) && editLayer > 0}
						<option value={editLayer}
							>activates layer {editLayer}</option
						>
					{/if}
				</select>
			</label>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<span class="text-sm text-zinc-400">
				Layer {editLayer} binding:
				<code
					class="ml-1 rounded bg-zinc-800 px-2 py-0.5 font-mono text-emerald-400"
				>
					{codeOnLayer(selectedKey, editLayer) ?? "—"}
				</code>
			</span>
			<button
				onclick={toggleListening}
				class="rounded-md px-3 py-1.5 text-sm {listening
					? 'animate-pulse bg-amber-500 text-zinc-950'
					: 'bg-emerald-600 text-white hover:bg-emerald-500'}"
			>
				{listening ? "Press a key…" : "Bind: press key"}
			</button>
			<button
				onclick={clearBinding}
				class="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
			>
				Clear
			</button>
		</div>
		<div class="mt-3 flex flex-wrap items-center gap-2">
			<input
				type="text"
				bind:value={manualCodeInput}
				list="binding-codes"
				placeholder="e.g. F13 or IntlBackslash"
				class="w-56 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
			/>
			<datalist id="binding-codes">
				{#each COMMON_BIND_CODES as code (code)}
					<option value={code}>{codeName(code)}</option>
				{/each}
			</datalist>
			<button
				onclick={bindManualCode}
				class="rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
			>
				Bind code
			</button>
			<span class="text-xs text-zinc-600"
				>Use this if the key cannot be produced physically.</span
			>
		</div>
	</div>
{:else}
	<p class="text-sm text-zinc-600">Select a key to edit it.</p>
{/if}

{#if Object.keys(settings.savedBoards).length > 0}
	<div class="mt-8">
		<h2
			class="mb-2 text-sm font-semibold tracking-wide text-zinc-400 uppercase"
		>
			Saved boards
		</h2>
		<div class="flex flex-wrap items-center gap-2">
			{#each Object.keys(settings.savedBoards) as name (name)}
				<span
					class="flex items-center overflow-hidden rounded-md border {settings.board ===
					`saved:${name}`
						? 'border-emerald-500 bg-emerald-600/20'
						: 'border-zinc-700'}"
				>
					<button
						onclick={() => (settings.board = `saved:${name}`)}
						class="px-3 py-1.5 text-sm {settings.board ===
						`saved:${name}`
							? 'text-emerald-300'
							: 'text-zinc-400 hover:bg-zinc-800'}"
					>
						{name}
					</button>
					<button
						onclick={() => deleteSaved(name)}
						title="Delete this board"
						class="px-2 py-1.5 text-xs text-zinc-600 hover:bg-red-950 hover:text-red-400"
					>
						✕
					</button>
				</span>
			{/each}
		</div>
	</div>
{/if}

<div class="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
	<h2
		class="mb-1 text-sm font-semibold tracking-wide text-zinc-400 uppercase"
	>
		Import from KLE
	</h2>
	<p class="mb-3 text-xs text-zinc-500">
		Paste raw JSON from
		<a
			href="https://keyboard-layout-editor.com"
			target="_blank"
			class="underline hover:text-zinc-300"
		>
			keyboard-layout-editor.com
		</a>
		(Raw data tab) to load it into the canvas, then adjust and save. Legends
		are read as QWERTY characters or names like Space/Enter/Shift.
	</p>
	<textarea
		bind:value={kleDraft}
		rows="4"
		placeholder={'[["Esc","Q","W","E","R","T"], ...]'}
		class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
	></textarea>
	{#if kleError}
		<p class="mt-2 text-sm text-red-400">{kleError}</p>
	{/if}
	<button
		onclick={importKle}
		class="mt-2 rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
	>
		Load into canvas
	</button>
</div>

<p class="mt-6 text-xs text-zinc-600">
	Tip: to fix a preset that doesn't match your board, load it above, rebind
	the differing keys, and save — it becomes the active keyboard in the header.
	<button
		onclick={() => goto(`${base}/settings`)}
		class="underline hover:text-zinc-400">Back to settings</button
	>
</p>
