/**
 * Cross-feature services (import, reader adapter, etc.).
 * Readium stays behind services — not in features (ticket 001).
 */
export {
  listLibraryBooks,
  pickAndImportBook,
  type ImportBookResult,
} from "./library";
export {
  BOOK_IDS,
  ReaderSurface,
  resolveBookFile,
  useReaderBookSession,
  type BookId,
  type ReaderSurfaceProps,
  type ResolvedBookFile,
} from "./reader";