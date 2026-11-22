-- Ticket 007: Readium locator JSON → EPUB CFIs.
-- Pre-release dogfood data is discarded rather than converted (locators do not map cleanly to CFIs).
DELETE FROM `reading_progress`;--> statement-breakpoint
DELETE FROM `book_quotes`;--> statement-breakpoint
ALTER TABLE `reading_progress` RENAME COLUMN `locator_json` TO `cfi`;--> statement-breakpoint
ALTER TABLE `book_quotes` RENAME COLUMN `locator_json` TO `cfi`;--> statement-breakpoint
ALTER TABLE `book_quotes` ADD `refcode` integer;
