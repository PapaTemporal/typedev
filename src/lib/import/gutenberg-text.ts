// Client-safe Project Gutenberg helpers, shared by the server and the static
// build's in-browser importer.

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

export const GUTENBERG_MIRRORS = [
	(id: number) => `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
	(id: number) => `https://gutenberg.pglaf.org/cache/epub/${id}/pg${id}.txt`,
	(id: number) => `https://gutenberg.readingroo.ms/cache/epub/${id}/pg${id}.txt`
];

export interface GutendexRawBook {
	id: number;
	title: string;
	authors?: { name: string }[];
}

export const GUTENDEX_SEARCH = (query: string) =>
	`https://gutendex.com/books?search=${encodeURIComponent(query)}`;
