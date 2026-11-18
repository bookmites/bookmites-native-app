import { asc, eq } from "drizzle-orm";

import { getDb } from "./client";
import { BOOK_KINDS, type BookKind, books, type BookRow } from "./schema";

export type UpsertBookInput = {
  bookId: string;
  title: string;
  author?: string | null;
  kind: BookKind;
  fixtureKey?: string | null;
  libraryRelativePath?: string | null;
  fileOnDevice: boolean;
};

export async function getBook(bookId: string): Promise<BookRow | null> {
  const db = getDb();
  const rows = await db.select().from(books).where(eq(books.bookId, bookId)).limit(1);
  return rows[0] ?? null;
}

export async function listBooks(): Promise<BookRow[]> {
  const db = getDb();
  return db.select().from(books).orderBy(asc(books.title));
}

export async function upsertBook(input: UpsertBookInput): Promise<void> {
  const db = getDb();
  const now = Date.now();

  await db
    .insert(books)
    .values({
      bookId: input.bookId,
      title: input.title,
      author: input.author ?? null,
      kind: input.kind,
      fixtureKey: input.fixtureKey ?? null,
      libraryRelativePath: input.libraryRelativePath ?? null,
      fileOnDevice: input.fileOnDevice ? 1 : 0,
      addedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: books.bookId,
      set: {
        title: input.title,
        author: input.author ?? null,
        kind: input.kind,
        fixtureKey: input.fixtureKey ?? null,
        libraryRelativePath: input.libraryRelativePath ?? null,
        fileOnDevice: input.fileOnDevice ? 1 : 0,
        updatedAt: now,
      },
    });
}

export function isBookKind(value: string): value is BookKind {
  return value === BOOK_KINDS.bundledFixture || value === BOOK_KINDS.imported;
}