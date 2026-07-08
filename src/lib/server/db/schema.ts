import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const contents = sqliteTable('contents', {
	id: text('id').primaryKey(), // slug, e.g. 'code/rust/ripgrep-searcher' or 'custom/<nanoid>'
	kind: text('kind', { enum: ['book', 'code', 'custom'] }).notNull(),
	title: text('title').notNull(),
	language: text('language'),
	difficulty: integer('difficulty').notNull().default(1), // 1 easy .. 3 symbol-heavy
	source: text('source'),
	license: text('license'),
	author: text('author'),
	pageCount: integer('page_count').notNull(),
	createdAt: integer('created_at').notNull()
});

export const pages = sqliteTable(
	'pages',
	{
		contentId: text('content_id')
			.notNull()
			.references(() => contents.id, { onDelete: 'cascade' }),
		pageIndex: integer('page_index').notNull(),
		text: text('text').notNull()
	},
	(t) => [primaryKey({ columns: [t.contentId, t.pageIndex] })]
);

export const sessions = sqliteTable('sessions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	contentId: text('content_id'), // null for drills
	kind: text('kind', { enum: ['book', 'code', 'custom', 'drill'] }).notNull(),
	pageIndex: integer('page_index'),
	wpm: real('wpm').notNull(),
	rawWpm: real('raw_wpm').notNull(),
	accuracy: real('accuracy').notNull(),
	durationMs: integer('duration_ms').notNull(),
	charCount: integer('char_count').notNull(),
	errorCount: integer('error_count').notNull(),
	layout: text('layout').notNull().default('qwerty'),
	board: text('board').notNull().default('ansi'),
	completedAt: integer('completed_at').notNull()
});

/**
 * Lifetime per-expected-char aggregates, kept per layout AND per board:
 * different physical keyboards produce different weak keys.
 */
export const charStats = sqliteTable(
	'char_stats',
	{
		char: text('char').notNull(),
		layout: text('layout').notNull(),
		board: text('board').notNull().default('ansi'),
		hits: integer('hits').notNull().default(0),
		errors: integer('errors').notNull().default(0),
		updatedAt: integer('updated_at').notNull()
	},
	(t) => [primaryKey({ columns: [t.char, t.layout, t.board] })]
);

export const progress = sqliteTable('progress', {
	contentId: text('content_id')
		.primaryKey()
		.references(() => contents.id, { onDelete: 'cascade' }),
	pageIndex: integer('page_index').notNull(), // next page to type
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	updatedAt: integer('updated_at').notNull()
});
