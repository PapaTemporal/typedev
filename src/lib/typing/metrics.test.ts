import { describe, expect, it } from 'vitest';
import { accuracyPct, grossWpm } from './metrics';

describe('grossWpm', () => {
	it('computes 60 wpm for 300 chars in 1 minute', () => {
		expect(grossWpm(300, 60000)).toBe(60);
	});

	it('returns 0 for zero or negative elapsed time', () => {
		expect(grossWpm(100, 0)).toBe(0);
		expect(grossWpm(100, -5)).toBe(0);
	});

	it('returns 0 for zero chars', () => {
		expect(grossWpm(0, 60000)).toBe(0);
	});
});

describe('accuracyPct', () => {
	it('is 100 with no keystrokes', () => {
		expect(accuracyPct(0, 0)).toBe(100);
	});

	it('is 100 with no errors', () => {
		expect(accuracyPct(50, 0)).toBe(100);
	});

	it('computes proportional accuracy', () => {
		expect(accuracyPct(100, 10)).toBe(90);
	});

	it('never goes below 0', () => {
		expect(accuracyPct(10, 50)).toBe(0);
	});
});
