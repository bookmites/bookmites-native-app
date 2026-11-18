import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const BOOK_KINDS = {
  bundledFixture: "bundled_fixture",
  imported: "imported",
} as const;

export type BookKind = (typeof BOOK_KINDS)[keyof typeof BOOK_KINDS];

export const books = sqliteTable("books", {
  bookId: text("book_id").primaryKey(),
  title: text("title").notNull(),
  author: text("author"),
  kind: text("kind").notNull().$type<BookKind>(),
  fixtureKey: text("fixture_key"),
  libraryRelativePath: text("library_relative_path"),
  fileOnDevice: integer("file_on_device").notNull(),
  addedAt: integer("added_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const readingProgress = sqliteTable("reading_progress", {
  bookId: text("book_id")
    .primaryKey()
    .notNull()
    .references(() => books.bookId, { onDelete: "restrict" }),
  locatorJson: text("locator_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const READER_GLOBAL_SETTINGS_ID = "global" as const;

export const readerGlobalSettings = sqliteTable("reader_global_settings", {
  id: text("id").primaryKey(),
  fontSizeTier: text("font_size_tier").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type BookRow = typeof books.$inferSelect;
export type ReadingProgressRow = typeof readingProgress.$inferSelect;
export type ReaderGlobalSettingsRow = typeof readerGlobalSettings.$inferSelect;