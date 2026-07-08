import { colemak } from './colemak';
import type { Layout } from './types';

/** Colemak-DH (ANSI): Colemak with D, H, and the affected bottom-row keys relocated. */
export const colemakDh: Layout = {
	id: 'colemak-dh',
	label: 'Colemak-DH',
	keys: {
		...colemak.keys,
		KeyT: { base: 'b', shift: 'B' }, // colemak has g here
		KeyG: { base: 'g', shift: 'G' }, // colemak has d here
		KeyD: { base: 's', shift: 'S' }, // unchanged from colemak (s)
		KeyV: { base: 'd', shift: 'D' }, // qwerty/colemak have v here
		KeyB: { base: 'v', shift: 'V' }, // colemak has b here
		KeyM: { base: 'h', shift: 'H' }, // colemak has m here
		KeyH: { base: 'm', shift: 'M' } // colemak has h here
	}
};
