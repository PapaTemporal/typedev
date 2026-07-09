import { json } from '@sveltejs/kit';
import { generateDrill, getWeakChars } from '$lib/server/drills';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const layout = url.searchParams.get('layout') ?? 'qwerty';
	const board = url.searchParams.get('board') ?? 'ansi';
	const weak = await getWeakChars(layout, board);
	return json({
		layout,
		board,
		weakChars: weak.chars,
		fromHistory: weak.fromHistory,
		text: generateDrill(weak.chars)
	});
};
