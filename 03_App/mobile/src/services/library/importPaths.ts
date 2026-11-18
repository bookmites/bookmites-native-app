import { resolveImportedEpubPath } from "../reader/resolveImportedEpubPath";

/** DB column value for a new import (ticket 004). */
export function libraryRelativePathForImport(bookId: string): string {
  return `${bookId}.epub`;
}

/** Absolute destination path for copy-on-import. */
export function destinationPathForImport(bookId: string): string {
  return resolveImportedEpubPath(libraryRelativePathForImport(bookId));
}