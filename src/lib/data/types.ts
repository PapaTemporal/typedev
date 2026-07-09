// Shared, client-safe types for the data layer. Both the server (SQLite) and
// static (baked JSON + localStorage) implementations speak these shapes.

export type ContentKind = 'book' | 'code' | 'custom';
export type SessionKind = ContentKind | 'drill';

export interface LibraryItem {
	id: string;
	kind: ContentKind;
	title: string;
	language: string | null;
	difficulty: number;
	author: string | null;
	pageCount: number;
	resumePage: number | null;
	completed: boolean;
}

export interface ContentMeta {
	id: string;
	kind: ContentKind;
	title: string;
	language: string | null;
	author: string | null;
	source: string | null;
	pageCount: number;
}

export interface PracticeData {
	content: ContentMeta;
	pageIndex: number;
	pageText: string;
	charStats: CharStatRowData[];
}

export interface CharStatRowData {
	char: string;
	layout: string;
	board: string;
	hits: number;
	errors: number;
}

export interface DashboardSession {
	id: number;
	kind: SessionKind;
	title: string | null;
	wpm: number;
	rawWpm: number;
	accuracy: number;
	durationMs: number;
	board: string;
	completedAt: number;
}

export interface DrillData {
	layout: string;
	board: string;
	weakChars: string[];
	fromHistory: boolean;
	text: string;
}

export interface SessionPayload {
	contentId: string | null;
	kind: SessionKind;
	pageIndex: number | null;
	wpm: number;
	rawWpm: number;
	accuracy: number;
	durationMs: number;
	charCount: number;
	errorCount: number;
	layout: string;
	board: string;
	charTally: { char: string; hits: number; errors: number }[];
	/** Used by the static build (no DB lookup available); server mode ignores them. */
	pageCount?: number;
	title?: string;
}

export interface BookSearchResult {
	id: number;
	title: string;
	authors: string;
}

export type FetchFn = typeof globalThis.fetch;
