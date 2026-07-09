// Client-safe GitHub URL helpers, shared by the server import endpoint and the
// static build's in-browser importer.

const EXTENSION_LANGUAGES: Record<string, string> = {
	ts: 'typescript',
	tsx: 'typescript',
	js: 'javascript',
	jsx: 'javascript',
	mjs: 'javascript',
	cjs: 'javascript',
	svelte: 'svelte',
	vue: 'vue',
	py: 'python',
	go: 'go',
	rs: 'rust',
	c: 'c',
	h: 'c',
	cpp: 'cpp',
	cc: 'cpp',
	hpp: 'cpp',
	java: 'java',
	kt: 'kotlin',
	rb: 'ruby',
	php: 'php',
	sh: 'shell',
	swift: 'swift',
	zig: 'zig',
	lua: 'lua',
	sql: 'sql',
	html: 'html',
	css: 'css',
	json: 'json',
	yaml: 'yaml',
	yml: 'yaml',
	toml: 'toml',
	md: 'markdown'
};

const SYMBOL_HEAVY = new Set(['rust', 'c', 'cpp']);

export const MAX_CODE_BYTES = 100 * 1024;

/** Rewrite a github.com blob URL to its raw equivalent; raw URLs pass through. */
export function toRawUrl(input: string): string | null {
	let url: URL;
	try {
		url = new URL(input);
	} catch {
		return null;
	}
	if (url.hostname === 'raw.githubusercontent.com') return url.href;
	if (url.hostname === 'github.com' || url.hostname === 'www.github.com') {
		// /<owner>/<repo>/blob/<ref>/<path...>
		const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/);
		if (!match) return null;
		return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`;
	}
	return null;
}

export function languageFromPath(path: string): string | null {
	const ext = path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
	return ext ? (EXTENSION_LANGUAGES[ext] ?? null) : null;
}

export function difficultyForLanguage(language: string | null): number {
	return language && SYMBOL_HEAVY.has(language) ? 3 : 1;
}
