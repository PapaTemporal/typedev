import { api } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	return { library: await api.getLibrary(fetch) };
};
