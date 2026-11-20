/**
 * Cross-feature services (import, reader adapter, etc.).
 * Readium stays behind services — not in features (ticket 001).
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
  resolveBookFile,
  useReaderBookQuotes,
  useReaderBookSession,
  useReaderFontSize,
  type BookId,
  type ReaderFontSizeTier,
  type ReaderSurfaceProps,
  type ResolvedBookFile,
} from "./reader";