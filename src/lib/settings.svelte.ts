import { browser } from '$app/environment';
import type { LayoutId } from '$lib/layouts';
import { serializeBoard } from '$lib/layouts/board';
import { parseKle } from '$lib/layouts/kle';

const STORAGE_KEY = 'typelit-dev:settings';

export interface Settings {
	/**
	 * Active board, chosen in the header: a preset id ('ansi', 'charybdis-4x6')
	 * or 'saved:<name>' for a board built in the key editor. Sticky.
	 * Character layout and input mode are properties of the board itself.
	 */
	board: string;
	/** Named boards built in the key editor (name → serialized KeyboardGeometry). */
	savedBoards: Record<string, string>;
	/** Show the on-screen keyboard during practice (see the layout). */
	showKeyboard: boolean;
	/** Highlight the next key to press (aid on top of the visible keyboard). */
	showNextKey: boolean;
	showFingers: boolean;
	showHeatmap: boolean;
	mustCorrect: boolean;
}

const DEFAULTS: Settings = {
	board: 'ansi',
	savedBoards: {},
	showKeyboard: false,
	showNextKey: false,
	showFingers: false,
	showHeatmap: false,
	mustCorrect: false
};

interface LegacyFields {
	geometry?: string;
	customKle?: string;
	customBoard?: string;
	activeBoard?: string;
	layout?: LayoutId;
	inputMode?: 'direct' | 'translated' | 'os' | 'emulate';
}

function load(): Settings {
	if (!browser) return { ...DEFAULTS };
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Settings> &
			LegacyFields;
		const s: Settings & LegacyFields = { ...DEFAULTS, ...stored };
		migrateLegacyBoardFields(s, stored);
		migrateLayoutOntoBoards(s, stored);
		delete s.geometry;
		delete s.customKle;
		delete s.customBoard;
		delete s.activeBoard;
		delete s.layout;
		delete s.inputMode;
		// A board reference with no matching save (deleted/lost) falls back to ANSI.
		if (s.board.startsWith('saved:') && !s.savedBoards[s.board.slice('saved:'.length)]) {
			s.board = 'ansi';
		}
		// showKeyboard used to imply next-key highlighting; keep that for old saves.
		if (stored.showNextKey === undefined && stored.showKeyboard) {
			s.showNextKey = true;
		}
		return s;
	} catch {
		return { ...DEFAULTS };
	}
}

/** Older versions kept the board choice in settings.geometry + related fields. */
function migrateLegacyBoardFields(s: Settings, legacy: LegacyFields & Partial<Settings>): void {
	if (legacy.board) return; // already on the new model
	if (legacy.customBoard && Object.keys(s.savedBoards).length === 0) {
		s.savedBoards = { 'My board': legacy.customBoard };
		if (legacy.geometry === 'custom-board') s.board = 'saved:My board';
	}
	if (legacy.geometry === 'custom-board' && legacy.activeBoard) {
		s.board = `saved:${legacy.activeBoard}`;
	} else if (legacy.geometry === 'custom' && legacy.customKle) {
		try {
			s.savedBoards = {
				...s.savedBoards,
				'Imported KLE': serializeBoard(parseKle(legacy.customKle))
			};
			s.board = 'saved:Imported KLE';
		} catch {
			/* unparseable old KLE: fall back to default board */
		}
	} else if (legacy.geometry === 'ansi' || legacy.geometry === 'charybdis-4x6') {
		s.board = legacy.geometry;
	}
}

/**
 * Layout/input mode used to be global settings; stamp them onto any saved
 * board that doesn't carry its own yet, so old choices survive the move.
 */
function migrateLayoutOntoBoards(s: Settings, legacy: LegacyFields): void {
	if (!legacy.layout && !legacy.inputMode) return;
	const migrated: Record<string, string> = {};
	for (const [name, json] of Object.entries(s.savedBoards)) {
		try {
			const board = JSON.parse(json);
			board.layout ??= legacy.layout;
			if (board.inputMode === undefined && legacy.inputMode !== undefined) {
				// preserve old behavior: 'emulate' mapped keycodes, 'os' trusted OS chars
				board.inputMode =
					legacy.inputMode === 'emulate'
						? 'direct'
						: legacy.inputMode === 'os'
							? 'translated'
							: legacy.inputMode;
			}
			migrated[name] = JSON.stringify(board);
		} catch {
			migrated[name] = json;
		}
	}
	s.savedBoards = migrated;
}

export const settings = $state<Settings>(load());

/** Call from a component $effect so every mutation is persisted. */
export function persistSettings(): void {
	if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(settings)));
}
