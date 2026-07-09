/**
 * Bake content/ into static JSON for the GitHub Pages build:
 *   static/data/library.json           — LibraryItem[] (no progress; that lives in localStorage)
 *   static/data/content/<id>.json     — { content, pages, difficulty }
 *
 * Run via `pnpm bake` (part of `pnpm build:static`). Output is gitignored.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { cleanGutenberg } from '../src/lib/typing/gutenberg';
import { normalize, unwrapParagraphs } from '../src/lib/typing/normalize';
import { paginate } from '../src/lib/typing/paginate';

interface ManifestEntry {
	file: string;
	title: string;
	language?: string;
	difficulty: number;
	source?: string;
	license?: string;
	author?: string;
}

interface LibraryEntry {
	id: string;
	kind: 'book' | 'code';
	title: string;
	language: string | null;
	difficulty: number;
	author: string | null;
	pageCount: number;
	resumePage: null;
	completed: false;
}

const OUT = 'static/data';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(path.join(OUT, 'content'), { recursive: true });

const library: LibraryEntry[] = [];
bakeDir('content/code', 'code');
bakeDir('content/books', 'book');

writeFileSync(path.join(OUT, 'library.json'), JSON.stringify(library));
console.log(`Baked ${library.length} items into ${OUT}/.`);

function bakeDir(dir: string, kind: 'code' | 'book') {
	const manifest: ManifestEntry[] = JSON.parse(
		readFileSync(path.join(dir, 'manifest.json'), 'utf8')
	);
	for (const entry of manifest) {
		const raw = readFileSync(path.join(dir, entry.file), 'utf8');
		const text =
			kind === 'book' ? unwrapParagraphs(normalize(cleanGutenberg(raw))) : normalize(raw);
		const pages = paginate(text, kind === 'book' ? 'prose' : 'code');
		if (pages.length === 0) continue;
		const prefix = kind === 'book' ? 'books' : 'code';
		const id = `${prefix}/${entry.file.replace(/\.[^.]+$/, '')}`;

		const content = {
			id,
			kind,
			title: entry.title,
			language: entry.language ?? null,
			author: entry.author ?? null,
			source: entry.source ?? null,
			pageCount: pages.length
		};
		const filePath = path.join(OUT, 'content', `${id}.json`);
		mkdirSync(path.dirname(filePath), { recursive: true });
		writeFileSync(filePath, JSON.stringify({ content, pages, difficulty: entry.difficulty }));

		library.push({
			id,
			kind,
			title: entry.title,
			language: entry.language ?? null,
			difficulty: entry.difficulty,
			author: entry.author ?? null,
			pageCount: pages.length,
			resumePage: null,
			completed: false
		});
	}
}
