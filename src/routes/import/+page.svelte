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
