import { json } from '@sveltejs/kit';
import { getContentPage } from '$lib/server/content';
import { getCharStats } from '$lib/server/stats';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const pageIndex = Math.max(0, Number(url.searchParams.get('page') ?? '0') || 0);
	const result = await getContentPage(params.contentId, pageIndex);
	if (!result) return json({ error: 'Content or page not found' }, { status: 404 });
	return json({
		content: {
			id: result.content.id,
			kind: result.content.kind,
			title: result.content.title,
			language: result.content.language,
			author: result.content.author,
			source: result.content.source,
			pageCount: result.content.pageCount
		},
		pageIndex,
		pageText: result.page.text,
		charStats: await getCharStats()
	});
};
