PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_char_stats` (
	`char` text NOT NULL,
	`layout` text NOT NULL,
	`board` text DEFAULT 'ansi' NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`errors` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`char`, `layout`, `board`)
);
--> statement-breakpoint
INSERT INTO `__new_char_stats`("char", "layout", "board", "hits", "errors", "updated_at") SELECT "char", "layout", 'ansi', "hits", "errors", "updated_at" FROM `char_stats`;--> statement-breakpoint
DROP TABLE `char_stats`;--> statement-breakpoint
ALTER TABLE `__new_char_stats` RENAME TO `char_stats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `sessions` ADD `board` text DEFAULT 'ansi' NOT NULL;