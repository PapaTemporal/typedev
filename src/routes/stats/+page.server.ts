import { getDashboardSessions } from '$lib/server/stats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { sessions: await getDashboardSessions() };
};
