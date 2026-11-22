export { DbProvider } from "./DbProvider";
export { getDb, db } from "./client";
export { getBook, listBooks, upsertBook, type UpsertBookInput } from "./books";
export {
  deleteReadingProgress,
  getReadingProgressCfi,
  upsertReadingProgressCfi,
} from "./readingProgress";
export {
  createBookQuote,
  listAllBookQuotes,
  listBookQuotesByBook,
  updateBookQuote,
  type BookQuoteWithBookTitle,
} from "./bookQuotes";
export { getReaderFontSizeTier, setReaderFontSizeTier } from "./readerSettings";
export {
  BOOK_KINDS,
  READER_GLOBAL_SETTINGS_ID,
  bookQuotes,
  books,
  readerGlobalSettings,
  readingProgress,
  type BookKind,
  type BookQuoteRow,
  type BookRow,
  type ReaderGlobalSettingsRow,
  type ReadingProgressRow,
} from "./schema";