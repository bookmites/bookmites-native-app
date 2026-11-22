import { getBook } from "@/db/books";
import { BOOK_KINDS, type BookRow } from "@/db/schema";

import { isFixtureId } from "./fixtures";
import { resolveBundledEpub } from "./resolveBundledEpub";
import { importedEpubExists, resolveImportedEpubPath } from "./resolveImportedEpubPath";

/** URI of a book's original `.epub` (the source of truth the reader extracts from). */
export async function resolveBookSourceUri(book: BookRow): Promise<string> {
  if (book.kind === BOOK_KINDS.bundledFixture) {
    const fixtureKey = book.fixtureKey;
    if (!fixtureKey || !isFixtureId(fixtureKey)) {
      throw new Error(`Book “${book.bookId}” has an invalid bundled fixture.`);
    }
    return resolveBundledEpub(fixtureKey);
  }

  if (book.kind === BOOK_KINDS.imported) {
    if (!book.fileOnDevice) {
      throw new Error("This book’s file is not on device.");
    }
    const relative = book.libraryRelativePath;
    if (!relative) {
      throw new Error(`Book “${book.bookId}” has no library path.`);
    }
    if (!(await importedEpubExists(relative))) {
      throw new Error("This book’s file is missing from library storage.");
    }
    return resolveImportedEpubPath(relative);
  }

  throw new Error(`Unknown book kind for “${book.bookId}”.`);
}

export async function getBookOrThrow(bookId: string): Promise<BookRow> {
  const book = await getBook(bookId);
  if (!book) {
    throw new Error(`Unknown book “${bookId}”.`);
  }
  return book;
}
