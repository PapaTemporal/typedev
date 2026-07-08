import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CORRECT, IDLE_MS, PENDING, TypingEngine, WRONG, computeTypeable } from './engine.svelte';

function typeAll(engine: TypingEngine, text: string) {
	for (const ch of text) engine.input(ch);
}

describe('computeTypeable', () => {
	it('includes every position of plain prose', () => {
		expect(computeTypeable('abc')).toEqual([0, 1, 2]);
	});

	it('includes newlines but skips leading indentation', () => {
		const text = 'fn main() {\n    let x = 1;\n}';
		const typeable = computeTypeable(text);
		expect(typeable).toContain(11); // the \n
		expect(typeable).not.toContain(12); // four spaces of indent
		expect(typeable).not.toContain(15);
		expect(typeable).toContain(16); // 'l' of let
	});

	it('skips indentation at the very start of the text', () => {
		expect(computeTypeable('  ab')).toEqual([2, 3]);
	});

	it('treats blank lines as a single Enter', () => {
		const text = 'a\n\nb';
		expect(computeTypeable(text)).toEqual([0, 1, 2, 3]);
	});

	it('skips whitespace-only line content but keeps its newline', () => {
		const text = 'a\n   \nb';
		expect(computeTypeable(text)).toEqual([0, 1, 5, 6]);
	});
});

describe('TypingEngine', () => {
	it('completes when all typeable chars are typed correctly', () => {
		const engine = new TypingEngine('hi');
		engine.input('h');
		expect(engine.finished).toBe(false);
		engine.input('i');
		expect(engine.finished).toBe(true);
		expect(engine.accuracy).toBe(100);
		expect(engine.errorKeystrokes).toBe(0);
	});

	it('marks wrong chars and advances by default (typelit-style)', () => {
		const engine = new TypingEngine('ab');
		engine.input('x');
		expect(engine.status[0]).toBe(WRONG);
		expect(engine.pos).toBe(1);
		expect(engine.uncorrected).toBe(1);
	});

	it('backspace clears status and un-counts the error', () => {
		const engine = new TypingEngine('ab');
		engine.input('x');
		engine.backspace();
		expect(engine.pos).toBe(0);
		expect(engine.status[0]).toBe(PENDING);
		expect(engine.uncorrected).toBe(0);
		engine.input('a');
		expect(engine.status[0]).toBe(CORRECT);
	});

	it('accuracy counts corrected mistakes', () => {
		const engine = new TypingEngine('ab');
		engine.input('x');
		engine.backspace();
		engine.input('a');
		engine.input('b');
		expect(engine.finished).toBe(true);
		// 3 char keystrokes, 1 error
		expect(engine.accuracy).toBeCloseTo((2 / 3) * 100, 5);
	});

	it('does not advance on error in mustCorrect mode', () => {
		const engine = new TypingEngine('ab', { mustCorrect: true });
		engine.input('x');
		expect(engine.pos).toBe(0);
		expect(engine.status[0]).toBe(WRONG);
		engine.input('a');
		expect(engine.pos).toBe(1);
		expect(engine.status[0]).toBe(CORRECT);
	});

	it('backspace in mustCorrect mode clears the wrong marker without moving', () => {
		const engine = new TypingEngine('ab', { mustCorrect: true });
		engine.input('a');
		engine.input('x');
		engine.backspace();
		expect(engine.pos).toBe(1);
		expect(engine.status[1]).toBe(PENDING);
		engine.backspace();
		expect(engine.pos).toBe(0);
	});

	it('Enter matches newline and skips the next line indentation', () => {
		const text = 'a {\n    b\n}';
		const engine = new TypingEngine(text);
		typeAll(engine, 'a {');
		engine.input('\n');
		// caret should now be at the 'b' (index 8), not the indent (index 4)
		expect(engine.typeable[engine.pos]).toBe(8);
		engine.input('b');
		engine.input('\n');
		engine.input('}');
		expect(engine.finished).toBe(true);
		expect(engine.accuracy).toBe(100);
	});

	it('backspace across a newline returns to the newline itself', () => {
		const text = 'a\n    b';
		const engine = new TypingEngine(text);
		engine.input('a');
		engine.input('\n');
		engine.input('b');
		expect(engine.finished).toBe(true);
	});

	it('skipped whitespace never counts toward charCount', () => {
		const text = 'a\n        b';
		const engine = new TypingEngine(text);
		expect(engine.typeable.length).toBe(3); // 'a', '\n', 'b'
	});

	it('tracks per-char tallies keyed by expected char', () => {
		const engine = new TypingEngine('aa');
		engine.input('x');
		engine.backspace();
		engine.input('a');
		engine.input('a');
		const tally = engine.charTally.get('a');
		expect(tally).toEqual({ hits: 3, errors: 1 });
	});

	it('backspace at position 0 is a no-op', () => {
		const engine = new TypingEngine('ab');
		engine.backspace();
		expect(engine.pos).toBe(0);
	});

	it('input after finish is ignored', () => {
		const engine = new TypingEngine('a');
		engine.input('a');
		engine.input('b');
		expect(engine.totalKeystrokes).toBe(1);
	});

	it('pause freezes the clock and resume shifts startedAt forward', () => {
		const engine = new TypingEngine('abc');
		engine.input('a');
		const startedBefore = engine.startedAt!;
		engine.pause();
		expect(engine.pausedAt).not.toBeNull();
		engine.tick();
		engine.resume();
		expect(engine.pausedAt).toBeNull();
		expect(engine.startedAt!).toBeGreaterThanOrEqual(startedBefore);
	});

	it('typing while paused auto-resumes', () => {
		const engine = new TypingEngine('ab');
		engine.input('a');
		engine.pause();
		engine.input('b');
		expect(engine.pausedAt).toBeNull();
		expect(engine.finished).toBe(true);
	});

	it('pause before the first keystroke is a no-op', () => {
		const engine = new TypingEngine('ab');
		engine.pause();
		expect(engine.pausedAt).toBeNull();
	});
});

