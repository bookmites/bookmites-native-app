import { eq } from "drizzle-orm";

import { getDb } from "./client";
import {
  READER_GLOBAL_SETTINGS_ID,
  readerGlobalSettings,
} from "./schema";

const DEFAULT_FONT_SIZE_TIER = "medium";

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