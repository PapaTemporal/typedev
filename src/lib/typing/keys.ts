import type { Layout } from '$lib/layouts';

export type KeyAction =
	| { kind: 'char'; char: string }
	| { kind: 'backspace' }
	| { kind: 'restart' }
	| { kind: 'trap' } // preventDefault but do nothing (Tab must not move focus)
	| { kind: 'pass' }; // let the browser handle it

export interface KeyLike {
	key: string;
	code: string;
	shiftKey: boolean;
	metaKey: boolean;
	ctrlKey: boolean;
	isComposing: boolean;
}

/**
 * Classify a keydown for the typing engine.
 *
 * Default (OS) mode matches on `event.key`: the OS has already applied the
 * active layout (e.g. Colemak), so `key` is the character the user actually
 * produced. Alt is allowed through because macOS Option-combos emit printable
 * keys.
 *
 * With `emulate` set, the OS layout is ignored: the physical key position
 * (`event.code`) is mapped through the given layout table instead. This is for
 * custom keyboards / trying a layout without changing the OS.
 */
export function classifyKey(e: KeyLike, emulate?: Layout): KeyAction {
	if (e.isComposing || e.key === 'Process' || e.key === 'Dead') return { kind: 'pass' };
	if (e.metaKey || e.ctrlKey) return { kind: 'pass' };
	if (e.key === 'Enter') return { kind: 'char', char: '\n' };
	if (e.key === 'Backspace') return { kind: 'backspace' };
	if (e.key === 'Escape') return { kind: 'restart' };
	if (e.key === 'Tab') return { kind: 'trap' };
	if (emulate) {
		const chars = emulate.keys[e.code];
		if (chars) return { kind: 'char', char: e.shiftKey ? chars.shift : chars.base };
		// Physical key with no mapping (F-keys, arrows, unknown codes): ignore,
		// but swallow stray printable output so the OS layout can't leak through.
		return e.key.length === 1 ? { kind: 'trap' } : { kind: 'pass' };
	}
	if (e.key.length === 1) return { kind: 'char', char: e.key };
	return { kind: 'pass' };
}
