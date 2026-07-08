import { fail } from '@sveltejs/kit';
import { seedAll } from '$lib/server/seed';
import type { Actions } from './$types';

export const actions: Actions = {
	seed: async () => {
		try {
			const results = await seedAll();
			return {
				seeded: results.length,
				pages: results.reduce((a, r) => a + r.pageCount, 0)
			};
		} catch (e) {
			return fail(500, {
				error: e instanceof Error ? e.message : 'Seeding failed.'
			});
		}
	}
};
