import { Directory, File, Paths } from "expo-file-system";
import { strFromU8, strToU8, unzipSync } from "fflate";

import { safeArchiveSegments, safeDirectoryName } from "./archivePaths";
import { isRenderableContentDocument, neutralizeScripts } from "./neutralizeScripts";

/**
 * The reader WebView renders spine documents straight from disk, so each book is unpacked
 * into its own directory. The original `.epub` stays the source of truth (see
 * `getLibraryEpubRoot`); this directory is a regenerable cache under the OS cache root
 * (excluded from backups, may be purged — we simply re-extract).
 */
const EXTRACTED_ROOT = "epub-extracted";
const MARKER_FILENAME = ".bookmites-extracted.json";

/** Bump when the extraction output changes (e.g. sanitisation rules) to force re-extraction. */
export const EXTRACTION_FORMAT_VERSION = 1;

type ExtractionMarker = {
  formatVersion: number;
  sourceSize: number;
  extractedAt: number;
};

function withTrailingSlash(uri: string): string {
  return uri.endsWith("/") ? uri : `${uri}/`;
}

export function extractedBookDirectory(bookId: string): Directory {
  return new Directory(Paths.cache, EXTRACTED_ROOT, safeDirectoryName(bookId));
}

function readMarker(directory: Directory): ExtractionMarker | null {
  const marker = new File(directory, MARKER_FILENAME);
  if (!marker.exists) {
    return null;
  }
  try {
    return JSON.parse(marker.textSync()) as ExtractionMarker;
  } catch {
    return null;
  }
}

function isCurrent(marker: ExtractionMarker | null, sourceSize: number): boolean {
  return (
    marker !== null &&
    marker.formatVersion === EXTRACTION_FORMAT_VERSION &&
    marker.sourceSize === sourceSize
  );
}

/**
 * Ensures `sourceEpubUri` is unpacked for `bookId` and returns the extracted root as a
 * `file://` URI with a trailing slash. Re-extracts when the cache is missing, stale, or
 * was interrupted (the marker is written last).
 */
export async function ensureExtractedEpub(bookId: string, sourceEpubUri: string): Promise<string> {
  const source = new File(sourceEpubUri);
  if (!source.exists) {
    throw new Error("The epub file is missing from storage.");
  }
  const sourceSize = source.size;
  const directory = extractedBookDirectory(bookId);

  if (directory.exists && isCurrent(readMarker(directory), sourceSize)) {
    return withTrailingSlash(directory.uri);
  }

  if (directory.exists) {
    directory.delete();
  }
  directory.create({ intermediates: true });

  try {
    const archive = unzipSync(await source.bytes());
    if (!archive["META-INF/container.xml"]) {
      throw new Error("This file is not a valid epub (missing META-INF/container.xml).");
    }

    for (const [entryName, data] of Object.entries(archive)) {
      const segments = safeArchiveSegments(entryName);
      if (!segments) {
        continue;
      }
      const target = new File(directory, ...segments);
      target.create({ intermediates: true, overwrite: true });
      target.write(isRenderableContentDocument(entryName) ? sanitizeDocument(data) : data);
    }

    const marker: ExtractionMarker = {
      formatVersion: EXTRACTION_FORMAT_VERSION,
      sourceSize,
      extractedAt: Date.now(),
    };
    new File(directory, MARKER_FILENAME).write(JSON.stringify(marker));
  } catch (error) {
    if (directory.exists) {
      directory.delete();
    }
    throw error;
  }

  return withTrailingSlash(directory.uri);
}

/** Removes a book's extracted cache (e.g. when the book or its file is removed). */
export function deleteExtractedEpub(bookId: string): void {
  const directory = extractedBookDirectory(bookId);
  if (directory.exists) {
    directory.delete();
  }
}

function hasUtf16ByteOrderMark(data: Uint8Array): boolean {
  return (data[0] === 0xff && data[1] === 0xfe) || (data[0] === 0xfe && data[1] === 0xff);
}

function sanitizeDocument(data: Uint8Array): Uint8Array {
  // UTF-16 content documents are vanishingly rare; decoding them as UTF-8 would corrupt
  // the file, so they pass through unmodified.
  if (hasUtf16ByteOrderMark(data)) {
    return data;
  }
  const markup = strFromU8(data);
  const neutralized = neutralizeScripts(markup);
  return neutralized === markup ? data : strToU8(neutralized);
}
