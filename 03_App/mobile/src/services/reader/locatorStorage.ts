import type { Locator } from "react-native-readium";

import {
  deleteReadingProgress,
  getReadingProgressJson,
  upsertReadingProgressJson,
} from "@/db/readingProgress";

export async function loadStoredLocator(bookId: string): Promise<Locator | undefined> {
  const raw = await getReadingProgressJson(bookId);
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as Locator;
  } catch {
    console.warn(`Corrupt locator_json for book “${bookId}”; clearing row.`);
    await deleteReadingProgress(bookId);
    return undefined;
  }
}

export async function saveStoredLocator(bookId: string, locator: Locator): Promise<void> {
  await upsertReadingProgressJson(bookId, JSON.stringify(locator));
}