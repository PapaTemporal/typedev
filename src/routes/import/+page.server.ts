import { fail, redirect } from '@sveltejs/kit';
import { createBookContent, createCustomContent } from '$lib/server/content';
import { fetchGithubFile } from '$lib/server/github';
import {
	fetchBookUrl,
	fetchGutenbergText,
	searchGutendex,
	stripBoilerplate
} from '$lib/server/gutenberg';
import type { Actions } from './$types';

export const actions: Actions = {
	paste: async ({ request }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const content = String(form.get('content') ?? '');
		const mode = form.get('mode') === 'code' ? 'code' : 'prose';
		if (!title) return fail(400, { form: 'paste', error: 'Give it a title.' });
		if (content.trim().length < 20) {
			return fail(400, { form: 'paste', error: 'Paste at least a few sentences or lines.' });
		}
		let id: string;
		try {
			id = await createCustomContent({ title, rawText: content, mode });
		} catch (e) {
			return fail(400, { form: 'paste', error: e instanceof Error ? e.message : 'Import failed.' });
		}
		redirect(303, `/practice/${id}`);
	},

	github: async ({ request }) => {
		const form = await request.formData();
		const url = String(form.get('url') ?? '').trim();
		if (!url) return fail(400, { form: 'github', error: 'Paste a GitHub file URL.' });
		let id: string;
		try {
			const file = await fetchGithubFile(url);
			id = await createCustomContent({
				title: file.fileName,
				rawText: file.text,
				mode: 'code',
				language: file.language,
				difficulty: file.difficulty,
				source: file.source
			});
		} catch (e) {
			return fail(400, {
				form: 'github',
				error: e instanceof Error ? e.message : 'Import failed.'
			});
		}
		redirect(303, `/practice/${id}`);
	},

	bookSearch: async ({ request }) => {
		const form = await request.formData();
		const query = String(form.get('q') ?? '').trim();
		if (!query) return fail(400, { form: 'bookSearch', error: 'Type a title or author.' });
		try {
			const results = await searchGutendex(query);
			if (results.length === 0) {
				return fail(404, { form: 'bookSearch', error: 'No matches in the catalog.', query });
			}
			return { form: 'bookSearch', results, query };
		} catch (e) {
			return fail(502, {
				form: 'bookSearch',
				error: e instanceof Error ? e.message : 'Catalog search failed.',
				query
			});
		}
	},

	bookImport: async ({ request }) => {
		const form = await request.formData();
		const gutenbergId = Number(form.get('gutenbergId'));
		const title = String(form.get('title') ?? '').trim();
		const author = String(form.get('author') ?? '').trim() || null;
		if (!gutenbergId || !title) {
			return fail(400, { form: 'bookSearch', error: 'Missing book id or title.' });
		}
		let id: string;
		try {
			const raw = await fetchGutenbergText(gutenbergId);
			id = await createBookContent({
				title,
				author,
				source: `https://www.gutenberg.org/ebooks/${gutenbergId}`,
				rawText: stripBoilerplate(raw)
			});
		} catch (e) {
			return fail(502, {
				form: 'bookSearch',
				error: e instanceof Error ? e.message : 'Download failed.'
			});
		}
		redirect(303, `/practice/${id}`);
	},

	bookUrl: async ({ request }) => {
		const form = await request.formData();
		const url = String(form.get('url') ?? '').trim();
		const title = String(form.get('title') ?? '').trim();
		if (!url || !title) {
			return fail(400, { form: 'bookUrl', error: 'Both a URL and a title are needed.' });
		}
		let id: string;
		try {
			const raw = await fetchBookUrl(url);
			id = await createBookContent({
				title,
				source: url,
				rawText: stripBoilerplate(raw)
			});
		} catch (e) {
			return fail(400, {
				form: 'bookUrl',
				error: e instanceof Error ? e.message : 'Import failed.'
			});
		}
		redirect(303, `/practice/${id}`);
	}
};
