<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { api, type BookSearchResult } from '$lib/data';

	let bookQuery = $state('');
	let bookResults = $state<BookSearchResult[] | null>(null);
	let bookError = $state('');
	let bookUrl = $state('');
	let bookUrlTitle = $state('');
	let bookUrlError = $state('');
	let githubUrl = $state('');
	let githubError = $state('');
	let pasteTitle = $state('');
	let pasteContent = $state('');
	let pasteMode = $state<'prose' | 'code'>('prose');
	let pasteError = $state('');
	let busy = $state('');

	async function run(name: string, fn: () => Promise<string | void>, setError: (m: string) => void) {
		busy = name;
		setError('');
		try {
			const id = await fn();
			if (typeof id === 'string') await goto(`${base}/practice/${id}`);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Import failed.');
		} finally {
			busy = '';
		}
	}

	const searchBooks = () =>
		run(
			'search',
			async () => {
				bookResults = await api.searchBooks(fetch, bookQuery.trim());
				if (bookResults.length === 0) bookError = 'No matches in the catalog.';
			},
			(m) => (bookError = m)
		);

	const importBook = (book: BookSearchResult) =>
		run('book', () => api.importGutenbergBook(fetch, book), (m) => (bookError = m));

	const importFromUrl = () =>
		run(
			'bookUrl',
			() => api.importBookUrl(fetch, { url: bookUrl.trim(), title: bookUrlTitle.trim() }),
			(m) => (bookUrlError = m)
		);

	const importGithub = () =>
		run('github', () => api.importGithub(fetch, githubUrl.trim()), (m) => (githubError = m));

	const importPaste = () =>
		run(
			'paste',
			() =>
				api.importPaste(fetch, {
					title: pasteTitle.trim(),
					content: pasteContent,
					mode: pasteMode
				}),
			(m) => (pasteError = m)
		);

	const inputClass =
		'w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 ' +
		'placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none';
	const buttonClass =
		'rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50';
</script>

<h1 class="mb-8 text-2xl font-bold">Import</h1>

<section class="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
	<h2 class="mb-1 text-lg font-semibold">Books — Project Gutenberg</h2>
	<p class="mb-4 text-sm text-zinc-500">
		Search the Gutenberg catalog of public-domain books, or paste a link to a plain-text book
		(gutenberg.org ebook pages work too). Imports land in the Books section of the library.
	</p>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			searchBooks();
		}}
		class="flex gap-2"
	>
		<input
			type="text"
			bind:value={bookQuery}
			placeholder="Search title or author, e.g. Sherlock Holmes"
			class={inputClass}
			required
		/>
		<button type="submit" disabled={busy === 'search'} class="{buttonClass} shrink-0">
			{busy === 'search' ? 'Searching…' : 'Search'}
		</button>
	</form>
	{#if bookError}
		<p class="mt-3 text-sm text-red-400">{bookError}</p>
	{/if}
	{#if bookResults && bookResults.length > 0}
		<ul class="mt-4 divide-y divide-zinc-800">
			{#each bookResults as book (book.id)}
				<li class="flex items-center justify-between gap-4 py-2">
					<span class="text-sm">
						<span class="text-zinc-200">{book.title}</span>
						{#if book.authors}
							<span class="text-zinc-500"> — {book.authors}</span>
						{/if}
					</span>
					<button
						onclick={() => importBook(book)}
						disabled={busy === 'book'}
						class="shrink-0 rounded-md border border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-800 disabled:opacity-50"
					>
						{busy === 'book' ? 'Importing…' : 'Import'}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			importFromUrl();
		}}
		class="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4"
	>
		<input
			type="url"
			bind:value={bookUrl}
			placeholder="https://www.gutenberg.org/ebooks/1661 or any .txt URL"
			class="{inputClass} min-w-64 flex-1"
			required
		/>
		<input type="text" bind:value={bookUrlTitle} placeholder="Title" class="{inputClass} w-56" required />
		<button type="submit" disabled={busy === 'bookUrl'} class="{buttonClass} shrink-0">
			{busy === 'bookUrl' ? 'Importing…' : 'Import from URL'}
		</button>
		{#if bookUrlError}
			<p class="w-full text-sm text-red-400">{bookUrlError}</p>
		{/if}
	</form>
</section>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
	<section class="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
		<h2 class="mb-1 text-lg font-semibold">From GitHub</h2>
		<p class="mb-4 text-sm text-zinc-500">
			Paste a link to any file on GitHub, e.g.
			<code class="font-mono text-xs">github.com/owner/repo/blob/main/src/index.ts</code>
		</p>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				importGithub();
			}}
			class="space-y-4"
		>
			<input
				type="url"
				bind:value={githubUrl}
				placeholder="https://github.com/..."
				class={inputClass}
				required
			/>
			{#if githubError}
				<p class="text-sm text-red-400">{githubError}</p>
			{/if}
			<button type="submit" disabled={busy === 'github'} class={buttonClass}>
				{busy === 'github' ? 'Fetching…' : 'Fetch & practice'}
			</button>
		</form>
	</section>

	<section class="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
		<h2 class="mb-1 text-lg font-semibold">Paste text</h2>
		<p class="mb-4 text-sm text-zinc-500">Any text or code you want to practice on.</p>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				importPaste();
			}}
			class="space-y-4"
		>
			<input type="text" bind:value={pasteTitle} placeholder="Title" class={inputClass} required />
			<textarea
				bind:value={pasteContent}
				rows="8"
				placeholder="Paste your text here..."
				class="{inputClass} resize-y font-mono"
				required
			></textarea>
			<div class="flex items-center gap-4 text-sm text-zinc-400">
				<label class="flex items-center gap-2">
					<input type="radio" value="prose" bind:group={pasteMode} class="accent-emerald-500" />
					Prose
				</label>
				<label class="flex items-center gap-2">
					<input type="radio" value="code" bind:group={pasteMode} class="accent-emerald-500" />
					Code
				</label>
			</div>
			{#if pasteError}
				<p class="text-sm text-red-400">{pasteError}</p>
			{/if}
			<button type="submit" disabled={busy === 'paste'} class={buttonClass}>
				{busy === 'paste' ? 'Importing…' : 'Import & practice'}
			</button>
		</form>
	</section>
</div>
