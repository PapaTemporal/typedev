import { describe, expect, it } from 'vitest';
import { normalize, unwrapParagraphs } from './normalize';

describe('normalize', () => {
	it('converts CRLF and CR to LF', () => {
		expect(normalize('a\r\nb\rc')).toBe('a\nb\nc');
	});

	it('expands tabs to spaces', () => {
		expect(normalize('\tx')).toBe('x'); // leading indent then trimmed at start
		expect(normalize('a\n\tb')).toBe('a\n    b');
		expect(normalize('a\n\tb', { tabWidth: 2 })).toBe('a\n  b');
	});

	it('maps typographic punctuation to ASCII', () => {
		expect(normalize('“Hi” ‘there’ – ok…')).toBe(
			'"Hi" \'there\' - ok...'
		);
	});

	it('strips trailing whitespace per line', () => {
		expect(normalize('a   \nb\t')).toBe('a\nb');
	});

	it('collapses 3+ blank lines to one blank line', () => {
		expect(normalize('a\n\n\n\nb')).toBe('a\n\nb');
	});

	it('drops non-typeable unicode', () => {
		expect(normalize('aéb \u{1f600} c')).toBe('ab  c');
	});

	it('trims leading/trailing whitespace overall', () => {
		expect(normalize('\n\n  hello\n\n')).toBe('hello');
	});
});

describe('unwrapParagraphs', () => {
	it('joins hard-wrapped lines but keeps paragraph breaks', () => {
		expect(unwrapParagraphs('a b\nc d\n\ne f')).toBe('a b c d\n\ne f');
	});
});
