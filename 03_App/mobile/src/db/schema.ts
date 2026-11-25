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
  /** Point CFI of the first content in view (ticket 007; replaced Readium locator JSON). */
  cfi: text("cfi").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const READER_GLOBAL_SETTINGS_ID = "global" as const;

export const readerGlobalSettings = sqliteTable("reader_global_settings", {
  id: text("id").primaryKey(),
  fontSizeTier: text("font_size_tier").notNull(),
  lastOpenedBookId: text("last_opened_book_id").references(() => books.bookId, {
    onDelete: "restrict",
  }),
  updatedAt: integer("updated_at").notNull(),
});

export const bookQuotes = sqliteTable("book_quotes", {
  quoteId: text("quote_id").primaryKey(),
  bookId: text("book_id")
    .notNull()
    .references(() => books.bookId, { onDelete: "restrict" }),
  /** Range CFI of the highlighted text (ticket 007; replaced Readium locator JSON). */
  cfi: text("cfi").notNull(),
  /**
   * Refcode of the range start — a sortable integer for reading order within a book.
   * Null when it could not be computed (e.g. an unparseable spine document).
   */
  refcode: integer("refcode"),
  snippet: text("snippet").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type BookRow = typeof books.$inferSelect;
export type ReadingProgressRow = typeof readingProgress.$inferSelect;
export type ReaderGlobalSettingsRow = typeof readerGlobalSettings.$inferSelect;
export type BookQuoteRow = typeof bookQuotes.$inferSelect;