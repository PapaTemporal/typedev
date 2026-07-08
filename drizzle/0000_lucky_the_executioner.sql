CREATE TABLE `char_stats` (
	`char` text NOT NULL,
	`layout` text NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`errors` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`char`, `layout`)
);
--> statement-breakpoint
CREATE TABLE `contents` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`language` text,
	`difficulty` integer DEFAULT 1 NOT NULL,
	`source` text,
	`license` text,
	`author` text,
	`page_count` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`content_id` text NOT NULL,
	`page_index` integer NOT NULL,
	`text` text NOT NULL,
	PRIMARY KEY(`content_id`, `page_index`),
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`content_id` text PRIMARY KEY NOT NULL,
	`page_index` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` text,
	`kind` text NOT NULL,
	`page_index` integer,
	`wpm` real NOT NULL,
	`raw_wpm` real NOT NULL,
	`accuracy` real NOT NULL,
	`duration_ms` integer NOT NULL,
	`char_count` integer NOT NULL,
	`error_count` integer NOT NULL,
	`layout` text DEFAULT 'qwerty' NOT NULL,
	`completed_at` integer NOT NULL
);
