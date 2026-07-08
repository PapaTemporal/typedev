const HEADING_PREFIX = /^[ \t]*(CHAPTER|Chapter|LETTER|Letter|STAVE|Stave|BOOK|PART)\s+[IVXLCDM\d]+/;

/**
 * Clean a Project Gutenberg book body for typing practice:
 * - drop [Illustration: ...] placeholders and "* * *" separator lines
 * - unwrap _underscore emphasis_
 * - cut the title page and table of contents, starting the text at the first
 *   real chapter heading (the second occurrence of the first heading when a
 *   TOC repeats it, or the repeated first Contents entry as a fallback)
 */
export function cleanGutenberg(text: string): string {
	let t = text.replace(/\r\n?/g, '\n');
	t = t.replace(/\[Illustration[^\]]*\]/gs, '');
	t = t.replace(/^[ \t]*\*(?:[ \t]+\*)+[ \t]*$/gm, '');
	t = t.replace(/_([^_\n]{1,120}?)_/g, '$1');

	const cut = findBodyStart(t);
	if (cut > 0) t = t.slice(cut);
	return t.trim();
}

function findBodyStart(t: string): number {
	const lines = t.split('\n');
	const offsets: number[] = [];
	let pos = 0;
	for (const line of lines) {
		offsets.push(pos);
		pos += line.length + 1;
	}

	// Primary: chapter-style headings. With a TOC the first heading label
	// repeats where the body begins; without one, the first heading is the body.
	const headings: { index: number; label: string }[] = [];
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(HEADING_PREFIX);
		if (m) headings.push({ index: i, label: m[0].trim().toUpperCase() });
	}
	if (headings.length > 0) {
		const first = headings[0];
		const repeat = headings.find((h) => h !== first && h.label === first.label);
		return offsets[(repeat ?? first).index];
	}

	// Fallback: a Contents section whose first entry repeats at the body.
	const contentsIdx = lines.findIndex((l) => /^\s*contents\s*$/i.test(l));
	if (contentsIdx >= 0) {
		const entryIdx = lines.findIndex((l, i) => i > contentsIdx && l.trim().length > 0);
		if (entryIdx >= 0) {
			const entry = lines[entryIdx].trim();
			const bodyIdx = lines.findIndex((l, i) => i > entryIdx && l.trim() === entry);
			if (bodyIdx >= 0) return offsets[bodyIdx];
		}
	}
	return 0;
}
