CREATE TABLE `books` (
	`book_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`kind` text NOT NULL,
	`fixture_key` text,
	`library_relative_path` text,
	`file_on_device` integer NOT NULL,
	`added_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `books` (
	`book_id`,
	`title`,
	`author`,
	`kind`,
	`fixture_key`,
	`library_relative_path`,
	`file_on_device`,
	`added_at`,
	`updated_at`
) VALUES (
	'fixture.smoke',
	'Smoke fixture',
	NULL,
	'bundled_fixture',
	'smoke',
	NULL,
	1,
	0,
	0
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reading_progress` (
	`book_id` text PRIMARY KEY NOT NULL,
	`locator_json` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`book_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_reading_progress`("book_id", "locator_json", "updated_at") SELECT "book_id", "locator_json", "updated_at" FROM `reading_progress`;--> statement-breakpoint
DROP TABLE `reading_progress`;--> statement-breakpoint
ALTER TABLE `__new_reading_progress` RENAME TO `reading_progress`;--> statement-breakpoint
PRAGMA foreign_keys=ON;