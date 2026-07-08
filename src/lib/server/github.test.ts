import { describe, expect, it } from 'vitest';
import { languageFromPath, toRawUrl } from './github';

describe('toRawUrl', () => {
	it('rewrites blob URLs to raw', () => {
		expect(toRawUrl('https://github.com/sindresorhus/p-limit/blob/main/index.js')).toBe(
			'https://raw.githubusercontent.com/sindresorhus/p-limit/main/index.js'
		);
	});

	it('passes raw URLs through', () => {
		const raw = 'https://raw.githubusercontent.com/a/b/main/c.ts';
		expect(toRawUrl(raw)).toBe(raw);
	});

	it('rejects non-file GitHub URLs and other hosts', () => {
		expect(toRawUrl('https://github.com/sindresorhus/p-limit')).toBeNull();
		expect(toRawUrl('https://gitlab.com/a/b/blob/main/c.ts')).toBeNull();
		expect(toRawUrl('not a url')).toBeNull();
	});
});

describe('languageFromPath', () => {
	it('maps common extensions', () => {
		expect(languageFromPath('index.ts')).toBe('typescript');
		expect(languageFromPath('main.rs')).toBe('rust');
		expect(languageFromPath('a.b.py')).toBe('python');
	});

	it('returns null for unknown or missing extensions', () => {
		expect(languageFromPath('Makefile')).toBeNull();
		expect(languageFromPath('weird.xyz')).toBeNull();
	});
});
