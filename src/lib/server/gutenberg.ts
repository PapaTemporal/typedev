// Relative imports (not $lib) so scripts/fetch-books.ts can run this through tsx too.

const MIRRORS = [
	(id: number) => `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
	(id: number) => `https://gutenberg.pglaf.org/cache/epub/${id}/pg${id}.txt`,
	(id: number) => `https://gutenberg.readingroo.ms/cache/epub/${id}/pg${id}.txt`
];

export async function fetchGutenbergText(id: number): Promise<string> {
	let lastError = 'no mirror tried';
	for (const mirror of MIRRORS) {
		const url = mirror(id);
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
			if (!res.ok) {
				lastError = `${url} → ${res.status}`;
				continue;
			}
			return await res.text();
		} catch (e) {
			lastError = `${url} → ${e instanceof Error ? e.message : 'failed'}`;
		}
	}
	throw new Error(lastError);
}

/** Cut the Gutenberg license header/footer, keeping only the book body. */
export function stripBoilerplate(raw: string): string {
	const lines = raw.split(/\r?\n/);
	let start = 0;
	let end = lines.length;
	for (let i = 0; i < lines.length; i++) {
		if (/^\s*\*{3}\s*START OF/i.test(lines[i])) start = i + 1;
		if (/^\s*\*{3}\s*END OF/i.test(lines[i])) {
			end = i;
			break;
		}
	}
	return lines.slice(start, end).join('\n').trim();
}

export function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export interface GutendexBook {
	id: number;
	title: string;
	authors: string;
}

/** Search the Project Gutenberg catalog via the public Gutendex API. */
export async function searchGutendex(query: string): Promise<GutendexBook[]> {
	const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}`, {
		signal: AbortSignal.timeout(15000)
	});
	if (!res.ok) throw new Error(`Catalog search failed (${res.status}). Try a Gutenberg URL instead.`);
	const data = (await res.json()) as {
		results?: { id: number; title: string; authors?: { name: string }[] }[];
	};
	return (data.results ?? []).slice(0, 10).map((b) => ({
		id: b.id,
		title: b.title,
		authors: (b.authors ?? []).map((a) => a.name).join(', ')
	}));
}

const MAX_BOOK_BYTES = 4 * 1024 * 1024;

/** Fetch a book as plain text from an arbitrary URL (Gutenberg or elsewhere). */
export async function fetchBookUrl(url: string): Promise<string> {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error('That does not look like a URL.');
	}
	// A gutenberg.org ebook page can be rewritten to its plain-text file.
	const ebookId = parsed.hostname.endsWith('gutenberg.org')
		? parsed.pathname.match(/^\/ebooks\/(\d+)/)?.[1]
		: null;
	if (ebookId) return fetchGutenbergText(Number(ebookId));

	const res = await fetch(parsed.href, { signal: AbortSignal.timeout(30000) });
	if (!res.ok) throw new Error(`That URL returned ${res.status}.`);
	const contentType = res.headers.get('content-type') ?? '';
	if (contentType && !/^text\/plain/.test(contentType)) {
		throw new Error(`Expected a plain-text file, got ${contentType.split(';')[0]}.`);
	}
	const text = await res.text();
	if (text.length > MAX_BOOK_BYTES) {
		throw new Error(`File is too large (${Math.round(text.length / 1024 / 1024)} MB, max 4 MB).`);
	}
	return text;
}
