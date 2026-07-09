import tailwindcss from '@tailwindcss/vite';
import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// STATIC_BUILD=1 produces the GitHub Pages build: an SPA (adapter-static with a
// 404.html fallback, which Pages serves for unknown paths) with no server —
// content comes from baked JSON and stats live in localStorage. BASE_PATH is
// the Pages subpath, e.g. /typedev for a project site.
const isStatic = !!process.env.STATIC_BUILD;

export default defineConfig({
	define: {
		__STATIC__: JSON.stringify(isStatic)
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			paths: {
				base: (process.env.BASE_PATH || '') as '' | `/${string}`
			},

			prerender: {
				// dynamic routes (practice/[...contentId]) are served by the SPA fallback
				handleUnseenRoutes: 'ignore'
			},

			adapter: isStatic
				? adapterStatic({ fallback: '404.html', strict: false })
				: adapterNode()
		})
	]
});
