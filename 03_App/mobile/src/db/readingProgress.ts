import { eq } from "drizzle-orm";

import { getDb } from "./client";
import { readingProgress } from "./schema";

export async function getReadingProgressJson(bookId: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(readingProgress)
    .where(eq(readingProgress.bookId, bookId))
    .limit(1);

  return rows[0]?.locatorJson ?? null;
}

export async function deleteReadingProgress(bookId: string): Promise<void> {
  const db = getDb();
  await db.delete(readingProgress).where(eq(readingProgress.bookId, bookId));
}

export async function upsertReadingProgressJson(
  bookId: string,
  locatorJson: string,
): Promise<void> {
  const db = getDb();
  const updatedAt = Date.now();

  await db
    .insert(readingProgress)
    .values({ bookId, locatorJson, updatedAt })
    .onConflictDoUpdate({
      target: readingProgress.bookId,
      set: { locatorJson, updatedAt },
    });
}