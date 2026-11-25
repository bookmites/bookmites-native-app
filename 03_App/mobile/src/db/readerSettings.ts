import { eq } from "drizzle-orm";

import { getBook } from "./books";
import { getDb } from "./client";
import {
  READER_GLOBAL_SETTINGS_ID,
  readerGlobalSettings,
} from "./schema";

const DEFAULT_FONT_SIZE_TIER = "medium";

async function ensureGlobalSettingsRow(): Promise<void> {
  const db = getDb();
  const rows = await db
    .select()
    .from(readerGlobalSettings)
    .where(eq(readerGlobalSettings.id, READER_GLOBAL_SETTINGS_ID))
    .limit(1);
  if (rows[0]) {
    return;
  }
  await db.insert(readerGlobalSettings).values({
    id: READER_GLOBAL_SETTINGS_ID,
    fontSizeTier: DEFAULT_FONT_SIZE_TIER,
    updatedAt: Date.now(),
  });
}

export async function getReaderFontSizeTier(): Promise<string> {
  const db = getDb();
  const rows = await db
    .select()
    .from(readerGlobalSettings)
    .where(eq(readerGlobalSettings.id, READER_GLOBAL_SETTINGS_ID))
    .limit(1);
  return rows[0]?.fontSizeTier ?? DEFAULT_FONT_SIZE_TIER;
}

export async function setReaderFontSizeTier(tier: string): Promise<void> {
  const db = getDb();
  const now = Date.now();

  await db
    .insert(readerGlobalSettings)
    .values({
      id: READER_GLOBAL_SETTINGS_ID,
      fontSizeTier: tier,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: readerGlobalSettings.id,
      set: {
        fontSizeTier: tier,
        updatedAt: now,
      },
    });
}

export async function getLastOpenedBookId(): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ lastOpenedBookId: readerGlobalSettings.lastOpenedBookId })
    .from(readerGlobalSettings)
    .where(eq(readerGlobalSettings.id, READER_GLOBAL_SETTINGS_ID))
    .limit(1);
  return rows[0]?.lastOpenedBookId ?? null;
}

export async function setLastOpenedBookId(bookId: string): Promise<void> {
  const db = getDb();
  const now = Date.now();
  await ensureGlobalSettingsRow();

  await db
    .insert(readerGlobalSettings)
    .values({
      id: READER_GLOBAL_SETTINGS_ID,
      fontSizeTier: DEFAULT_FONT_SIZE_TIER,
      lastOpenedBookId: bookId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: readerGlobalSettings.id,
      set: {
        lastOpenedBookId: bookId,
        updatedAt: now,
      },
    });
}

/** Last-opened book when the row still exists and `file_on_device` is set. */
export async function getValidLastOpenedBookId(): Promise<string | null> {
  const bookId = await getLastOpenedBookId();
  if (!bookId) {
    return null;
  }
  const book = await getBook(bookId);
  if (!book || book.fileOnDevice !== 1) {
    return null;
  }
  return bookId;
}