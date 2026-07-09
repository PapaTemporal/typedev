import {
	MAX_CODE_BYTES,
	difficultyForLanguage,
	languageFromPath,
	toRawUrl
} from '$lib/import/github-url';

export { languageFromPath, toRawUrl };

export interface FetchedFile {
	text: string;
	fileName: string;
	language: string | null;
	difficulty: number;
	source: string;
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
	if (length > MAX_CODE_BYTES) {
		throw new Error(`File is too large (${Math.round(length / 1024)} KB, max 100 KB).`);
	}
	const text = await res.text();
	if (text.length > MAX_CODE_BYTES) {
		throw new Error(`File is too large (${Math.round(text.length / 1024)} KB, max 100 KB).`);
	}
	const path = new URL(rawUrl).pathname;
	const fileName = path.split('/').pop() ?? 'file';
	const language = languageFromPath(fileName);
	return {
		text,
		fileName,
		language,
		difficulty: difficultyForLanguage(language),
		source: inputUrl
	};
}
