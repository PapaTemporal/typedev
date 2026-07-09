// Pure drill-generation logic, shared by the server (SQLite-backed weak-char
// query) and the static build (localStorage-backed).

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
export const DEFAULT_WEAK = ['{', '}', '(', ')', ';', '=', '>', '_'];

export interface CharAggregate {
	char: string;
	hits: number;
	errors: number;
}

/** Rank the typist's weakest characters; falls back to dev symbols with thin history. */
export function pickWeakChars(rows: CharAggregate[]): { chars: string[]; fromHistory: boolean } {
	const chars = rows
		.filter((r) => r.hits >= MIN_HITS && r.errors >= 1 && r.char !== ' ' && r.char !== '\n')
		.sort((a, b) => b.errors / b.hits - a.errors / a.hits)
		.slice(0, WEAK_CHAR_COUNT)
		.map((r) => r.char);
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

function pick(arr: readonly string[] | string): string {
	return arr[Math.floor(Math.random() * arr.length)];
}

function generateWord(weakChars: string[]): string {
	const weak = pick(weakChars);
	const pair = SYMBOL_PAIRS[weak];
	const coreLength = 2 + Math.floor(Math.random() * 4);
	let core = '';
	for (let i = 0; i < coreLength; i++) {
		// Weight toward weak chars: roughly 40% weak, 60% filler.
		core += Math.random() < 0.4 ? pick(weakChars) : pick(FILLERS);
	}
	if (pair) {
		// Wrap or append the digraph so symbol pairs are typed as they occur in code.
		return Math.random() < 0.5 ? pair[0] + core + pair[1] : core + pair;
	}
	const pos = Math.floor(Math.random() * (core.length + 1));
	return core.slice(0, pos) + weak + core.slice(pos);
}
