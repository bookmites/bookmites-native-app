/** Stable book ids for persistence and navigation (ticket 002+). */
export const BOOK_IDS = {
  fixtureSmoke: "fixture.smoke",
} as const;

export type BookId = (typeof BOOK_IDS)[keyof typeof BOOK_IDS];

const KNOWN_BOOK_IDS = new Set<string>(Object.values(BOOK_IDS));

export function isBookId(id: string): id is BookId {
  return KNOWN_BOOK_IDS.has(id);
}