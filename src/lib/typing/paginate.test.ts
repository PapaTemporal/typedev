import { describe, expect, it } from 'vitest';
import { paginate } from './paginate';

describe('paginate code', () => {
	it('never splits a line across pages', () => {
		const lines = Array.from({ length: 60 }, (_, i) => `const value${i} = compute(${i});`);
		const pages = paginate(lines.join('\n'), 'code');
		expect(pages.length).toBeGreaterThan(1);
		const reassembled = pages.flatMap((p) => p.split('\n'));
		for (const line of reassembled) {
			expect(lines).toContain(line);
		}
	});

	it('keeps a short file on one page', () => {
		expect(paginate('a\nb\nc', 'code')).toEqual(['a\nb\nc']);
	});

	it('preserves inner indentation after page trim', () => {
		const text = 'fn a() {\n    body();\n}';
		const pages = paginate(text, 'code');
		expect(pages[0]).toContain('    body();');
	});
});

describe('paginate prose', () => {
	it('accumulates paragraphs to roughly the target size', () => {
		const para = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(3).trim(); // ~170 chars
		const text = Array.from({ length: 10 }, () => para).join('\n\n');
		const pages = paginate(text, 'prose');
		expect(pages.length).toBeGreaterThan(2);
		for (const page of pages) {
			expect(page.length).toBeLessThanOrEqual(700);
		}
	});

	it('splits an oversized single paragraph at sentence boundaries', () => {
		const sentence = 'She walked to the store and bought some bread. ';
		const huge = sentence.repeat(30).trim(); // ~1400 chars, one paragraph
		const pages = paginate(huge, 'prose');
		expect(pages.length).toBeGreaterThan(1);
		for (const page of pages) {
			expect(page.endsWith('.')).toBe(true);
		}
	});

	it('drops empty pages', () => {
		expect(paginate('\n\n\n', 'prose')).toEqual([]);
	});
});
