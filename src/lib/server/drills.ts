import { and, eq, gte } from 'drizzle-orm';
import { pickWeakChars } from '$lib/typing/drills';
import { db } from './db';
import { charStats } from './db/schema';

export { generateDrill } from '$lib/typing/drills';

export async function getWeakChars(
	layout: string,
	board: string
): Promise<{ chars: string[]; fromHistory: boolean }> {
	const rows = await db
		.select({ char: charStats.char, hits: charStats.hits, errors: charStats.errors })
		.from(charStats)
		.where(
			and(eq(charStats.layout, layout), eq(charStats.board, board), gte(charStats.errors, 1))
		);
	return pickWeakChars(rows);
}
