import { parsePackageMetadataFromEpubBytes } from "./parsePackageMetadata";
import { readEpubFileBytes } from "./readEpubBytes";

export type EpubMetadataResult = {
  title: string;
  author: string | null;
};

/**
 * Reads dc:title / dc:creator from a copied epub on disk.
 * Caller supplies filename fallback when parse returns no title.
 */
export async function readEpubPackageMetadata(
  absolutePath: string,
  filenameFallback: string,
): Promise<EpubMetadataResult> {
  const bytes = await readEpubFileBytes(absolutePath);
  const parsed = parsePackageMetadataFromEpubBytes(bytes);

  const title = parsed.title?.trim() || titleFromFilename(filenameFallback);
  const author = parsed.author?.trim() ?? null;

  return { title, author };
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "").replace(/\.epub$/i, "").trim();
  return base.length > 0 ? base : "Untitled book";
}