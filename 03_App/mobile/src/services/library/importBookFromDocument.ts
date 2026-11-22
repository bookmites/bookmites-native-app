import * as DocumentPicker from "expo-document-picker";
import { deleteAsync, getInfoAsync } from "expo-file-system/legacy";
import { randomUUID } from "expo-crypto";

import { upsertBook } from "@/db/books";
import { BOOK_KINDS } from "@/db/schema";

import { deleteExtractedEpub, readEpubMetadata, titleFromFilename } from "../epub";
import { copyPickerAssetToLibrary } from "./copyPickerAssetToLibrary";
import { ensureLibraryEpubDirectory } from "./ensureLibraryEpubDirectory";
import { destinationPathForImport, libraryRelativePathForImport } from "./importPaths";

export type ImportBookResult =
  | { status: "canceled" }
  | { status: "success"; bookId: string }
  | { status: "error"; message: string };

const EPUB_MIME = "application/epub+zip";

export async function pickAndImportBook(): Promise<ImportBookResult> {
  const pick = await DocumentPicker.getDocumentAsync({
    type: EPUB_MIME,
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (pick.canceled || pick.assets.length === 0) {
    return { status: "canceled" };
  }

  const asset = pick.assets[0];
  if (!isLikelyEpub(asset)) {
    return { status: "error", message: "Please choose an EPUB file." };
  }

  const bookId = randomUUID();
  const relativePath = libraryRelativePathForImport(bookId);
  const destination = destinationPathForImport(bookId);
  const filenameForTitle = asset.name ?? titleFromFilename(asset.uri);

  try {
    await ensureLibraryEpubDirectory();
    await copyPickerAssetToLibrary(asset.uri, destination);

    // Extracting at import validates the file (the reader renders the extracted copy) and
    // makes the first open instant. An epub we cannot unpack and parse is rejected here.
    let title: string;
    let author: string | null;
    try {
      ({ title, author } = await readEpubMetadata(bookId, destination, filenameForTitle));
    } catch (error) {
      console.warn("Rejected epub at import", error);
      throw new Error("This file could not be opened as an epub.");
    }

    await upsertBook({
      bookId,
      title,
      author,
      kind: BOOK_KINDS.imported,
      libraryRelativePath: relativePath,
      fileOnDevice: true,
    });

    return { status: "success", bookId };
  } catch (error) {
    await removeFileIfPresent(destination);
    deleteExtractedEpub(bookId);
    const message = error instanceof Error ? error.message : "Could not import this book.";
    return { status: "error", message };
  }
}

function isLikelyEpub(asset: DocumentPicker.DocumentPickerAsset): boolean {
  const mime = asset.mimeType?.toLowerCase();
  if (mime === EPUB_MIME || mime === "application/epub") {
    return true;
  }
  const name = asset.name?.toLowerCase() ?? asset.uri.toLowerCase();
  return name.endsWith(".epub");
}

async function removeFileIfPresent(path: string): Promise<void> {
  const info = await getInfoAsync(path);
  if (info.exists) {
    await deleteAsync(path, { idempotent: true });
  }
}