import { documentDirectory } from "expo-file-system/legacy";

/** App-private directory for imported epub copies (ticket 003). */
const LIBRARY_EPUBS_DIR = "epubs";

/**
 * Root for copy-on-import epubs. Imported rows store paths relative to this folder.
 */
export function getLibraryEpubRoot(): string {
  if (!documentDirectory) {
    throw new Error("Document directory is unavailable.");
  }

  const normalized = documentDirectory.endsWith("/") ? documentDirectory : `${documentDirectory}/`;
  return `${normalized}${LIBRARY_EPUBS_DIR}/`;
}