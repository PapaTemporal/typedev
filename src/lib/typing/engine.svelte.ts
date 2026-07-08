import { accuracyPct, grossWpm } from './metrics';

export const PENDING = 0;
export const CORRECT = 1;
export const WRONG = 2;

/** No keystrokes for this long → auto-pause, backdated to the last keystroke + this grace. */
export const IDLE_MS = 5000;

export interface CharTally {
	hits: number;
	errors: number;
}

export interface EngineOptions {
	/** When true, a wrong keystroke does not advance; it must be corrected first. */
	mustCorrect?: boolean;
}

export interface SessionResult {
	wpm: number;
	rawWpm: number;
	accuracy: number;
	durationMs: number;
	charCount: number;
	errorCount: number;
	charTally: Map<string, CharTally>;
}

/**
 * Positions the user must actually type. Leading whitespace on each line is
 * excluded, so advancing past a `\n` lands directly on the first real
 * character of the next line (auto-skip indentation), and skipped whitespace
 * never inflates WPM. `\n` itself is typeable and matched by Enter.
 */
export function computeTypeable(text: string): number[] {
	const result: number[] = [];
	let atLineStart = true;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === '\n') {
			result.push(i);
			atLineStart = true;
			continue;
		}
		if (atLineStart && (ch === ' ' || ch === '\t')) continue;
		atLineStart = false;
		result.push(i);
	}
	return result;
}

export class TypingEngine {
	readonly text: string;
	readonly typeable: readonly number[] = [];
	private readonly mustCorrect: boolean;

	pos = $state(0);
	status = $state<number[]>([]);
	startedAt = $state<number | null>(null);
	now = $state(0);
	finished = $state(false);
	totalKeystrokes = $state(0);
	errorKeystrokes = $state(0);
	/** Advanced-past positions currently left WRONG (only in non-mustCorrect mode). */
	uncorrected = $state(0);
	/** Set while the window is blurred or the typist went idle, so away-time doesn't tank WPM. */
	pausedAt: number | null = $state(null);
	private lastInputAt = 0;

	/** Lifetime per-expected-char hits/errors for this session (not reactive). */
	readonly charTally = new Map<string, CharTally>();

	elapsedMs = $derived(this.startedAt === null ? 0 : this.now - this.startedAt);
	wpm = $derived(grossWpm(this.pos - this.uncorrected, this.elapsedMs));
	rawWpm = $derived(grossWpm(this.totalKeystrokes, this.elapsedMs));
	accuracy = $derived(accuracyPct(this.totalKeystrokes, this.errorKeystrokes));
	progress = $derived(this.typeable.length === 0 ? 1 : this.pos / this.typeable.length);

	constructor(text: string, options: EngineOptions = {}) {
		this.text = text;
		this.typeable = computeTypeable(text);
		this.mustCorrect = options.mustCorrect ?? false;
		this.status = new Array<number>(text.length).fill(PENDING);
	}

	pause(): void {
		if (this.startedAt !== null && !this.finished && this.pausedAt === null) {
			this.pausedAt = Date.now();
		}
	}

	resume(): void {
		if (this.pausedAt !== null && this.startedAt !== null) {
			this.startedAt += Date.now() - this.pausedAt;
			this.now = Date.now();
		}
		this.pausedAt = null;
	}

	input(char: string): void {
		if (this.finished || this.typeable.length === 0) return;
		if (this.pausedAt !== null) this.resume();
		if (this.startedAt === null) {
			this.startedAt = Date.now();
			this.now = this.startedAt;
		}
		this.lastInputAt = Date.now();
		const idx = this.typeable[this.pos];
		const expected = this.text[idx];
		this.totalKeystrokes++;
		const tally = this.tallyFor(expected);
		tally.hits++;
		if (char === expected) {
			this.status[idx] = CORRECT;
			this.advance();
		} else {
			this.errorKeystrokes++;
			tally.errors++;
			this.status[idx] = WRONG;
			if (!this.mustCorrect) {
				this.uncorrected++;
				this.advance();
			}
		}
	}

	backspace(): void {
		if (this.finished) return;
		if (this.pausedAt !== null) this.resume();
		if (this.startedAt !== null) this.lastInputAt = Date.now();
		if (this.mustCorrect && this.pos < this.typeable.length) {
			const idx = this.typeable[this.pos];
			if (this.status[idx] === WRONG) {
				this.status[idx] = PENDING;
				return;
			}
		}
		if (this.pos === 0) return;
		this.pos--;
		const idx = this.typeable[this.pos];
		if (this.status[idx] === WRONG) this.uncorrected--;
		this.status[idx] = PENDING;
	}

	/**
	 * Refresh the clock; call from a UI interval while the session is active.
	 * If the typist has been idle past the grace period, auto-pause — backdated
	 * to lastInput + IDLE_MS, so on resume only the grace period ever counts.
	 */
	tick(): void {
		if (this.startedAt === null || this.finished || this.pausedAt !== null) return;
		const t = Date.now();
		if (t - this.lastInputAt > IDLE_MS) {
			this.pausedAt = this.lastInputAt + IDLE_MS;
			this.now = this.pausedAt;
			return;
		}
		this.now = t;
	}

	result(): SessionResult {
		return {
			wpm: this.wpm,
			rawWpm: this.rawWpm,
			accuracy: this.accuracy,
			durationMs: this.elapsedMs,
			charCount: this.typeable.length,
			errorCount: this.errorKeystrokes,
			charTally: this.charTally
		};
	}

	private advance(): void {
		this.pos++;
		if (this.pos === this.typeable.length) {
			this.now = Date.now();
			this.finished = true;
		}
	}

	private tallyFor(char: string): CharTally {
		let tally = this.charTally.get(char);
		if (!tally) {
			tally = { hits: 0, errors: 0 };
			this.charTally.set(char, tally);
		}
		return tally;
	}
}
