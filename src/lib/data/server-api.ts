// Server-mode data API: thin fetch wrappers over the SQLite-backed endpoints.
import { base } from '$app/paths';
import type {
	BookSearchResult,
	DashboardSession,
	DrillData,
	FetchFn,
	LibraryItem,
	PracticeData,
	SessionPayload
} from './types';

async function json<T>(res: Response): Promise<T> {
	const body = await res.json().catch(() => null);
	if (!res.ok) {
		throw new Error((body as { error?: string } | null)?.error ?? `Request failed (${res.status}).`);
	}
	return body as T;
}

export const serverApi = {
	getLibrary: (f: FetchFn) => f(`${base}/api/library`).then((r) => json<LibraryItem[]>(r)),

	getPractice: async (f: FetchFn, id: string, page: number): Promise<PracticeData | null> => {
		const res = await f(`${base}/api/content/${id}?page=${page}`);
		if (res.status === 404) return null;
		return json<PracticeData>(res);
	},

	getDashboard: (f: FetchFn) => f(`${base}/api/dashboard`).then((r) => json<DashboardSession[]>(r)),

	getDrill: (f: FetchFn, layout: string, board: string) =>
		f(`${base}/api/drill?layout=${layout}&board=${encodeURIComponent(board)}`).then((r) =>
			json<DrillData>(r)
		),

	saveSession: async (f: FetchFn, payload: SessionPayload): Promise<void> => {
		await json(
			await f(`${base}/api/sessions`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			})
		);
	},

	importPaste: (f: FetchFn, input: { title: string; content: string; mode: 'prose' | 'code' }) =>
		importAction<{ id: string }>(f, { action: 'paste', ...input }).then((r) => r.id),

	importGithub: (f: FetchFn, url: string) =>
		importAction<{ id: string }>(f, { action: 'github', url }).then((r) => r.id),

	searchBooks: (f: FetchFn, q: string) =>
		importAction<{ results: BookSearchResult[] }>(f, { action: 'book-search', q }).then(
			(r) => r.results
		),

	importGutenbergBook: (f: FetchFn, book: { id: number; title: string; authors: string }) =>
		importAction<{ id: string }>(f, { action: 'book', ...book }).then((r) => r.id),

	importBookUrl: (f: FetchFn, input: { url: string; title: string }) =>
		importAction<{ id: string }>(f, { action: 'book-url', ...input }).then((r) => r.id),

	reseed: (f: FetchFn) =>
		f(`${base}/api/seed`, { method: 'POST' }).then((r) =>
			json<{ seeded: number; pages: number }>(r)
		)
};

function importAction<T>(f: FetchFn, body: Record<string, unknown>): Promise<T> {
	return f(`${base}/api/import`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	}).then((r) => json<T>(r));
}

export type DataApi = typeof serverApi;
