import { getInfoAsync, makeDirectoryAsync } from "expo-file-system/legacy";

import { getLibraryEpubRoot } from "./getLibraryEpubRoot";

export async function ensureLibraryEpubDirectory(): Promise<void> {
  const root = getLibraryEpubRoot();
  const info = await getInfoAsync(root);
  if (!info.exists) {
    await makeDirectoryAsync(root, { intermediates: true });
  }
}