import type { Finger, LayoutId, PhysicalCode } from './types';

export interface PositionedKey {
	/** base-layer emitted code; null = decorative key (no character mapping) */
	code: PhysicalCode | null;
	/** codes emitted on higher layers, keyed by layer number as a string (JSON-friendly) */
	layers?: Record<string, PhysicalCode>;
	/** this key momentarily activates the given layer (like QMK MO(n)) */
	layerToggle?: number;
	x: number; // key units
	y: number;
	w: number;
	h: number;
	/** rotation in degrees around (rx, ry) — KLE semantics */
	r: number;
	rx: number;
	ry: number;
	/** display label for keys without a code */
	legend?: string;
}

export interface KeyboardGeometry {
	id: string;
	label: string;
	/** Character layout this board's emitted codes are interpreted with (default 'qwerty'). */
	layout?: LayoutId;
	/** 'direct' = trust the keycode emitted by the board/firmware; 'translated' = let the OS/keymap translate it before the app sees it (default 'direct'). */
	inputMode?: 'direct' | 'translated';
	keys: PositionedKey[];
}

function key(
	code: PhysicalCode | null,
	x: number,
	y: number,
	w = 1,
	opts: Partial<Pick<PositionedKey, 'h' | 'r' | 'rx' | 'ry' | 'legend'>> = {}
): PositionedKey {
	return { code, x, y, w, h: opts.h ?? 1, r: opts.r ?? 0, rx: opts.rx ?? 0, ry: opts.ry ?? 0, legend: opts.legend };
}

function row(y: number, entries: [PhysicalCode, number?][]): PositionedKey[] {
	const keys: PositionedKey[] = [];
	let x = 0;
	for (const [code, w = 1] of entries) {
		keys.push(key(code, x, y, w));
		x += w;
	}
	return keys;
}

export const ANSI: KeyboardGeometry = {
	id: 'ansi',
	label: 'ANSI (row stagger)',
	keys: [
		...row(0, [
			['Backquote'],
			['Digit1'],
			['Digit2'],
			['Digit3'],
			['Digit4'],
			['Digit5'],
			['Digit6'],
			['Digit7'],
			['Digit8'],
			['Digit9'],
			['Digit0'],
			['Minus'],
			['Equal'],
			['Backspace', 2]
		]),
		...row(1, [
			['Tab', 1.5],
			['KeyQ'],
			['KeyW'],
			['KeyE'],
			['KeyR'],
			['KeyT'],
			['KeyY'],
			['KeyU'],
			['KeyI'],
			['KeyO'],
			['KeyP'],
			['BracketLeft'],
			['BracketRight'],
			['Backslash', 1.5]
		]),
		...row(2, [
			['CapsLock', 1.75],
			['KeyA'],
			['KeyS'],
			['KeyD'],
			['KeyF'],
			['KeyG'],
			['KeyH'],
			['KeyJ'],
			['KeyK'],
			['KeyL'],
			['Semicolon'],
			['Quote'],
			['Enter', 2.25]
		]),
		...row(3, [
			['ShiftLeft', 2.25],
			['KeyZ'],
			['KeyX'],
			['KeyC'],
			['KeyV'],
			['KeyB'],
			['KeyN'],
			['KeyM'],
			['Comma'],
			['Period'],
			['Slash'],
			['ShiftRight', 2.75]
		]),
		key('Space', 3.75, 4, 6.25)
	]
};

/**
 * Charybdis 4x6 (Bastard Keyboards): split, columnar stagger, 4x6 per hand,
 * 5-key left thumb cluster, 3-key right cluster (trackball side). Codes follow
 * the default QMK matrix→QWERTY-position mapping; use KLE import if your
 * firmware maps differently.
 */
const CHARYBDIS_STAGGER = [0.55, 0.55, 0.25, 0, 0.15, 0.3]; // y offset per column, outer→inner
const RIGHT_X = 9;

function charybdisHand(
	side: 'left' | 'right',
	rows: (PhysicalCode | null)[][]
): PositionedKey[] {
	const keys: PositionedKey[] = [];
	for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
		for (let col = 0; col < 6; col++) {
			const code = rows[rowIdx][col];
			const stagger =
				side === 'left' ? CHARYBDIS_STAGGER[col] : CHARYBDIS_STAGGER[5 - col];
			const x = side === 'left' ? col : RIGHT_X + col;
			keys.push(key(code, x, rowIdx + stagger));
		}
	}
	return keys;
}

