import { and, asc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { normalize, unwrapParagraphs } from '$lib/typing/normalize';
import { paginate } from '$lib/typing/paginate';
import { db } from './db';
import { contents, pages, progress } from './db/schema';

export interface LibraryItem {
	id: string;
	kind: 'book' | 'code' | 'custom';
	title: string;
	language: string | null;
	difficulty: number;
	author: string | null;
	pageCount: number;
	resumePage: number | null;
	completed: boolean;
}

export async function getLibrary(): Promise<LibraryItem[]> {
	const rows = await db
		.select({
			id: contents.id,
			kind: contents.kind,
			title: contents.title,
			language: contents.language,
			difficulty: contents.difficulty,
			author: contents.author,
			pageCount: contents.pageCount,
			resumePage: progress.pageIndex,
			completed: progress.completed
		})
		.from(contents)
		.leftJoin(progress, eq(progress.contentId, contents.id))
		.orderBy(asc(contents.difficulty), asc(contents.title));
	return rows.map((r) => ({ ...r, completed: r.completed ?? false }));
}

export interface CustomContentInput {
	title: string;
	rawText: string;
	mode: 'prose' | 'code';
	language?: string | null;
	difficulty?: number;
	source?: string | null;
}

/** Normalize, paginate, and store pasted/fetched text. Returns the new content id. */
export async function createCustomContent(input: CustomContentInput): Promise<string> {
	let text = normalize(input.rawText);
	if (input.mode === 'prose') text = unwrapParagraphs(text);
	const pageTexts = paginate(text, input.mode);
	if (pageTexts.length === 0) {
		throw new Error('No typeable content found after cleanup.');
	}
	const id = `custom/${nanoid(10)}`;
	await db.insert(contents).values({
		id,
		kind: 'custom',
		title: input.title,
		language: input.language ?? null,
		difficulty: input.difficulty ?? 1,
		source: input.source ?? null,
		license: null,
		author: null,
		pageCount: pageTexts.length,
		createdAt: Date.now()
	});
	for (let i = 0; i < pageTexts.length; i += 100) {
		await db.insert(pages).values(
			pageTexts.slice(i, i + 100).map((pageText, j) => ({
				contentId: id,
				pageIndex: i + j,
				text: pageText
			}))
		);
	}
	return id;
}

export async function getContentPage(contentId: string, pageIndex: number) {
	const content = await db.query.contents.findFirst({ where: eq(contents.id, contentId) });
	if (!content) return null;
	const page = await db.query.pages.findFirst({
		where: and(eq(pages.contentId, contentId), eq(pages.pageIndex, pageIndex))
	});
	if (!page) return null;
	return { content, page };
}
