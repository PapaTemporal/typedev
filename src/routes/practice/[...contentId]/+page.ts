import { error } from '@sveltejs/kit';
import { api } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url, fetch }) => {
	const pageIndex = Math.max(0, Number(url.searchParams.get('page') ?? '0') || 0);
	const data = await api.getPractice(fetch, params.contentId, pageIndex);
	if (!data) error(404, 'Content or page not found');
	return data;
};
