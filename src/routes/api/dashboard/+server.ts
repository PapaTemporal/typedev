import { json } from '@sveltejs/kit';
import { getDashboardSessions } from '$lib/server/stats';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => json(await getDashboardSessions());
