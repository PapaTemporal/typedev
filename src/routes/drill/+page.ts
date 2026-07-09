import { api } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch }) => {
	const layout = url.searchParams.get('layout') ?? 'qwerty';
	const board = url.searchParams.get('board') ?? 'ansi';
	return api.getDrill(fetch, layout, board);
};
