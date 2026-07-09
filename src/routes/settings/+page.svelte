<script lang="ts">
	import { api } from "$lib/data";
	import { settings } from "$lib/settings.svelte";
	import { STATIC_MODE } from "$lib/static-mode";

	let seedMessage = $state("");
	let seedError = $state("");
	let seeding = $state(false);

	async function reseed() {
		seeding = true;
		seedMessage = "";
		seedError = "";
		try {
			const r = await api.reseed(fetch);
			seedMessage = `Seeded ${r.seeded} items (${r.pages} pages).`;
		} catch (e) {
			seedError = e instanceof Error ? e.message : "Seeding failed.";
		} finally {
			seeding = false;
		}
	}

	const toggles: {
		key: "showKeyboard" | "showNextKey" | "showFingers" | "showHeatmap" | "mustCorrect";
		label: string;
		description: string;
	}[] = [
		{
			key: "showKeyboard",
			label: "Show keyboard",
			description:
				"Display the on-screen keyboard during practice so you can see the key layout.",
		},
		{
			key: "showNextKey",
			label: "Show next key",
			description:
				"Highlight the key to press next (and the layer key to hold) on the visible keyboard.",
		},
		{
			key: "showFingers",
			label: "Finger guidance",
			description: "Color keys by which finger should press them.",
		},
		{
			key: "showHeatmap",
			label: "Error heatmap",
			description: "Shade keys red based on how often you miss them.",
		},
		{
			key: "mustCorrect",
			label: "Must correct errors",
			description:
				"A wrong keystroke stays put until you type the right character.",
		},
	];
</script>

<h1 class="mb-8 text-2xl font-bold">Settings</h1>

<section class="mb-8">
	<h2 class="mb-4 text-lg font-semibold">Practice aids</h2>
	<div class="space-y-3">
		{#each toggles as toggle (toggle.key)}
			<label
				class="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
			>
				<input
					type="checkbox"
					bind:checked={settings[toggle.key]}
					class="mt-1 accent-emerald-500"
				/>
				<span>
					<span class="block font-medium text-zinc-200"
						>{toggle.label}</span
					>
					<span class="block text-sm text-zinc-500"
						>{toggle.description}</span
					>
				</span>
			</label>
		{/each}
	</div>
</section>

{#if !STATIC_MODE}
	<section>
		<h2 class="mb-1 text-lg font-semibold">Maintenance</h2>
		<p class="mb-4 text-sm text-zinc-500">
			Rebuild the library from the files in <code class="font-mono text-xs"
				>content/</code
			>
			— use this if <code class="font-mono text-xs">data/typing.db</code> was deleted
			or after adding content files. Your stats and progress are kept. (If you
			deleted the database file while the app was running, restart the dev server
			first.)
		</p>
		<div class="flex items-center gap-3">
			<button
				onclick={reseed}
				disabled={seeding}
				class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
			>
				{seeding ? "Seeding…" : "Re-seed library"}
			</button>
			{#if seedMessage}
				<span class="text-sm text-emerald-400">{seedMessage}</span>
			{:else if seedError}
				<span class="text-sm text-red-400">{seedError}</span>
			{/if}
		</div>
	</section>
{/if}
