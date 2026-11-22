import { File } from "expo-file-system";

import { Epub, type FSOperations } from "../core";
import { ensureExtractedEpub } from "./extractEpub";

const fsOperations: FSOperations = {
  readFile: (uri: string) => new File(uri).text(),
};

export type OpenedEpub = {
  epub: Epub;
  /** Extracted root, `file://` with trailing slash. The reader WebView may read only below it. */
  rootUri: string;
};

/** Extracts (if needed) and parses an epub so the reader can render it. */
export async function openExtractedEpub(bookId: string, sourceEpubUri: string): Promise<OpenedEpub> {
  const rootUri = await ensureExtractedEpub(bookId, sourceEpubUri);
  const epub = await Epub.open(rootUri, fsOperations);
  if (epub.spine.itemref.length === 0) {
    throw new Error("This epub has no readable content (empty spine).");
  }
  return { epub, rootUri };
}
