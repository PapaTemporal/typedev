import type { KeyboardGeometry, PositionedKey } from './geometry';
import { reverseMap } from './index';

/** Named legends → physical codes (checked case-insensitively). */
const NAMED_KEYS: Record<string, string> = {
	space: 'Space',
	enter: 'Enter',
	return: 'Enter',
	backspace: 'Backspace',
	bksp: 'Backspace',
	'⌫': 'Backspace',
	tab: 'Tab',
	esc: 'Escape',
	escape: 'Escape',
	caps: 'CapsLock',
	'caps lock': 'CapsLock'
};

/**
 * Parse keyboard-layout-editor.com JSON into a renderable geometry.
 *
 * Covers the common KLE subset: rows of string legends with property objects
 * for x/y offsets, w/h sizes, and r/rx/ry rotation clusters — enough for
 * split/ergo boards. Legends are interpreted as QWERTY characters (or named
 * keys like "Space"/"Enter") to identify the physical key; unrecognized
 * legends become decorative keys.
 */
export function parseKle(jsonText: string): KeyboardGeometry {
	let data: unknown;
	try {
		data = JSON.parse(jsonText);
	} catch {
		throw new Error('Not valid JSON. Paste the raw JSON from keyboard-layout-editor.com.');
	}
	if (!Array.isArray(data)) {
		throw new Error('KLE JSON must be an array of rows (use Raw data → JSON, not the URL).');
	}

	const keys: PositionedKey[] = [];
	const usedCodes = new Set<string>();
	let y = 0;
	let r = 0;
	let rx = 0;
	let ry = 0;

	for (const rowData of data) {
		if (!Array.isArray(rowData)) continue; // leading metadata object
		let x = rx;
		let w = 1;
		let h = 1;
		for (const item of rowData) {
			if (item !== null && typeof item === 'object') {
				const p = item as Record<string, number>;
				if (p.r !== undefined) r = p.r;
				if (p.rx !== undefined) {
					rx = p.rx;
					x = rx;
				}
				if (p.ry !== undefined) {
					ry = p.ry;
					y = ry;
				}
				if (p.x) x += p.x;
				if (p.y) y += p.y;
				if (p.w) w = p.w;
				if (p.h) h = p.h;
			} else if (typeof item === 'string') {
				const code = legendToCode(item, usedCodes);
				if (code) usedCodes.add(code);
				keys.push({
					code,
					x,
					y,
					w,
					h,
					r,
					rx,
					ry,
					legend: code ? undefined : displayLegend(item)
				});
				x += w;
				w = 1;
				h = 1;
			}
		}
		y += 1;
	}

	if (keys.length === 0) throw new Error('No keys found in that KLE JSON.');
	const mapped = keys.filter((k) => k.code !== null).length;
	if (mapped < 10) {
		throw new Error(
			`Only ${mapped} keys could be identified — legends should be QWERTY characters (q, w, 1, ;, ...) or names like Space/Enter/Backspace/Shift.`
		);
	}
	return { id: 'custom', label: 'Custom (KLE)', keys };
}

function legendToCode(legend: string, used: Set<string>): string | null {
	const lines = legend
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
	if (lines.length === 0) return null;
	const qwertyChars = reverseMap('qwerty');
	// Bottom legend is the unshifted char in KLE ("!\n1" renders ! over 1), so
	// prefer later lines.
	for (const line of [...lines].reverse()) {
		const lower = line.toLowerCase();
		if (lower === 'shift') return used.has('ShiftLeft') ? 'ShiftRight' : 'ShiftLeft';
		if (NAMED_KEYS[lower]) return NAMED_KEYS[lower];
		if (line.length === 1) {
			const loc = qwertyChars.get(line.toLowerCase()) ?? qwertyChars.get(line);
			if (loc) return loc.code;
		}
	}
	return null;
}

function displayLegend(legend: string): string {
	return legend.split('\n')[0]?.slice(0, 4) ?? '';
}

