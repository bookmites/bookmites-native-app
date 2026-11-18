export { DbProvider } from "./DbProvider";
export { getDb, db } from "./client";
export { getBook, listBooks, upsertBook, type UpsertBookInput } from "./books";
export {
  deleteReadingProgress,
  getReadingProgressJson,
  upsertReadingProgressJson,
} from "./readingProgress";
export { getReaderFontSizeTier, setReaderFontSizeTier } from "./readerSettings";
export {
  BOOK_KINDS,
  READER_GLOBAL_SETTINGS_ID,
  books,
  readerGlobalSettings,
  readingProgress,
  type BookKind,
  type BookRow,
  type ReaderGlobalSettingsRow,
  type ReadingProgressRow,
} from "./schema";