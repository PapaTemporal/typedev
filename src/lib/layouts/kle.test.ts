import { describe, expect, it } from 'vitest';
import { parseKle } from './kle';

const SIMPLE = JSON.stringify([
	['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
	['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
	['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
	[{ w: 3 }, 'Space', 'Enter', 'Backspace']
]);

describe('parseKle', () => {
	it('parses a simple grid and maps legends to codes', () => {
		const geo = parseKle(SIMPLE);
		expect(geo.keys).toHaveLength(33);
		const q = geo.keys[0];
		expect(q).toMatchObject({ code: 'KeyQ', x: 0, y: 0, w: 1 });
		const semi = geo.keys.find((k) => k.code === 'Semicolon');
		expect(semi).toMatchObject({ x: 9, y: 1 });
		const space = geo.keys.find((k) => k.code === 'Space');
		expect(space).toMatchObject({ w: 3, y: 3 });
	});

	it('applies x/y offsets (split gap, column stagger)', () => {
		const geo = parseKle(
			JSON.stringify([
				['Q', 'W', 'E', { x: 2 }, 'I', 'O', 'P'],
				[{ y: 0.5 }, 'A', 'S', 'D', { x: 2 }, 'K', 'L', ';']
			])
		);
		const i = geo.keys.find((k) => k.code === 'KeyI');
		expect(i).toMatchObject({ x: 5, y: 0 });
		const a = geo.keys.find((k) => k.code === 'KeyA');
		expect(a).toMatchObject({ x: 0, y: 1.5 });
	});

	it('carries rotation clusters (r/rx/ry)', () => {
		const geo = parseKle(
			JSON.stringify([
				['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
				['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
				['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
				[{ r: 15, rx: 4, ry: 4 }, 'Space', 'Enter', 'Backspace']
			])
		);
		const space = geo.keys.find((k) => k.code === 'Space');
		expect(space).toMatchObject({ r: 15, rx: 4, ry: 4, x: 4, y: 4 });
	});

	it('reads shifted legends like "!\\n1" as the base key', () => {
		const geo = parseKle(
			JSON.stringify([
				['!\n1', '@\n2', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
				['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
				['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Shift'],
				['Space']
			])
		);
		expect(geo.keys[0].code).toBe('Digit1');
		expect(geo.keys[1].code).toBe('Digit2');
		const shifts = geo.keys.filter((k) => k.code?.startsWith('Shift')).map((k) => k.code);
		expect(shifts).toEqual(['ShiftLeft', 'ShiftRight']);
	});

	it('turns unknown legends into decorative keys', () => {
		const geo = parseKle(
			JSON.stringify([
				['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
				['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
				['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
				['MO(1)', 'Space']
			])
		);
		const decorative = geo.keys.find((k) => k.code === null);
		expect(decorative?.legend).toBe('MO(1');
	});

	it('rejects garbage with a helpful message', () => {
		expect(() => parseKle('not json')).toThrow(/valid JSON/);
		expect(() => parseKle('{"a":1}')).toThrow(/array of rows/);
		expect(() => parseKle('[["Q","W"]]')).toThrow(/Only 2 keys/);
	});
});

