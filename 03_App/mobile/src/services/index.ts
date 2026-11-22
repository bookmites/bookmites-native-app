/**
 * Cross-feature services (import, reader adapter, etc.).
 * The epub engine and reader WebView stay behind services — not in features (tickets 001, 007).
 */
export {
  createBookQuote,
  listAllBookQuotes,
  listBookQuotesByBook,
  updateBookQuote,
  type BookQuoteRow,
  type BookQuoteWithBookTitle,
} from "./bookQuotes";
export {
  listLibraryBooks,
  pickAndImportBook,
  type ImportBookResult,
} from "./library";
export {
  BOOK_IDS,
  DEFAULT_READER_FONT_SIZE_TIER,
  ReaderSurface,
  READER_FONT_SIZE_LABELS,
  READER_FONT_SIZE_TIERS,
  isReaderFontSizeTier,
  useReaderBookQuotes,
  useReaderBookSession,
  useReaderFontSize,
  type BookId,
  type ReaderBook,
  type ReaderFontSizeTier,
  type ReaderLocation,
  type ReaderSurfaceHandle,
  type ReaderSurfaceProps,
} from "./reader";