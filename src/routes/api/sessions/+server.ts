import { json } from '@sveltejs/kit';
import { saveSession, type SessionPayload } from '$lib/server/stats';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const payload = (await request.json()) as SessionPayload;
	if (
		typeof payload.wpm !== 'number' ||
		typeof payload.durationMs !== 'number' ||
		!['book', 'code', 'custom', 'drill'].includes(payload.kind) ||
		!Array.isArray(payload.charTally)
	) {
		return json({ error: 'invalid payload' }, { status: 400 });
	}
	await saveSession({ ...payload, board: payload.board || 'ansi' });
	return json({ ok: true });
};
