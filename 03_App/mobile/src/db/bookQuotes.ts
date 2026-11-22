import { randomUUID } from "expo-crypto";
import { asc, desc, eq, sql } from "drizzle-orm";

import { getDb } from "./client";
import { bookQuotes, books, type BookQuoteRow } from "./schema";

export type BookQuoteWithBookTitle = BookQuoteRow & {
  bookTitle: string;
  bookAuthor: string | null;
};

export async function createBookQuote(input: {
  bookId: string;
  cfi: string;
  refcode: number | null;
  snippet: string;
}): Promise<BookQuoteRow> {
  const db = getDb();
  const now = Date.now();
  const row: BookQuoteRow = {
    quoteId: randomUUID(),
    bookId: input.bookId,
    cfi: input.cfi,
    refcode: input.refcode,
    snippet: input.snippet,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(bookQuotes).values(row);
  return row;
}

export async function updateBookQuote(input: {
  quoteId: string;
  cfi: string;
  refcode: number | null;
  snippet: string;
}): Promise<BookQuoteRow | null> {
  const db = getDb();
  const updatedAt = Date.now();

  await db
    .update(bookQuotes)
    .set({
      cfi: input.cfi,
      refcode: input.refcode,
      snippet: input.snippet,
      updatedAt,
    })
    .where(eq(bookQuotes.quoteId, input.quoteId));

  const rows = await db
    .select()
    .from(bookQuotes)
    .where(eq(bookQuotes.quoteId, input.quoteId))
    .limit(1);

  return rows[0] ?? null;
}

/** Quotes for one book in reading order (refcode), unsortable ones last by creation time. */
export async function listBookQuotesByBook(bookId: string): Promise<BookQuoteRow[]> {
  const db = getDb();
  return db
    .select()
    .from(bookQuotes)
    .where(eq(bookQuotes.bookId, bookId))
    .orderBy(sql`${bookQuotes.refcode} IS NULL`, asc(bookQuotes.refcode), asc(bookQuotes.createdAt));
}

export async function listAllBookQuotes(): Promise<BookQuoteWithBookTitle[]> {
  const db = getDb();
  const rows = await db
    .select({
      quoteId: bookQuotes.quoteId,
      bookId: bookQuotes.bookId,
      cfi: bookQuotes.cfi,
      refcode: bookQuotes.refcode,
      snippet: bookQuotes.snippet,
      createdAt: bookQuotes.createdAt,
      updatedAt: bookQuotes.updatedAt,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(bookQuotes)
    .innerJoin(books, eq(bookQuotes.bookId, books.bookId))
    .orderBy(desc(bookQuotes.createdAt));

  return rows;
}