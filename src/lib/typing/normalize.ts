const CHAR_MAP: Record<string, string> = {
	'‘': "'", // ' left single quote
	'’': "'", // ' right single quote / apostrophe
	'“': '"', // " left double quote
	'”': '"', // " right double quote
	'–': '-', // – en dash
	'—': '-', // — em dash
	'…': '...', // … ellipsis
	' ': ' ' // non-breaking space
};

export interface NormalizeOptions {
	tabWidth?: number;
}

/**
 * Make raw text typeable: LF-only line endings, tabs expanded to spaces,
 * typographic punctuation mapped to ASCII, trailing whitespace stripped,
 * runs of blank lines collapsed, and any remaining non-typeable characters
 * (outside printable ASCII + newline) dropped.
 */
export function normalize(raw: string, options: NormalizeOptions = {}): string {
	const tabWidth = options.tabWidth ?? 4;
	let text = raw.replace(/\r\n?/g, '\n');
	text = text.replace(/\t/g, ' '.repeat(tabWidth));
	text = text.replace(/[‘’“”–—… ]/g, (ch) => CHAR_MAP[ch]);
	// eslint-disable-next-line no-control-regex
	text = text.replace(/[^\x20-\x7e\n]/g, '');
	text = text
		.split('\n')
		.map((line) => line.replace(/\s+$/, ''))
		.join('\n');
	text = text.replace(/\n{3,}/g, '\n\n');
	return text.trim();
}

/**
 * Join hard-wrapped lines within paragraphs into single lines (for prose
 * sources like Project Gutenberg that wrap at ~72 columns). Blank-line
 * paragraph breaks are preserved.
 */
export function unwrapParagraphs(text: string): string {
	return text.replace(/(?<!\n)\n(?!\n)/g, ' ');
}
