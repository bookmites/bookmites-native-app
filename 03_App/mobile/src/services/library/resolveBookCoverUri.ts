import { getBook } from "@/db/books";
import { openExtractedEpub } from "@/services/epub/storage/openExtractedEpub";
import { resolveBookSourceUri } from "@/services/reader/resolveBookSource";

function toFileUri(path: string): string {
  if (path.startsWith("file://")) {
    return path;
  }
  return `file://${path}`;
}

/** Cover image URI for list UI, or null when the package has no cover or the book cannot be opened. */
export async function resolveBookCoverUri(bookId: string): Promise<string | null> {
  const book = await getBook(bookId);
  if (!book || book.fileOnDevice !== 1) {
    return null;
  }

  try {
    const sourceUri = await resolveBookSourceUri(book);
    const { epub } = await openExtractedEpub(bookId, sourceUri);
    const info = await epub.getBookInfo();
    if (!info.coverImgPath) {
      return null;
    }
    return toFileUri(info.coverImgPath);
  } catch {
    return null;
  }
}