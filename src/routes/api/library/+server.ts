import { json } from '@sveltejs/kit';
import { getLibrary } from '$lib/server/content';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => json(await getLibrary());
