import { openExtractedEpub } from "./storage/openExtractedEpub";

export type EpubMetadataResult = {
  title: string;
  author: string | null;
};

/**
 * Extracts a copied epub (validating it can be rendered) and reads dc:title / dc:creator.
 * Throws when the file is not a readable epub. Falls back to the filename for a missing title.
 */
export async function readEpubMetadata(
  bookId: string,
  epubUri: string,
  filenameFallback: string,
): Promise<EpubMetadataResult> {
  const { epub } = await openExtractedEpub(bookId, epubUri);
  const info = await epub.getBookInfo();

  const title = info.title.trim() || titleFromFilename(filenameFallback);
  const author = info.author?.trim() || null;

  return { title, author };
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "").replace(/\.epub$/i, "").trim();
  return base.length > 0 ? base : "Untitled book";
}
