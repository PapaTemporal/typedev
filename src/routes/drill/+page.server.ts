import { generateDrill, getWeakChars } from '$lib/server/drills';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const layout = url.searchParams.get('layout') ?? 'qwerty';
	const board = url.searchParams.get('board') ?? 'ansi';
	const weak = await getWeakChars(layout, board);
	return {
		layout,
		board,
		weakChars: weak.chars,
		fromHistory: weak.fromHistory,
		text: generateDrill(weak.chars)
	};
};
