<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { GEOMETRIES } from '$lib/layouts';
	import { persistSettings, settings } from '$lib/settings.svelte';

	let { children } = $props();

	$effect(() => {
		JSON.stringify(settings); // touch every field so any change re-runs this
		persistSettings();
	});

	const links = [
		{ href: '/', label: 'Library' },
		{ href: '/drill', label: 'Drill' },
		{ href: '/stats', label: 'Stats' },
		{ href: '/import', label: 'Import' },
		{ href: '/editor', label: 'Editor' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-zinc-950 text-zinc-200">
	<header class="border-b border-zinc-800">
		<nav class="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
			<a href="/" class="font-mono text-lg font-bold text-emerald-400">typelit-dev</a>
			<div class="flex gap-4 text-sm">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="transition-colors hover:text-white {page.url.pathname === link.href
							? 'text-white'
							: 'text-zinc-400'}"
					>
						{link.label}
					</a>
				{/each}
			</div>
			<select
				bind:value={settings.board}
				title="Active keyboard — build more in the Editor"
				class="ml-auto max-w-40 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
			>
				{#each Object.values(GEOMETRIES) as g (g.id)}
					<option value={g.id}>{g.label}</option>
				{/each}
				{#each Object.keys(settings.savedBoards) as name (name)}
					<option value={`saved:${name}`}>{name}</option>
				{/each}
			</select>
		</nav>
	</header>
	<main class="mx-auto max-w-4xl px-4 py-8">
		{@render children()}
	</main>
</div>
