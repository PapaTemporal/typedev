import { STATIC_MODE } from '$lib/static-mode';
import { serverApi, type DataApi } from './server-api';
import { staticApi } from './static-api';

export type { DataApi };
export * from './types';

/** The active data layer: SQLite-backed endpoints locally, baked JSON + localStorage on Pages. */
export const api: DataApi = STATIC_MODE ? staticApi : serverApi;
