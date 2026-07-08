import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from './db';
import { charStats } from './db/schema';

const MIN_HITS = 20;
const WEAK_CHAR_COUNT = 8;
const DRILL_LENGTH = 300;
const FILLERS = 'etaoinsrhl';

/** Symbol digraphs kept intact so drills practice real code shapes. */
const SYMBOL_PAIRS: Record<string, string> = {
	'{': '{}',
	'}': '{}',
	'(': '()',
	')': '()',
	'[': '[]',
	']': '[]',
	'<': '<>',
	'>': '=>',
	'=': '=>',
	':': '::',
	'-': '->'
};

/** Default drill set when there isn't enough history yet: dev symbols. */
const DEFAULT_WEAK = ['{', '}', '(', ')', ';', '=', '>', '_'];

export async function getWeakChars(
	layout: string,
	board: string
): Promise<{ chars: string[]; fromHistory: boolean }> {
	const rows = await db
		.select({ char: charStats.char })
		.from(charStats)
		.where(
			and(
				eq(charStats.layout, layout),
				eq(charStats.board, board),
				gte(charStats.hits, MIN_HITS),
				gte(charStats.errors, 1)
			)
		)
		.orderBy(desc(sql`cast(${charStats.errors} as real) / ${charStats.hits}`))
		.limit(WEAK_CHAR_COUNT);
	const chars = rows.map((r) => r.char).filter((c) => c !== ' ' && c !== '\n');
	if (chars.length >= 3) return { chars, fromHistory: true };
	return { chars: DEFAULT_WEAK, fromHistory: false };
}

/** ~300 chars of pseudo-words, each containing 1-2 weak chars mixed with common fillers. */
export function generateDrill(weakChars: string[], length = DRILL_LENGTH): string {
	const words: string[] = [];
	let total = 0;
	while (total < length) {
		const word = generateWord(weakChars);
		words.push(word);
		total += word.length + 1;
	}
	return words.join(' ');
}

function pick<T>(arr: readonly T[] | string): T | string {
	return arr[Math.floor(Math.random() * arr.length)];
}

function generateWord(weakChars: string[]): string {
	const weak = pick(weakChars) as string;
	const pair = SYMBOL_PAIRS[weak];
	const coreLength = 2 + Math.floor(Math.random() * 4);
	let core = '';
	for (let i = 0; i < coreLength; i++) {
		// Weight toward weak chars: roughly 40% weak, 60% filler.
		core += Math.random() < 0.4 ? (pick(weakChars) as string) : (pick(FILLERS) as string);
	}
	if (pair) {
		// Wrap or append the digraph so symbol pairs are typed as they occur in code.
		return Math.random() < 0.5 ? pair[0] + core + pair[1] : core + pair;
	}
	const pos = Math.floor(Math.random() * (core.length + 1));
	return core.slice(0, pos) + weak + core.slice(pos);
}
