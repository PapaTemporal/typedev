import { json } from '@sveltejs/kit';
import { seedAll } from '$lib/server/seed';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	try {
		const results = await seedAll();
		return json({
			seeded: results.length,
			pages: results.reduce((a, r) => a + r.pageCount, 0)
		});
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : 'Seeding failed.' }, { status: 500 });
	}
};
