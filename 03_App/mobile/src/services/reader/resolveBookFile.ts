import type { ReadiumFile } from "react-native-readium";

import { getBook } from "@/db/books";
import { BOOK_KINDS, type BookRow } from "@/db/schema";

import { isFixtureId } from "./fixtures";
import { loadStoredLocator } from "./locatorStorage";
import { importedEpubExists, resolveImportedEpubPath } from "./resolveImportedEpubPath";
import { resolveBundledEpub } from "./resolveBundledEpub";

export type ResolvedBookFile = ReadiumFile & { url: string; title: string };

async function resolveEpubUrl(book: BookRow): Promise<string> {
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

/**
 * Resolves a `bookId` to an on-device epub and any saved reading position.
 */
export async function resolveBookFile(bookId: string): Promise<ResolvedBookFile> {
  const book = await getBook(bookId);
  if (!book) {
    throw new Error(`Unknown book “${bookId}”.`);
  }

  const url = await resolveEpubUrl(book);
  const initialLocation = await loadStoredLocator(bookId);

  const base = { url, title: book.title };
  return initialLocation ? { ...base, initialLocation } : base;
}