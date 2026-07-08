import { fail, redirect } from '@sveltejs/kit';
import { createCustomContent } from '$lib/server/content';
import { fetchGithubFile } from '$lib/server/github';
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
	}
};
