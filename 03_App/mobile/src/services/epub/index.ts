/**
 * Epub services: the in-house engine (`core/`), the reader WebView bundle (`injected/`), and
 * on-device storage (`storage/`). See README.md for the layout.
 */
export {
  CFI,
  Epub,
  cfiFromBodyAddress,
  cfiFromRefCode,
  parseCfiLocation,
  rangeCfiFromBodyAddresses,
  refCodeFromCFI,
  startCfiOf,
  type CfiLocation,
  type EpubBookInfo,
  type FullAddress,
} from "./core";
export { readEpubMetadata, titleFromFilename, type EpubMetadataResult } from "./readEpubMetadata";
export { deleteExtractedEpub, ensureExtractedEpub } from "./storage/extractEpub";
export { openExtractedEpub, type OpenedEpub } from "./storage/openExtractedEpub";
