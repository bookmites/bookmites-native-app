import { getInfoAsync } from "expo-file-system/legacy";

import { getLibraryEpubRoot } from "../library/getLibraryEpubRoot";

/** Joins library root + stored relative path into the imported epub’s `file://` URI. */
export function resolveImportedEpubPath(libraryRelativePath: string): string {
  const root = getLibraryEpubRoot();
  const relative = libraryRelativePath.replace(/^\/+/, "");
  return `${root}${relative}`;
}

export async function importedEpubExists(libraryRelativePath: string): Promise<boolean> {
  const path = resolveImportedEpubPath(libraryRelativePath);
  const info = await getInfoAsync(path);
  return info.exists;
}