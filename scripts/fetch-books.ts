/**
 * Download public-domain books from Project Gutenberg into content/books/ and
 * register them in the manifest. Re-runnable; existing files are skipped.
 *
 *   pnpm books            # fetch the starter list below
 *   pnpm books 2701       # fetch specific Gutenberg id(s)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fetchGutenbergText, slugify, stripBoilerplate } from '../src/lib/server/gutenberg';

interface Book {
	id: number;
	title: string;
	author: string;
}

const STARTER_LIST: Book[] = [
	{ id: 11, title: 'Alice in Wonderland', author: 'Lewis Carroll' },
	{ id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen' },
	{ id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle' },
	{ id: 2701, title: 'Moby Dick', author: 'Herman Melville' },
	{ id: 84, title: 'Frankenstein', author: 'Mary Shelley' },
	{ id: 345, title: 'Dracula', author: 'Bram Stoker' },
	{ id: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens' },
	{ id: 1400, title: 'Great Expectations', author: 'Charles Dickens' },
	{ id: 74, title: 'The Adventures of Tom Sawyer', author: 'Mark Twain' },
	{ id: 76, title: 'Adventures of Huckleberry Finn', author: 'Mark Twain' },
	{ id: 36, title: 'The War of the Worlds', author: 'H. G. Wells' },
	{ id: 35, title: 'The Time Machine', author: 'H. G. Wells' },
	{ id: 5200, title: 'Metamorphosis', author: 'Franz Kafka' },
	{ id: 174, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' },
	{ id: 1260, title: 'Jane Eyre', author: 'Charlotte Brontë' },
	{ id: 768, title: 'Wuthering Heights', author: 'Emily Brontë' },
	{ id: 120, title: 'Treasure Island', author: 'Robert Louis Stevenson' },
	{ id: 16, title: 'Peter Pan', author: 'J. M. Barrie' },
	{ id: 55, title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum' },
	{ id: 43, title: 'The Strange Case of Dr. Jekyll and Mr. Hyde', author: 'Robert Louis Stevenson' }
];

const BOOKS_DIR = 'content/books';
const MANIFEST_PATH = path.join(BOOKS_DIR, 'manifest.json');

interface ManifestEntry {
	file: string;
	title: string;
	difficulty: number;
	source: string;
	license: string;
	author: string;
}

const manifest: ManifestEntry[] = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

const requestedIds = process.argv.slice(2).map(Number).filter(Boolean);
const books = requestedIds.length
	? requestedIds.map((id) => STARTER_LIST.find((b) => b.id === id) ?? { id, title: `Gutenberg #${id}`, author: '' })
	: STARTER_LIST;

let fetched = 0;
for (const book of books) {
	const file = `${slugify(book.title)}.txt`;
	const filePath = path.join(BOOKS_DIR, file);
	if (existsSync(filePath)) {
		console.log(`skip   ${book.title} (already downloaded)`);
		continue;
	}
	try {
		const raw = await fetchGutenbergText(book.id);
		const body = stripBoilerplate(raw);
		if (body.length < 5000) throw new Error(`suspiciously short (${body.length} chars)`);
		writeFileSync(filePath, body);
		if (!manifest.some((m) => m.file === file)) {
			manifest.push({
				file,
				title: book.title,
				difficulty: 1,
				source: `https://www.gutenberg.org/ebooks/${book.id}`,
				license: 'Public Domain',
				author: book.author
			});
		}
		fetched++;
		console.log(`fetch  ${book.title} (${Math.round(body.length / 1024)} KB)`);
	} catch (e) {
		console.error(`FAIL   ${book.title}: ${e instanceof Error ? e.message : e}`);
	}
}

manifest.sort((a, b) => a.title.localeCompare(b.title));
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, '\t') + '\n');
console.log(`\n${fetched} fetched. Run \`pnpm seed\` to load them into the library.`);
