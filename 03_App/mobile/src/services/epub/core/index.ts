/**
 * Epub core: package parsing, CFIs, selectors, and refcodes.
 *
 * Pure TypeScript, safe to import from the app process (React Native) and from tests.
 * The browser-only rendering modules live in `./display` and are imported directly by the
 * reader WebView bundle (`../injected`), never by app code.
 */
export { Epub, parseOpfMetadata, type EpubBookInfo, type FSOperations } from './epub'
export type { Manifest, ManifestItem, Metadata, Package, Spine, Itemref } from './models'
export {
    cfiFromBodyAddress,
    cfiSpineStep,
    parseCfiLocation,
    rangeCfiFromBodyAddresses,
    spineIndexFromCfiStep,
    startCfiOf,
    type CfiLocation,
} from './location'
export { CFI } from './select/cfi'
export { cfiFromRefCode, refCodeFromCFI } from './select/refcode'
export type { FullAddress, NodeAddress } from './select/utils'