export const CHARYBDIS_4X6: KeyboardGeometry = {
	id: 'charybdis-4x6',
	label: 'Charybdis 4x6 (split)',
	keys: [
		...charybdisHand('left', [
			['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'],
			['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'],
			['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'],
			['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB']
		]),
		...charybdisHand('right', [
			['Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'],
			['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft'],
			['KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
			['KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight']
		]),
		// Left thumb cluster: 3 front + 2 back
		key('Space', 4.6, 5.1, 1, { r: 10, rx: 4.6, ry: 5.1 }),
		key('Backspace', 5.7, 5.35, 1, { r: 20, rx: 5.7, ry: 5.35 }),
		key('Escape', 6.7, 5.8, 1, { r: 30, rx: 6.7, ry: 5.8, legend: 'esc' }),
		key(null, 5.2, 6.35, 1, { r: 20, rx: 5.2, ry: 6.35, legend: 'fn' }),
		key(null, 6.2, 6.8, 1, { r: 30, rx: 6.2, ry: 6.8, legend: 'fn' }),
		// Right thumb cluster: 2 front + 1 back (trackball occupies the rest)
		key('Enter', 9.4, 5.1, 1, { r: -10, rx: 10.4, ry: 5.1 }),
		key(null, 8.3, 5.35, 1, { r: -20, rx: 9.3, ry: 5.35, legend: 'fn' }),
		key(null, 9.8, 6.35, 1, { r: -20, rx: 10.8, ry: 6.35, legend: 'fn' })
	]
};

export const GEOMETRIES: Record<string, KeyboardGeometry> = {
	ansi: ANSI,
	'charybdis-4x6': CHARYBDIS_4X6
};

export const FINGERS: Record<PhysicalCode, Finger> = {
	Backquote: 'l-pinky',
	Digit1: 'l-pinky',
	Digit2: 'l-ring',
	Digit3: 'l-middle',
	Digit4: 'l-index',
	Digit5: 'l-index',
	Digit6: 'r-index',
	Digit7: 'r-index',
	Digit8: 'r-middle',
	Digit9: 'r-ring',
	Digit0: 'r-pinky',
	Minus: 'r-pinky',
	Equal: 'r-pinky',
	Backspace: 'r-pinky',
	Tab: 'l-pinky',
	KeyQ: 'l-pinky',
	KeyW: 'l-ring',
	KeyE: 'l-middle',
	KeyR: 'l-index',
	KeyT: 'l-index',
	KeyY: 'r-index',
	KeyU: 'r-index',
	KeyI: 'r-middle',
	KeyO: 'r-ring',
	KeyP: 'r-pinky',
	BracketLeft: 'r-pinky',
	BracketRight: 'r-pinky',
	Backslash: 'r-pinky',
	CapsLock: 'l-pinky',
	KeyA: 'l-pinky',
	KeyS: 'l-ring',
	KeyD: 'l-middle',
	KeyF: 'l-index',
	KeyG: 'l-index',
	KeyH: 'r-index',
	KeyJ: 'r-index',
	KeyK: 'r-middle',
	KeyL: 'r-ring',
	Semicolon: 'r-pinky',
	Quote: 'r-pinky',
	Enter: 'r-pinky',
	ShiftLeft: 'l-pinky',
	KeyZ: 'l-pinky',
	KeyX: 'l-ring',
	KeyC: 'l-middle',
	KeyV: 'l-index',
	KeyB: 'l-index',
	KeyN: 'r-index',
	KeyM: 'r-index',
	Comma: 'r-middle',
	Period: 'r-ring',
	Slash: 'r-pinky',
	ShiftRight: 'r-pinky',
	Space: 'thumb',
	Escape: 'thumb',
	ControlLeft: 'l-pinky',
	ControlRight: 'r-pinky',
	AltLeft: 'thumb',
	AltRight: 'thumb',
	MetaLeft: 'thumb',
	MetaRight: 'thumb'
};
