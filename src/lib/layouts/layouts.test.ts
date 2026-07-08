import { describe, expect, it } from 'vitest';
import { FINGERS, GEOMETRIES, LAYOUTS, reverseMap, type LayoutId } from './index';

const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];
const PRINTABLE_ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));

describe.each(LAYOUT_IDS)('layout %s', (id) => {
	const layout = LAYOUTS[id];
	const reverse = reverseMap(id);

	it('covers every printable ASCII character', () => {
		const missing = PRINTABLE_ASCII.filter((ch) => !reverse.has(ch));
		expect(missing).toEqual([]);
	});

	it('round-trips every char through the reverse map', () => {
		for (const ch of PRINTABLE_ASCII) {
			const loc = reverse.get(ch)!;
			const chars = layout.keys[loc.code];
			expect(loc.shift ? chars.shift : chars.base).toBe(ch);
		}
	});

	it('produces each character on exactly one key', () => {
		const seen = new Map<string, string>();
		for (const [code, chars] of Object.entries(layout.keys)) {
			for (const ch of [chars.base, chars.shift]) {
				if (ch === ' ') continue; // space is its own key
				const prior = seen.get(ch);
				expect(prior === undefined || prior === code, `'${ch}' on both ${prior} and ${code}`).toBe(
					true
				);
				seen.set(ch, code);
			}
		}
	});

	it('has chars for every printable key in every geometry', () => {
		const nonPrinting = new Set([
			'Backspace',
			'Tab',
			'CapsLock',
			'Enter',
			'ShiftLeft',
			'ShiftRight',
			'Escape'
		]);
		for (const geometry of Object.values(GEOMETRIES)) {
			for (const key of geometry.keys) {
				if (key.code === null || nonPrinting.has(key.code)) continue;
				expect(layout.keys[key.code], `missing chars for ${key.code} (${geometry.id})`).toBeDefined();
			}
		}
	});
});

describe('geometries', () => {
	it.each(Object.values(GEOMETRIES).map((g) => [g.id, g] as const))(
		'%s assigns fingers and unique codes',
		(_id, geometry) => {
			const seen = new Set<string>();
			for (const key of geometry.keys) {
				if (key.code === null) continue;
				expect(FINGERS[key.code], `no finger for ${key.code}`).toBeDefined();
				expect(seen.has(key.code), `${key.code} appears twice`).toBe(false);
				seen.add(key.code);
			}
		}
	);

	it('charybdis covers the full alphabet plus core keys', () => {
		const codes = new Set(GEOMETRIES['charybdis-4x6'].keys.map((k) => k.code));
		for (const c of 'QWERTYUIOPASDFGHJKLZXCVBNM') {
			expect(codes.has(`Key${c}`), `missing Key${c}`).toBe(true);
		}
		for (const code of ['Space', 'Enter', 'Backspace', 'ShiftLeft', 'ShiftRight']) {
			expect(codes.has(code), `missing ${code}`).toBe(true);
		}
	});
});

describe('layout sanity vs QWERTY', () => {
	it('colemak keeps digits and most punctuation', () => {
		const q = LAYOUTS.qwerty.keys;
		const c = LAYOUTS.colemak.keys;
		for (const code of ['Digit1', 'Digit9', 'Comma', 'Period', 'Slash', 'Quote', 'BracketLeft']) {
			expect(c[code]).toEqual(q[code]);
		}
		expect(c.KeyK.base).toBe('e'); // colemak home-row e
	});

	it('dvorak relocates punctuation', () => {
		const d = LAYOUTS.dvorak.keys;
		expect(d.KeyQ.base).toBe("'");
		expect(d.Minus.base).toBe('[');
		expect(d.Semicolon.base).toBe('s');
	});
});
