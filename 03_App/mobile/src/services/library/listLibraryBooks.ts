import { listBooks } from "@/db/books";
import type { BookRow } from "@/db/schema";
import { BOOK_KINDS } from "@/db/schema";

/** UI sort: bundled_fixture first (smoke), then imported titles A→Z. */
export async function listLibraryBooks(): Promise<BookRow[]> {
  const rows = await listBooks();
  return sortLibraryBooks(rows);
}

export function sortLibraryBooks(rows: BookRow[]): BookRow[] {
  return [...rows].sort((a, b) => {
    const aFixture = a.kind === BOOK_KINDS.bundledFixture;
    const bFixture = b.kind === BOOK_KINDS.bundledFixture;
    if (aFixture !== bFixture) {
      return aFixture ? -1 : 1;
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}