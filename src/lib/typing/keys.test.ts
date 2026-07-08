import { describe, expect, it } from 'vitest';
import { LAYOUTS } from '$lib/layouts';
import { classifyKey, type KeyLike } from './keys';

function key(overrides: Partial<KeyLike> & { key: string }): KeyLike {
	return { code: '', shiftKey: false, metaKey: false, ctrlKey: false, isComposing: false, ...overrides };
}

describe('classifyKey', () => {
	it('passes printable chars through, including symbols', () => {
		for (const ch of ['a', 'Z', '{', '=', '`', ' ', ';']) {
			expect(classifyKey(key({ key: ch }))).toEqual({ kind: 'char', char: ch });
		}
	});

	it('maps Enter to newline', () => {
		expect(classifyKey(key({ key: 'Enter' }))).toEqual({ kind: 'char', char: '\n' });
	});

	it('maps Backspace and Escape', () => {
		expect(classifyKey(key({ key: 'Backspace' }))).toEqual({ kind: 'backspace' });
		expect(classifyKey(key({ key: 'Escape' }))).toEqual({ kind: 'restart' });
	});

	it('traps Tab so focus never escapes', () => {
		expect(classifyKey(key({ key: 'Tab' }))).toEqual({ kind: 'trap' });
	});

	it('ignores browser shortcuts (meta/ctrl held)', () => {
		expect(classifyKey(key({ key: 'r', metaKey: true }))).toEqual({ kind: 'pass' });
		expect(classifyKey(key({ key: 'c', ctrlKey: true }))).toEqual({ kind: 'pass' });
	});

	it('ignores IME and dead keys', () => {
		expect(classifyKey(key({ key: 'a', isComposing: true }))).toEqual({ kind: 'pass' });
		expect(classifyKey(key({ key: 'Dead' }))).toEqual({ kind: 'pass' });
		expect(classifyKey(key({ key: 'Process' }))).toEqual({ kind: 'pass' });
	});

	it('ignores modifier and navigation keys', () => {
		for (const k of ['Shift', 'CapsLock', 'ArrowLeft', 'F5', 'Meta']) {
			expect(classifyKey(key({ key: k }))).toEqual({ kind: 'pass' });
		}
	});
});

describe('classifyKey with layout emulation (ignore OS layout)', () => {
	const colemak = LAYOUTS.colemak;
	const dvorak = LAYOUTS.dvorak;

	it('maps physical position through the layout, not the OS char', () => {
		// OS on QWERTY says 'g', but physical KeyG is 'd' in Colemak
		expect(classifyKey(key({ key: 'g', code: 'KeyG' }), colemak)).toEqual({
			kind: 'char',
			char: 'd'
		});
		expect(classifyKey(key({ key: ';', code: 'Semicolon' }), colemak)).toEqual({
			kind: 'char',
			char: 'o'
		});
	});

	it('applies shift through the layout table', () => {
		expect(classifyKey(key({ key: 'G', code: 'KeyG', shiftKey: true }), colemak)).toEqual({
			kind: 'char',
			char: 'D'
		});
		expect(classifyKey(key({ key: 'Q', code: 'KeyQ', shiftKey: true }), dvorak)).toEqual({
			kind: 'char',
			char: '"'
		});
	});

	it('keeps control keys working', () => {
		expect(classifyKey(key({ key: 'Enter', code: 'Enter' }), colemak)).toEqual({
			kind: 'char',
			char: '\n'
		});
		expect(classifyKey(key({ key: 'Backspace', code: 'Backspace' }), colemak)).toEqual({
			kind: 'backspace'
		});
		expect(classifyKey(key({ key: ' ', code: 'Space' }), colemak)).toEqual({
			kind: 'char',
			char: ' '
		});
	});

	it('still lets browser shortcuts through', () => {
		expect(classifyKey(key({ key: 'r', code: 'KeyR', metaKey: true }), colemak)).toEqual({
			kind: 'pass'
		});
	});

	it('traps printable keys with unmapped codes so the OS layout cannot leak', () => {
		expect(classifyKey(key({ key: '5', code: 'Numpad5' }), colemak)).toEqual({ kind: 'trap' });
		expect(classifyKey(key({ key: 'ArrowLeft', code: 'ArrowLeft' }), colemak)).toEqual({
			kind: 'pass'
		});
	});
});
