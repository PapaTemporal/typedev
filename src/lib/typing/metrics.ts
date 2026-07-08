/** Gross words-per-minute using the standard 5-chars-per-word convention. */
export function grossWpm(chars: number, ms: number): number {
	if (ms <= 0 || chars <= 0) return 0;
	return chars / 5 / (ms / 60000);
}

/** Keystroke accuracy as a percentage. Errors count even when later corrected. */
export function accuracyPct(totalKeystrokes: number, errorKeystrokes: number): number {
	if (totalKeystrokes <= 0) return 100;
	return Math.max(0, 100 * (1 - errorKeystrokes / totalKeystrokes));
}
