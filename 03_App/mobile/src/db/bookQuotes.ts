import { randomUUID } from "expo-crypto";
import { desc, eq } from "drizzle-orm";

import { getDb } from "./client";
import { bookQuotes, books, type BookQuoteRow } from "./schema";

export type BookQuoteWithBookTitle = BookQuoteRow & {
  bookTitle: string;
  bookAuthor: string | null;
};

export async function createBookQuote(input: {
  bookId: string;
  locatorJson: string;
  snippet: string;
}): Promise<BookQuoteRow> {
  const db = getDb();
  const now = Date.now();
  const row: BookQuoteRow = {
    quoteId: randomUUID(),
    bookId: input.bookId,
    locatorJson: input.locatorJson,
    snippet: input.snippet,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(bookQuotes).values(row);
  return row;
}

export async function updateBookQuote(input: {
  quoteId: string;
  locatorJson: string;
  snippet: string;
}): Promise<BookQuoteRow | null> {
  const db = getDb();
  const updatedAt = Date.now();

  await db
    .update(bookQuotes)
    .set({
      locatorJson: input.locatorJson,
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

export async function listBookQuotesByBook(bookId: string): Promise<BookQuoteRow[]> {
  const db = getDb();
  return db
    .select()
    .from(bookQuotes)
    .where(eq(bookQuotes.bookId, bookId))
    .orderBy(desc(bookQuotes.createdAt));
}

export async function listAllBookQuotes(): Promise<BookQuoteWithBookTitle[]> {
  const db = getDb();
  const rows = await db
    .select({
      quoteId: bookQuotes.quoteId,
      bookId: bookQuotes.bookId,
      locatorJson: bookQuotes.locatorJson,
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