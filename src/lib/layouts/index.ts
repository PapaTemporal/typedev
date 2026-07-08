import { colemak } from './colemak';
import { colemakDh } from './colemak-dh';
import { dvorak } from './dvorak';
import { qwerty } from './qwerty';
import type { Layout, LayoutId, PhysicalCode } from './types';

export { ANSI, CHARYBDIS_4X6, FINGERS, GEOMETRIES } from './geometry';
export type { KeyboardGeometry, PositionedKey } from './geometry';
export type { Finger, KeyChars, Layout, LayoutId, PhysicalCode } from './types';

export const LAYOUTS: Record<LayoutId, Layout> = {
	qwerty,
	colemak,
	'colemak-dh': colemakDh,
	dvorak
};

export interface KeyLocation {
	code: PhysicalCode;
	shift: boolean;
}

const reverseMapCache = new Map<LayoutId, Map<string, KeyLocation>>();

/** char → physical key (+ shift) for a layout, for next-key highlighting and heatmaps. */
export function reverseMap(layoutId: LayoutId): Map<string, KeyLocation> {
	let map = reverseMapCache.get(layoutId);
	if (!map) {
		map = new Map();
		for (const [code, chars] of Object.entries(LAYOUTS[layoutId].keys)) {
			if (!map.has(chars.base)) map.set(chars.base, { code, shift: false });
			if (!map.has(chars.shift)) map.set(chars.shift, { code, shift: true });
		}
		reverseMapCache.set(layoutId, map);
	}
	return map;
}
