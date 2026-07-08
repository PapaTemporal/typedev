import { qwerty } from './qwerty';
import type { Layout } from './types';

/**
 * Colemak differs from QWERTY on 17 letter keys plus Semicolon; digits and
 * punctuation stay put, which is why it's expressed as a diff.
 */
export const colemak: Layout = {
	id: 'colemak',
	label: 'Colemak',
	keys: {
		...qwerty.keys,
		KeyE: { base: 'f', shift: 'F' },
		KeyR: { base: 'p', shift: 'P' },
		KeyT: { base: 'g', shift: 'G' },
		KeyY: { base: 'j', shift: 'J' },
		KeyU: { base: 'l', shift: 'L' },
		KeyI: { base: 'u', shift: 'U' },
		KeyO: { base: 'y', shift: 'Y' },
		KeyP: { base: ';', shift: ':' },
		KeyS: { base: 'r', shift: 'R' },
		KeyD: { base: 's', shift: 'S' },
		KeyF: { base: 't', shift: 'T' },
		KeyG: { base: 'd', shift: 'D' },
		KeyJ: { base: 'n', shift: 'N' },
		KeyK: { base: 'e', shift: 'E' },
		KeyL: { base: 'i', shift: 'I' },
		Semicolon: { base: 'o', shift: 'O' },
		KeyN: { base: 'k', shift: 'K' }
	}
};
