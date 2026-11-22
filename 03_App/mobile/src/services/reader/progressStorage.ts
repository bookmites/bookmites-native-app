import { deleteReadingProgress, getReadingProgressCfi, upsertReadingProgressCfi } from "@/db/readingProgress";
import { parseCfiLocation } from "@/services/epub";

/** Saved reading position as a point CFI, or undefined when none / unreadable. */
export async function loadStoredProgressCfi(bookId: string): Promise<string | undefined> {
  const cfi = await getReadingProgressCfi(bookId);
  if (!cfi) {
    return undefined;
  }
  if (!parseCfiLocation(cfi)) {
    console.warn(`Unreadable progress CFI for book “${bookId}”; clearing row.`);
    await deleteReadingProgress(bookId);
    return undefined;
  }
  return cfi;
}

export async function saveStoredProgressCfi(bookId: string, cfi: string): Promise<void> {
  await upsertReadingProgressCfi(bookId, cfi);
}