describe('idle auto-pause', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('pauses after IDLE_MS without keystrokes, backdated to lastInput + grace', () => {
		const t0 = 1_000_000;
		vi.setSystemTime(t0);
		const engine = new TypingEngine('abcdef');
		engine.input('a');
		vi.setSystemTime(t0 + 20_000);
		engine.tick();
		expect(engine.pausedAt).toBe(t0 + IDLE_MS);
		// clock frozen at the backdated pause point, not at 20s
		expect(engine.elapsedMs).toBe(IDLE_MS);
	});

	it('typing after an idle gap only ever charges the grace period', () => {
		const t0 = 1_000_000;
		vi.setSystemTime(t0);
		const engine = new TypingEngine('abcdef');
		engine.input('a');
		vi.setSystemTime(t0 + 60_000); // away for a minute
		engine.tick(); // idle detected
		engine.input('b'); // resumes
		vi.setSystemTime(t0 + 61_000);
		engine.tick();
		// 1s of real typing after resume + the 5s grace = 6s, not 61s
		expect(engine.elapsedMs).toBe(IDLE_MS + 1_000);
	});

	it('does not idle-pause while actively typing', () => {
		const t0 = 1_000_000;
		vi.setSystemTime(t0);
		const engine = new TypingEngine('abcdef');
		engine.input('a');
		vi.setSystemTime(t0 + 3_000);
		engine.input('b');
		vi.setSystemTime(t0 + 6_000); // 6s since start but only 3s since last key
		engine.tick();
		expect(engine.pausedAt).toBeNull();
		expect(engine.elapsedMs).toBe(6_000);
	});

	it('backspace also counts as activity and resumes', () => {
		const t0 = 1_000_000;
		vi.setSystemTime(t0);
		const engine = new TypingEngine('abc');
		engine.input('a');
		vi.setSystemTime(t0 + 30_000);
		engine.tick();
		expect(engine.pausedAt).not.toBeNull();
		engine.backspace();
		expect(engine.pausedAt).toBeNull();
	});

	it('blur pause followed by typing later charges nothing extra', () => {
		const t0 = 1_000_000;
		vi.setSystemTime(t0);
		const engine = new TypingEngine('abc');
		engine.input('a');
		vi.setSystemTime(t0 + 2_000);
		engine.pause(); // window blur
		vi.setSystemTime(t0 + 120_000);
		engine.input('b'); // resume by typing
		vi.setSystemTime(t0 + 121_000);
		engine.tick();
		expect(engine.elapsedMs).toBe(3_000); // 2s before blur + 1s after
	});
});
