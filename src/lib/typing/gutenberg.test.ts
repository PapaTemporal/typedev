import { describe, expect, it } from 'vitest';
import { cleanGutenberg } from './gutenberg';

// Synthetic stand-in for a Gutenberg file: title page, TOC, then body.
const FAKE_BOOK = [
	'The Example Book',
	'',
	'by Ann Author',
	'',
	'[Illustration: The example cover]',
	'',
	'CONTENTS',
	'',
	'CHAPTER I. The Beginning',
	'CHAPTER II. The Middle',
	'',
	'CHAPTER I.',
	'The Beginning',
	'',
	'It was a _very_ plain morning when things started happening.',
	'',
	'*  *  *',
	'',
	'[Illustration: A plain morning]',
	'',
	'More things happened after that.'
].join('\n');

describe('cleanGutenberg', () => {
	it('cuts the title page and TOC, starting at the real first chapter', () => {
		const cleaned = cleanGutenberg(FAKE_BOOK);
		expect(cleaned.startsWith('CHAPTER I.\nThe Beginning')).toBe(true);
		expect(cleaned).not.toContain('The Example Book');
		expect(cleaned).not.toContain('CONTENTS');
		expect(cleaned).not.toContain('CHAPTER II. The Middle'); // TOC entry gone
	});

	it('removes illustration placeholders and separator lines', () => {
		const cleaned = cleanGutenberg(FAKE_BOOK);
		expect(cleaned).not.toContain('[Illustration');
		expect(cleaned).not.toMatch(/^\s*\*\s+\*/m);
	});

	it('unwraps underscore emphasis', () => {
		const cleaned = cleanGutenberg(FAKE_BOOK);
		expect(cleaned).toContain('a very plain morning');
		expect(cleaned).not.toContain('_very_');
	});

	it('starts at the first heading when there is no TOC', () => {
		const book = ['A Title Page', '', 'Chapter 1', '', 'Body text here.'].join('\n');
		expect(cleanGutenberg(book).startsWith('Chapter 1')).toBe(true);
	});

	it('uses the Contents fallback for books without chapter keywords', () => {
		const book = [
			'A Title Page',
			'',
			'Contents',
			'',
			'THE FIRST SECTION',
			'THE SECOND SECTION',
			'',
			'THE FIRST SECTION',
			'',
			'Actual body text.'
		].join('\n');
		const cleaned = cleanGutenberg(book);
		expect(cleaned.startsWith('THE FIRST SECTION\n\nActual body text.')).toBe(true);
	});

	it('leaves text without headings or contents untouched (minus markup)', () => {
		const book = 'Just some plain text.\n\nAnother paragraph.';
		expect(cleanGutenberg(book)).toBe(book);
	});
});
