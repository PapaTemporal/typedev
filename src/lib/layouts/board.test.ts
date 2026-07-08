import { describe, expect, it } from 'vitest';
import {
	boardContext,
	boardDisplayName,
	boardLayers,
	codeOnLayer,
	findKeyForChar,
	keyHeat,
	parseBoard,
	resolveBoard,
	serializeBoard
} from './board';
import type { KeyboardGeometry, PositionedKey } from './geometry';

function k(overrides: Partial<PositionedKey>): PositionedKey {
	return { code: null, x: 0, y: 0, w: 1, h: 1, r: 0, rx: 0, ry: 0, ...overrides };
}

// A miniature split board: letters on base, brackets on layer 1 via a toggle key.
const BOARD: KeyboardGeometry = {
	id: 'test',
	label: 'Test board',
	keys: [
		k({ code: 'KeyA', x: 0 }),
		k({ code: 'KeyB', x: 1, layers: { '1': 'BracketLeft' } }),
		k({ code: 'KeyC', x: 2, layers: { '1': 'BracketRight', '2': 'Backquote' } }),
		k({ code: 'ShiftLeft', x: 0, y: 1 }),
		k({ code: null, x: 3, layerToggle: 1 }),
		k({ code: null, x: 4, layerToggle: 2 })
	]
};

describe('codeOnLayer / boardLayers', () => {
	it('returns base code on layer 0 and layered codes above', () => {
		expect(codeOnLayer(BOARD.keys[1], 0)).toBe('KeyB');
		expect(codeOnLayer(BOARD.keys[1], 1)).toBe('BracketLeft');
		expect(codeOnLayer(BOARD.keys[0], 1)).toBeNull();
	});

	it('collects layers from bindings and toggles', () => {
		expect(boardLayers(BOARD)).toEqual([0, 1, 2]);
	});
});

describe('findKeyForChar', () => {
	it('finds base-layer chars with no toggles', () => {
		const target = findKeyForChar(BOARD, 'qwerty', 'a');
		expect(target).toMatchObject({ keyIndex: 0, layer: 0, shift: false, toggleIndices: [] });
	});

	it('finds shifted chars', () => {
		expect(findKeyForChar(BOARD, 'qwerty', 'A')).toMatchObject({ keyIndex: 0, shift: true });
	});

	it('finds layered chars and their toggle key', () => {
		const target = findKeyForChar(BOARD, 'qwerty', '[');
		expect(target).toMatchObject({ keyIndex: 1, layer: 1, shift: false, toggleIndices: [4] });
		// { is shift + [ on layer 1
		expect(findKeyForChar(BOARD, 'qwerty', '{')).toMatchObject({
			keyIndex: 1,
			layer: 1,
			shift: true
		});
	});

	it('respects the selected layout for the char→code mapping', () => {
		// In Colemak, 'b' still lives on KeyB
		expect(findKeyForChar(BOARD, 'colemak', 'b')).toMatchObject({ keyIndex: 1, layer: 0 });
	});

	it('returns null for chars with no key on any layer', () => {
		expect(findKeyForChar(BOARD, 'qwerty', '=')).toBeNull();
	});

	it('prefers the lowest layer when a code exists on several', () => {
		const board: KeyboardGeometry = {
			id: 't',
			label: 't',
			keys: [k({ code: 'KeyA', layers: { '1': 'KeyA' } })]
		};
		expect(findKeyForChar(board, 'qwerty', 'a')?.layer).toBe(0);
	});
});

describe('keyHeat', () => {
	it('takes the max across all layers of a key', () => {
		const heat = new Map([
			['KeyC', 0.1],
			['BracketRight', 0.5]
		]);
		expect(keyHeat(BOARD.keys[2], heat)).toBe(0.5);
	});
});

describe('boardContext', () => {
	it('normalizes the old emulation mode to the new direct-keycode mode', () => {
		const context = boardContext({ id: 't', label: 't', inputMode: 'emulate' as any, keys: [] });
		expect(context.inputMode).toBe('direct');
	});

	it('keeps translated input mode explicit for OS-driven layouts', () => {
		const context = boardContext({ id: 't', label: 't', inputMode: 'translated', keys: [] });
		expect(context.inputMode).toBe('translated');
	});

	it('normalizes the old os mode to translated, preserving its behavior', () => {
		const context = boardContext({ id: 't', label: 't', inputMode: 'os' as never, keys: [] });
		expect(context.inputMode).toBe('translated');
	});

	it('defaults to direct + qwerty for presets', () => {
		const context = boardContext({ id: 't', label: 't', keys: [] });
		expect(context).toEqual({ layout: 'qwerty', inputMode: 'direct' });
	});

	it('direct boards read keycodes with QWERTY semantics — firmware already translated', () => {
		const context = boardContext({
			id: 't',
			label: 't',
			layout: 'colemak-dh',
			inputMode: 'direct',
			keys: []
		});
		expect(context.layout).toBe('qwerty');
	});

	it('translated boards use their layout for char↔code mapping', () => {
		const context = boardContext({
			id: 't',
			label: 't',
			layout: 'colemak-dh',
			inputMode: 'translated',
			keys: []
		});
		expect(context.layout).toBe('colemak-dh');
	});
});

describe('resolveBoard', () => {
	const saved = { Charybdis: serializeBoard(BOARD), Broken: 'not json' };

	it('returns presets by id and falls back to ANSI', () => {
		expect(resolveBoard('ansi', {}).id).toBe('ansi');
		expect(resolveBoard('charybdis-4x6', {}).id).toBe('charybdis-4x6');
		expect(resolveBoard('nonsense', {}).id).toBe('ansi');
	});

	it('resolves saved boards by name', () => {
		expect(resolveBoard('saved:Charybdis', saved).keys).toEqual(BOARD.keys);
	});

	it('falls back to ANSI for missing or broken saved boards', () => {
		expect(resolveBoard('saved:Nope', saved).id).toBe('ansi');
		expect(resolveBoard('saved:Broken', saved).id).toBe('ansi');
	});
});

describe('boardDisplayName', () => {
	it('uses preset labels and strips the saved: prefix', () => {
		expect(boardDisplayName('ansi')).toBe('ANSI (row stagger)');
		expect(boardDisplayName('saved:Work TKL')).toBe('Work TKL');
	});
});

describe('serialize/parse board', () => {
	it('round-trips a board with layers and toggles', () => {
		const parsed = parseBoard(serializeBoard(BOARD));
		expect(parsed.keys).toEqual(BOARD.keys);
		expect(parsed.id).toBe('custom-board');
	});

	it('rejects invalid payloads', () => {
		expect(() => parseBoard('nope')).toThrow(/valid JSON/);
		expect(() => parseBoard('{"keys":[]}')).toThrow(/no keys/);
		expect(() => parseBoard('{"keys":[{"code":"KeyA"}]}')).toThrow(/position/);
	});
});
