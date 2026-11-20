CREATE TABLE `book_quotes` (
	`quote_id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`locator_json` text NOT NULL,
	`snippet` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`book_id`) ON UPDATE no action ON DELETE restrict
);
