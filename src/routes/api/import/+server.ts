import { json } from '@sveltejs/kit';
import { createBookContent, createCustomContent } from '$lib/server/content';
import { fetchGithubFile } from '$lib/server/github';
import {
	fetchBookUrl,
	fetchGutenbergText,
	searchGutendex,
	stripBoilerplate
} from '$lib/server/gutenberg';
import type { RequestHandler } from './$types';

interface ImportBody {
	action: 'paste' | 'github' | 'book-search' | 'book' | 'book-url';
	title?: string;
	content?: string;
	mode?: string;
	url?: string;
	q?: string;
	id?: number;
	authors?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as ImportBody;
	try {
		switch (body.action) {
			case 'paste': {
				const title = body.title?.trim();
				if (!title || !body.content || body.content.trim().length < 20) {
					return json({ error: 'A title and at least a few lines are needed.' }, { status: 400 });
				}
				const id = await createCustomContent({
					title,
					rawText: body.content,
					mode: body.mode === 'code' ? 'code' : 'prose'
				});
				return json({ id });
			}
			case 'github': {
				if (!body.url) return json({ error: 'Missing URL.' }, { status: 400 });
				const file = await fetchGithubFile(body.url);
				const id = await createCustomContent({
					title: file.fileName,
					rawText: file.text,
					mode: 'code',
					language: file.language,
					difficulty: file.difficulty,
					source: file.source
				});
				return json({ id });
			}
			case 'book-search': {
				if (!body.q?.trim()) return json({ error: 'Type a title or author.' }, { status: 400 });
				const results = await searchGutendex(body.q.trim());
				return json({ results });
			}
			case 'book': {
				if (!body.id || !body.title) {
					return json({ error: 'Missing book id or title.' }, { status: 400 });
				}
				const raw = await fetchGutenbergText(body.id);
				const id = await createBookContent({
					title: body.title,
					author: body.authors || null,
					source: `https://www.gutenberg.org/ebooks/${body.id}`,
					rawText: stripBoilerplate(raw)
				});
				return json({ id });
			}
			case 'book-url': {
				if (!body.url || !body.title) {
					return json({ error: 'Both a URL and a title are needed.' }, { status: 400 });
				}
				const raw = await fetchBookUrl(body.url);
				const id = await createBookContent({
					title: body.title,
					source: body.url,
					rawText: stripBoilerplate(raw)
				});
				return json({ id });
			}
			default:
				return json({ error: 'Unknown import action.' }, { status: 400 });
		}
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Import failed.' }, { status: 502 });
	}
};
