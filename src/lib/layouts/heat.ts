import { reverseMap, type LayoutId } from './index';

export interface CharStatRow {
	char: string;
	layout: string;
	board: string;
	hits: number;
	errors: number;
}

const MIN_HITS_PER_KEY = 5;

/** Fold per-char error rates onto physical keys (base+shift share a keycap), scoped to one board. */
export function heatFromCharStats(
	rows: CharStatRow[],
	layoutId: LayoutId,
	board: string
): Map<string, number> {
	const reverse = reverseMap(layoutId);
	const perCode = new Map<string, { hits: number; errors: number }>();
	for (const row of rows) {
		if (row.layout !== layoutId || row.board !== board) continue;
		const loc = row.char === '\n' ? { code: 'Enter' } : reverse.get(row.char);
		if (!loc) continue;
		const agg = perCode.get(loc.code) ?? { hits: 0, errors: 0 };
		agg.hits += row.hits;
		agg.errors += row.errors;
		perCode.set(loc.code, agg);
	}
	const heat = new Map<string, number>();
	for (const [code, { hits, errors }] of perCode) {
		if (hits >= MIN_HITS_PER_KEY && errors > 0) heat.set(code, errors / hits);
	}
	return heat;
}
