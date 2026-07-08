import { GEOMETRIES, type KeyboardGeometry, type PositionedKey } from './geometry';
import { reverseMap, type LayoutId } from './index';

/**
 * Resolve a board id — a preset ('ansi', 'charybdis-4x6') or 'saved:<name>'
 * pointing into the user's saved boards — falling back to ANSI.
 */
export function resolveBoard(
	boardId: string,
	saved: Record<string, string>
): KeyboardGeometry {
	if (boardId.startsWith('saved:')) {
		const json = saved[boardId.slice('saved:'.length)];
		if (json) {
			try {
				return parseBoard(json);
			} catch {
				/* fall through to ANSI */
			}
		}
	}
	return GEOMETRIES[boardId] ?? GEOMETRIES.ansi;
}

export function boardDisplayName(boardId: string): string {
	if (boardId.startsWith('saved:')) return boardId.slice('saved:'.length);
	return GEOMETRIES[boardId]?.label ?? boardId;
}

export interface BoardContext {
	layout: LayoutId;
	inputMode: 'direct' | 'translated';
}

/**
 * A board's effective character layout and input mode.
 *
 * 'direct' (custom keyboards): the firmware assigns final keycodes, so nothing
 * translates them again — and since HID keycodes are named after QWERTY
 * characters, they are always read with QWERTY semantics. The board's `layout`
 * field is informational metadata in this mode.
 *
 * 'translated' (regular keyboards): the OS remaps digitally; the board's
 * `layout` says which layout the OS applies, used to reverse-map characters
 * onto physical keys for highlighting/heat.
 *
 * Old mode names normalize to their behavioral equivalent: 'emulate'/'os'.
 */
export function boardContext(geometry: KeyboardGeometry): BoardContext {
	const raw: string = geometry.inputMode ?? 'direct';
	const inputMode: 'direct' | 'translated' =
		raw === 'translated' || raw === 'os' ? 'translated' : 'direct';
	return {
		layout: inputMode === 'direct' ? 'qwerty' : (geometry.layout ?? 'qwerty'),
		inputMode
	};
}

/** Code a key emits on a given layer (layer 0 = base). */
export function codeOnLayer(key: PositionedKey, layer: number): string | null {
	if (layer === 0) return key.code;
	return key.layers?.[String(layer)] ?? null;
}

/** Sorted list of layers present on the board; always includes 0. */
export function boardLayers(geometry: KeyboardGeometry): number[] {
	const layers = new Set([0]);
	for (const key of geometry.keys) {
		for (const l of Object.keys(key.layers ?? {})) layers.add(Number(l));
		if (key.layerToggle !== undefined) layers.add(key.layerToggle);
	}
	return [...layers].sort((a, b) => a - b);
}

export interface KeyTarget {
	keyIndex: number;
	layer: number;
	shift: boolean;
	/** keys that momentarily activate the needed layer (empty for layer 0) */
	toggleIndices: number[];
}

/**
 * Where does a character live on this board? Searches layer 0 first, then
 * higher layers, returning the key plus the layer-toggle keys to hold.
 */
export function findKeyForChar(
	geometry: KeyboardGeometry,
	layoutId: LayoutId,
	char: string
): KeyTarget | null {
	const loc = char === '\n' ? { code: 'Enter', shift: false } : reverseMap(layoutId).get(char);
	if (!loc) return null;
	for (const layer of boardLayers(geometry)) {
		const keyIndex = geometry.keys.findIndex((k) => codeOnLayer(k, layer) === loc.code);
		if (keyIndex >= 0) {
			const toggleIndices =
				layer === 0
					? []
					: geometry.keys.flatMap((k, i) => (k.layerToggle === layer ? [i] : []));
			return { keyIndex, layer, shift: loc.shift, toggleIndices };
		}
	}
	return null;
}

/** Highest error rate across every code this key can emit. */
export function keyHeat(key: PositionedKey, heat: Map<string, number>): number {
	let value = key.code ? (heat.get(key.code) ?? 0) : 0;
	for (const code of Object.values(key.layers ?? {})) {
		value = Math.max(value, heat.get(code) ?? 0);
	}
	return value;
}

export function serializeBoard(geometry: KeyboardGeometry): string {
	return JSON.stringify(geometry);
}

/** Parse a board saved by the editor, validating shape. */
export function parseBoard(json: string): KeyboardGeometry {
	let data: unknown;
	try {
		data = JSON.parse(json);
	} catch {
		throw new Error('Saved board is not valid JSON.');
	}
	const g = data as KeyboardGeometry;
	if (!g || !Array.isArray(g.keys) || g.keys.length === 0) {
		throw new Error('Saved board has no keys.');
	}
	for (const k of g.keys) {
		if (typeof k.x !== 'number' || typeof k.y !== 'number') {
			throw new Error('Saved board has a key without a position.');
		}
	}
	return {
		id: 'custom-board',
		label: g.label || 'My board',
		layout: g.layout,
		inputMode: g.inputMode,
		keys: g.keys
	};
}
