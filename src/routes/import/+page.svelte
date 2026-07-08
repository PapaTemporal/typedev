<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	const inputClass =
		'w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 ' +
		'placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none';
	const buttonClass =
		'rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500';
</script>

<h1 class="mb-8 text-2xl font-bold">Import</h1>

<section class="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
	<h2 class="mb-1 text-lg font-semibold">Books — Project Gutenberg</h2>
	<p class="mb-4 text-sm text-zinc-500">
		Search the Gutenberg catalog of public-domain books, or paste a link to a plain-text book
		(gutenberg.org ebook pages work too). Imports land in the Books section of the library.
	</p>
	<form method="POST" action="?/bookSearch" class="flex gap-2">
		<input
			type="text"
			name="q"
			value={form?.form === 'bookSearch' && 'query' in form ? (form.query ?? '') : ''}
			placeholder="Search title or author, e.g. Sherlock Holmes"
			class={inputClass}
			required
		/>
		<button type="submit" class="{buttonClass} shrink-0">Search</button>
	</form>
	{#if form?.form === 'bookSearch' && 'error' in form && form.error}
		<p class="mt-3 text-sm text-red-400">{form.error}</p>
	{/if}
	{#if form?.form === 'bookSearch' && 'results' in form && form.results}
		<ul class="mt-4 divide-y divide-zinc-800">
			{#each form.results as book (book.id)}
				<li class="flex items-center justify-between gap-4 py-2">
					<span class="text-sm">
						<span class="text-zinc-200">{book.title}</span>
						{#if book.authors}
							<span class="text-zinc-500"> — {book.authors}</span>
						{/if}
					</span>
					<form method="POST" action="?/bookImport" class="shrink-0">
						<input type="hidden" name="gutenbergId" value={book.id} />
						<input type="hidden" name="title" value={book.title} />
						<input type="hidden" name="author" value={book.authors} />
						<button
							type="submit"
							class="rounded-md border border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-800"
						>
							Import
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
	<form method="POST" action="?/bookUrl" class="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
		<input
			type="url"
			name="url"
			placeholder="https://www.gutenberg.org/ebooks/1661 or any .txt URL"
			class="{inputClass} min-w-64 flex-1"
			required
		/>
		<input type="text" name="title" placeholder="Title" class="{inputClass} w-56" required />
		<button type="submit" class="{buttonClass} shrink-0">Import from URL</button>
		{#if form?.form === 'bookUrl' && form.error}
			<p class="w-full text-sm text-red-400">{form.error}</p>
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
		<form method="POST" action="?/github" class="space-y-4">
			<input
				type="url"
				name="url"
				placeholder="https://github.com/..."
				class={inputClass}
				required
			/>
			{#if form?.form === 'github' && form.error}
				<p class="text-sm text-red-400">{form.error}</p>
			{/if}
			<button type="submit" class={buttonClass}>Fetch &amp; practice</button>
		</form>
	</section>

	<section class="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
		<h2 class="mb-1 text-lg font-semibold">Paste text</h2>
		<p class="mb-4 text-sm text-zinc-500">Any text or code you want to practice on.</p>
		<form method="POST" action="?/paste" class="space-y-4">
			<input type="text" name="title" placeholder="Title" class={inputClass} required />
			<textarea
				name="content"
				rows="8"
				placeholder="Paste your text here..."
				class="{inputClass} resize-y font-mono"
				required
			></textarea>
			<div class="flex items-center gap-4 text-sm text-zinc-400">
				<label class="flex items-center gap-2">
					<input type="radio" name="mode" value="prose" checked class="accent-emerald-500" />
					Prose
				</label>
				<label class="flex items-center gap-2">
					<input type="radio" name="mode" value="code" class="accent-emerald-500" />
					Code
				</label>
			</div>
			{#if form?.form === 'paste' && form.error}
				<p class="text-sm text-red-400">{form.error}</p>
			{/if}
			<button type="submit" class={buttonClass}>Import &amp; practice</button>
		</form>
	</section>
</div>
