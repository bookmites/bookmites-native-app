import { openExtractedEpub, type Epub } from "@/services/epub";

import { loadStoredProgressCfi } from "./progressStorage";
import { getBookOrThrow, resolveBookSourceUri } from "./resolveBookSource";

/** An epub ready to render: parsed package plus the extracted directory the WebView reads. */
export type ReaderBook = {
  bookId: string;
  title: string;
  epub: Epub;
  /** Extracted root (`file://`, trailing slash). The WebView may read only below it. */
  rootUri: string;
};

export type OpenedReaderBook = {
  book: ReaderBook;
  /** Saved position (point CFI), when there is one. */
  initialCfi?: string;
};

export async function openReaderBook(bookId: string): Promise<OpenedReaderBook> {
  const row = await getBookOrThrow(bookId);
  const sourceUri = await resolveBookSourceUri(row);
  const { epub, rootUri } = await openExtractedEpub(bookId, sourceUri);
  const initialCfi = await loadStoredProgressCfi(bookId);

  const book: ReaderBook = { bookId, title: row.title, epub, rootUri };
  return initialCfi ? { book, initialCfi } : { book };
}
