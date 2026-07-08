const MAX_BYTES = 100 * 1024;

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

export interface FetchedFile {
	text: string;
	fileName: string;
	language: string | null;
	difficulty: number;
	source: string;
}

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

export async function fetchGithubFile(inputUrl: string): Promise<FetchedFile> {
	const rawUrl = toRawUrl(inputUrl);
	if (!rawUrl) {
		throw new Error('Not a recognizable GitHub file URL. Use a github.com/.../blob/... link.');
	}
	const res = await fetch(rawUrl, { headers: { accept: 'text/plain' } });
	if (!res.ok) {
		throw new Error(`GitHub returned ${res.status} for that file.`);
	}
	const contentType = res.headers.get('content-type') ?? '';
	if (contentType && !/^(text\/|application\/(json|javascript|xml|toml|yaml))/.test(contentType)) {
		throw new Error(`That file does not look like text (${contentType}).`);
	}
	const length = Number(res.headers.get('content-length') ?? '0');
	if (length > MAX_BYTES) {
		throw new Error(`File is too large (${Math.round(length / 1024)} KB, max 100 KB).`);
	}
	const text = await res.text();
	if (text.length > MAX_BYTES) {
		throw new Error(`File is too large (${Math.round(text.length / 1024)} KB, max 100 KB).`);
	}
	const path = new URL(rawUrl).pathname;
	const fileName = path.split('/').pop() ?? 'file';
	const language = languageFromPath(fileName);
	return {
		text,
		fileName,
		language,
		difficulty: language && SYMBOL_HEAVY.has(language) ? 3 : 1,
		source: inputUrl
	};
}
