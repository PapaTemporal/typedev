// localStorage-backed persistence for the static (GitHub Pages) build.
// Mirrors the SQLite tables: sessions, char_stats, progress, plus imported content.
import { browser } from '$app/environment';
import type {
	CharStatRowData,
	ContentMeta,
	DashboardSession,
	SessionPayload
} from './types';

const KEYS = {
	sessions: 'typelit-dev:sessions',
	charStats: 'typelit-dev:char-stats',
	progress: 'typelit-dev:progress',
	custom: 'typelit-dev:custom-content'
};

export interface LocalProgress {
	pageIndex: number;
	completed: boolean;
}

export interface LocalContent {
	content: ContentMeta;
	pages: string[];
	difficulty: number;
}

type StoredSession = DashboardSession & { contentId: string | null };
type CharStatsMap = Record<string, { hits: number; errors: number }>; // `${board}|${layout}|${char}`

function read<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		return { ...fallback, ...JSON.parse(localStorage.getItem(key) ?? 'null') } as T;
	} catch {
		return fallback;
	}
}

function readArray<T>(key: string): T[] {
	if (!browser) return [];
	try {
		const v = JSON.parse(localStorage.getItem(key) ?? '[]');
		return Array.isArray(v) ? v : [];
	} catch {
		return [];
	}
}

function write(key: string, value: unknown): void {
	if (browser) localStorage.setItem(key, JSON.stringify(value));
}

export function getSessions(): DashboardSession[] {
	return readArray<StoredSession>(KEYS.sessions);
}

export function getCharStatRows(): CharStatRowData[] {
	const map = read<CharStatsMap>(KEYS.charStats, {});
	return Object.entries(map).map(([key, v]) => {
		const [board, layout, ...charParts] = key.split('|');
		return { board, layout, char: charParts.join('|'), hits: v.hits, errors: v.errors };
	});
}

export function getProgressMap(): Record<string, LocalProgress> {
	return read<Record<string, LocalProgress>>(KEYS.progress, {});
}

export function getCustomContents(): Record<string, LocalContent> {
	return read<Record<string, LocalContent>>(KEYS.custom, {});
}

export function putCustomContent(id: string, content: LocalContent): void {
	write(KEYS.custom, { ...getCustomContents(), [id]: content });
}

/** Apply a completed session: history, per-char aggregates, and resume position. */
export function applySession(payload: SessionPayload): void {
	const sessions = readArray<StoredSession>(KEYS.sessions);
	sessions.push({
		id: Date.now(),
		contentId: payload.contentId,
		kind: payload.kind,
		title: payload.title ?? null,
		wpm: payload.wpm,
		rawWpm: payload.rawWpm,
		accuracy: payload.accuracy,
		durationMs: payload.durationMs,
		board: payload.board,
		completedAt: Date.now()
	});
	write(KEYS.sessions, sessions);

	const map = read<CharStatsMap>(KEYS.charStats, {});
	for (const tally of payload.charTally) {
		const key = `${payload.board}|${payload.layout}|${tally.char}`;
		const agg = map[key] ?? { hits: 0, errors: 0 };
		map[key] = { hits: agg.hits + tally.hits, errors: agg.errors + tally.errors };
	}
	write(KEYS.charStats, map);

	if (payload.contentId !== null && payload.pageIndex !== null && payload.pageCount) {
		const progress = getProgressMap();
		const existing = progress[payload.contentId];
		const nextPage = payload.pageIndex + 1;
		const completed = nextPage >= payload.pageCount;
		// Never move a saved position backwards by retyping an earlier page.
		if (existing && !completed && !existing.completed && existing.pageIndex >= nextPage) return;
		progress[payload.contentId] = {
			pageIndex: completed ? 0 : nextPage,
			completed
		};
		write(KEYS.progress, progress);
	}
}
