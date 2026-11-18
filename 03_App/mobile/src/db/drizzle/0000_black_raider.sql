CREATE TABLE `reading_progress` (
	`book_id` text PRIMARY KEY NOT NULL,
	`locator_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
