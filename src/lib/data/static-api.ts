// Static-mode data API (GitHub Pages build): content from baked JSON under
// /data, stats/progress/imports in localStorage. No server anywhere.
import { nanoid } from 'nanoid';
import { base } from '$app/paths';
import { difficultyForLanguage, languageFromPath, MAX_CODE_BYTES, toRawUrl } from '$lib/import/github-url';
import {
	GUTENBERG_MIRRORS,
	GUTENDEX_SEARCH,
	slugify,
	stripBoilerplate,
	type GutendexRawBook
} from '$lib/import/gutenberg-text';
import { cleanGutenberg } from '$lib/typing/gutenberg';
import { generateDrill, pickWeakChars } from '$lib/typing/drills';
import { normalize, unwrapParagraphs } from '$lib/typing/normalize';
import { paginate } from '$lib/typing/paginate';
import {
	applySession,
	getCharStatRows,
	getCustomContents,
	getProgressMap,
	getSessions,
	putCustomContent,
	type LocalContent
} from './local-store';
import type { DataApi } from './server-api';
import type { FetchFn, LibraryItem, PracticeData } from './types';

async function fetchBaked<T>(f: FetchFn, path: string): Promise<T | null> {
	const res = await f(`${base}/data/${path}`);
	if (!res.ok) return null;
	return (await res.json()) as T;
}

/** Try direct, then a CORS proxy — browser fetches can't reach every mirror. */
async function fetchTextCors(urls: string[]): Promise<string> {
	const candidates = [
		...urls,
		...urls.map((u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`)
	];
	for (const url of candidates) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
			if (res.ok) return await res.text();
		} catch {
			/* try the next candidate */
		}
	}
	throw new Error('Could not download that text from the browser (network or CORS).');
}

function storeBook(title: string, author: string | null, source: string | null, raw: string): string {
	const text = unwrapParagraphs(normalize(cleanGutenberg(stripBoilerplate(raw))));
	const pages = paginate(text, 'prose');
	if (pages.length < 2) throw new Error('That file has almost no typeable text after cleanup.');
	const id = `books/${slugify(title) || nanoid(8)}`;
	putCustomContent(id, {
		content: { id, kind: 'book', title, language: null, author, source, pageCount: pages.length },
		pages,
		difficulty: 1
	});
	return id;
}

export const staticApi: DataApi = {
	getLibrary: async (f) => {
		const baked = (await fetchBaked<LibraryItem[]>(f, 'library.json')) ?? [];
		const customs = Object.values(getCustomContents()).map(
			(c): LibraryItem => ({
				id: c.content.id,
				kind: c.content.kind,
				title: c.content.title,
				language: c.content.language,
				difficulty: c.difficulty,
				author: c.content.author,
				pageCount: c.content.pageCount,
				resumePage: null,
				completed: false
			})
		);
		const progress = getProgressMap();
		// Locally imported content shadows baked content with the same id.
		const bakedVisible = baked.filter((b) => !customs.some((c) => c.id === b.id));
		return [...bakedVisible, ...customs].map((item) => ({
			...item,
			resumePage: progress[item.id]?.completed ? null : (progress[item.id]?.pageIndex ?? null),
			completed: progress[item.id]?.completed ?? false
		}));
	},

	getPractice: async (f, id, page): Promise<PracticeData | null> => {
		const local = getCustomContents()[id];
		const data = local ?? (await fetchBaked<LocalContent>(f, `content/${id}.json`));
		if (!data || page < 0 || page >= data.pages.length) return null;
		return {
			content: data.content,
			pageIndex: page,
			pageText: data.pages[page],
			charStats: getCharStatRows()
		};
	},

	getDashboard: async () => getSessions(),

	getDrill: async (_f, layout, board) => {
		const rows = getCharStatRows().filter((r) => r.layout === layout && r.board === board);
		const weak = pickWeakChars(rows);
		return {
			layout,
			board,
			weakChars: weak.chars,
			fromHistory: weak.fromHistory,
			text: generateDrill(weak.chars)
		};
	},

	saveSession: async (_f, payload) => {
		applySession(payload);
	},

	importPaste: async (_f, input) => {
		let text = normalize(input.content);
		if (input.mode === 'prose') text = unwrapParagraphs(text);
		const pages = paginate(text, input.mode);
		if (pages.length === 0) throw new Error('No typeable content found after cleanup.');
		const id = `custom/${nanoid(10)}`;
		putCustomContent(id, {
			content: {
				id,
				kind: 'custom',
				title: input.title,
				language: null,
				author: null,
				source: null,
				pageCount: pages.length
			},
			pages,
			difficulty: 1
		});
		return id;
	},

	importGithub: async (_f, url) => {
		const rawUrl = toRawUrl(url);
		if (!rawUrl) {
			throw new Error('Not a recognizable GitHub file URL. Use a github.com/.../blob/... link.');
		}
		const res = await fetch(rawUrl);
		if (!res.ok) throw new Error(`GitHub returned ${res.status} for that file.`);
		const text = await res.text();
		if (text.length > MAX_CODE_BYTES) {
			throw new Error(`File is too large (${Math.round(text.length / 1024)} KB, max 100 KB).`);
		}
		const fileName = new URL(rawUrl).pathname.split('/').pop() ?? 'file';
		const language = languageFromPath(fileName);
		const pages = paginate(normalize(text), 'code');
		if (pages.length === 0) throw new Error('No typeable content found after cleanup.');
		const id = `custom/${nanoid(10)}`;
		putCustomContent(id, {
			content: {
				id,
				kind: 'custom',
				title: fileName,
				language,
				author: null,
				source: url,
				pageCount: pages.length
			},
			pages,
			difficulty: difficultyForLanguage(language)
		});
		return id;
	},

	searchBooks: async (_f, q) => {
		const res = await fetch(GUTENDEX_SEARCH(q), { signal: AbortSignal.timeout(15000) });
		if (!res.ok) throw new Error(`Catalog search failed (${res.status}).`);
		const data = (await res.json()) as { results?: GutendexRawBook[] };
		return (data.results ?? []).slice(0, 10).map((b) => ({
			id: b.id,
			title: b.title,
			authors: (b.authors ?? []).map((a) => a.name).join(', ')
		}));
	},

	importGutenbergBook: async (_f, book) => {
		const raw = await fetchTextCors(GUTENBERG_MIRRORS.map((m) => m(book.id)));
		return storeBook(
			book.title,
			book.authors || null,
			`https://www.gutenberg.org/ebooks/${book.id}`,
			raw
		);
	},

	importBookUrl: async (_f, input) => {
		const ebookId = input.url.match(/gutenberg\.org\/ebooks\/(\d+)/)?.[1];
		const urls = ebookId ? GUTENBERG_MIRRORS.map((m) => m(Number(ebookId))) : [input.url];
		const raw = await fetchTextCors(urls);
		return storeBook(input.title, null, input.url, raw);
	},

	reseed: async () => {
		throw new Error('Not available in the static build — the library is baked in at deploy time.');
	}
};
