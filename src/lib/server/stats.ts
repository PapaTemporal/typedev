import { asc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { charStats, contents, progress, sessions } from './db/schema';

export interface DashboardSession {
	id: number;
	kind: 'book' | 'code' | 'custom' | 'drill';
	title: string | null;
	wpm: number;
	rawWpm: number;
	accuracy: number;
	durationMs: number;
	board: string;
	completedAt: number;
}

export async function getDashboardSessions(): Promise<DashboardSession[]> {
	return db
		.select({
			id: sessions.id,
			kind: sessions.kind,
			title: contents.title,
			wpm: sessions.wpm,
			rawWpm: sessions.rawWpm,
			accuracy: sessions.accuracy,
			durationMs: sessions.durationMs,
			board: sessions.board,
			completedAt: sessions.completedAt
		})
		.from(sessions)
		.leftJoin(contents, eq(contents.id, sessions.contentId))
		.orderBy(asc(sessions.completedAt));
}

export interface SessionPayload {
	contentId: string | null;
	kind: 'book' | 'code' | 'custom' | 'drill';
	pageIndex: number | null;
	wpm: number;
	rawWpm: number;
	accuracy: number;
	durationMs: number;
	charCount: number;
	errorCount: number;
	layout: string;
	board: string;
	charTally: { char: string; hits: number; errors: number }[];
}

export async function getCharStats() {
	return db
		.select({
			char: charStats.char,
			layout: charStats.layout,
			board: charStats.board,
			hits: charStats.hits,
			errors: charStats.errors
		})
		.from(charStats);
}

export async function saveSession(payload: SessionPayload): Promise<void> {
	const now = Date.now();
	await db.insert(sessions).values({
		contentId: payload.contentId,
		kind: payload.kind,
		pageIndex: payload.pageIndex,
		wpm: payload.wpm,
		rawWpm: payload.rawWpm,
		accuracy: payload.accuracy,
		durationMs: payload.durationMs,
		charCount: payload.charCount,
		errorCount: payload.errorCount,
		layout: payload.layout,
		board: payload.board,
		completedAt: now
	});

	for (const tally of payload.charTally) {
		await db
			.insert(charStats)
			.values({
				char: tally.char,
				layout: payload.layout,
				board: payload.board,
				hits: tally.hits,
				errors: tally.errors,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: [charStats.char, charStats.layout, charStats.board],
				set: {
					hits: sql`${charStats.hits} + ${tally.hits}`,
					errors: sql`${charStats.errors} + ${tally.errors}`,
					updatedAt: now
				}
			});
	}

	if (payload.contentId !== null && payload.pageIndex !== null) {
		const content = await db.query.contents.findFirst({
			where: eq(contents.id, payload.contentId)
		});
		if (!content) return;
		const nextPage = payload.pageIndex + 1;
		const completed = nextPage >= content.pageCount;
		const existing = await db.query.progress.findFirst({
			where: eq(progress.contentId, payload.contentId)
		});
		// Never move a saved position backwards by retyping an earlier page.
		if (existing && !completed && existing.pageIndex >= nextPage && !existing.completed) return;
		await db
			.insert(progress)
			.values({
				contentId: payload.contentId,
				pageIndex: completed ? 0 : nextPage,
				completed,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: progress.contentId,
				set: {
					pageIndex: completed ? 0 : nextPage,
					completed,
					updatedAt: now
				}
			});
	}
}
