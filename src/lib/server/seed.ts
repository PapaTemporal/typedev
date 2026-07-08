// Relative imports (not $lib) so scripts/seed.ts can run this through tsx too.
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanGutenberg } from '../typing/gutenberg';
import { normalize, unwrapParagraphs } from '../typing/normalize';
import { paginate } from '../typing/paginate';
import { db } from './db';
import { contents, pages, progress } from './db/schema';

interface ManifestEntry {
	file: string;
	title: string;
	language?: string;
	difficulty: number;
	source?: string;
	license?: string;
	author?: string;
}

export interface SeedResult {
	id: string;
	pageCount: number;
}

/**
 * Rebuild the library from content/ manifests. Idempotent: contents are
 * upserted by slug and their pages replaced; sessions/charStats/progress are
 * left alone (positions get clamped if a book shrank).
 */
export async function seedAll(): Promise<SeedResult[]> {
	migrate(db, { migrationsFolder: 'drizzle' });
	const results: SeedResult[] = [];
	results.push(...(await seedDir('content/code', 'code')));
	results.push(...(await seedDir('content/books', 'book')));
	return results;
}

async function seedDir(dir: string, kind: 'code' | 'book'): Promise<SeedResult[]> {
	const manifest: ManifestEntry[] = JSON.parse(
		readFileSync(path.join(dir, 'manifest.json'), 'utf8')
	);
	const results: SeedResult[] = [];
	for (const entry of manifest) {
		const raw = readFileSync(path.join(dir, entry.file), 'utf8');
		const text =
			kind === 'book' ? unwrapParagraphs(normalize(cleanGutenberg(raw))) : normalize(raw);
		const pageTexts = paginate(text, kind === 'book' ? 'prose' : 'code');
		if (pageTexts.length === 0) continue;
		const prefix = kind === 'book' ? 'books' : 'code';
		const id = `${prefix}/${entry.file.replace(/\.[^.]+$/, '')}`;

		const row = {
			kind,
			title: entry.title,
			language: entry.language ?? null,
			difficulty: entry.difficulty,
			source: entry.source ?? null,
			license: entry.license ?? null,
			author: entry.author ?? null,
			pageCount: pageTexts.length,
			createdAt: Date.now()
		};
		await db
			.insert(contents)
			.values({ id, ...row })
			.onConflictDoUpdate({ target: contents.id, set: row });
		await db.delete(pages).where(eq(pages.contentId, id));
		for (let i = 0; i < pageTexts.length; i += 100) {
			await db.insert(pages).values(
				pageTexts.slice(i, i + 100).map((pageText, j) => ({
					contentId: id,
					pageIndex: i + j,
					text: pageText
				}))
			);
		}
		// If a re-seed shrank the page count, clamp any saved position.
		const prog = await db.query.progress.findFirst({ where: eq(progress.contentId, id) });
		if (prog && prog.pageIndex >= pageTexts.length) {
			await db
				.update(progress)
				.set({ pageIndex: 0, completed: true, updatedAt: Date.now() })
				.where(eq(progress.contentId, id));
		}
		results.push({ id, pageCount: pageTexts.length });
	}
	return results;
}
