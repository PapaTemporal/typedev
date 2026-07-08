const PROSE_TARGET = 400;
const PROSE_HARD_MAX = 650;
const CODE_TARGET = 350;

export type PaginateKind = 'prose' | 'code';

export function paginate(text: string, kind: PaginateKind): string[] {
	const pages = kind === 'code' ? paginateCode(text) : paginateProse(text);
	return pages.map((p) => p.trim()).filter((p) => p.length > 0);
}

/** Accumulate paragraphs to ~PROSE_TARGET chars; sentence-split any paragraph too large on its own. */
function paginateProse(text: string): string[] {
	const paragraphs = text.split(/\n{2,}/);
	const chunks: string[] = [];
	for (const para of paragraphs) {
		if (para.length > PROSE_HARD_MAX) {
			chunks.push(...splitSentences(para));
		} else {
			chunks.push(para);
		}
	}
	return accumulate(chunks, '\n\n', PROSE_TARGET);
}

function splitSentences(para: string): string[] {
	const sentences = para.split(/(?<=[.!?])\s+/);
	return accumulate(sentences, ' ', PROSE_TARGET);
}

/** Accumulate whole lines to ~CODE_TARGET chars; never split mid-line. */
function paginateCode(text: string): string[] {
	return accumulate(text.split('\n'), '\n', CODE_TARGET);
}

function accumulate(parts: string[], joiner: string, target: number): string[] {
	const pages: string[] = [];
	let current = '';
	for (const part of parts) {
		if (current.length > 0 && current.length + joiner.length + part.length > target) {
			pages.push(current);
			current = part;
		} else {
			current = current.length > 0 ? current + joiner + part : part;
		}
	}
	if (current.trim().length > 0) pages.push(current);
	return pages;
}
