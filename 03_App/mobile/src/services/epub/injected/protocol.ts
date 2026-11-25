/**
 * Message protocol between the app (React Native) and the reader bundle running inside the
 * WebView. Type-only and dependency-free so both sides can import it.
 *
 * Addresses are body-relative selector addresses for the currently loaded spine document;
 * the app converts them to and from CFIs (`core/location.ts`).
 */
import type { EpubPaginationConfig } from '../core/display/page'
import type { FullAddress } from '../core/select/utils'

/** Global the bundle installs on `window`. */
export const BRIDGE_GLOBAL = '__bookmites'
/** Global the app sets (before the bundle runs) with the document's initial state. */
export const PRELOAD_GLOBAL = '__bookmitesPreload'

export interface AddressRange {
    start: FullAddress
    end: FullAddress
}

/** Where to put the viewport once the document has laid out. */
export type ReaderTarget =
    | { kind: 'start' }
    | { kind: 'end' }
    | { kind: 'address'; address: FullAddress }
    | { kind: 'fragment'; id: string }

export interface InjectedHighlight {
    id: string
    start: FullAddress
    end: FullAddress
    color: string
}

export interface PreloadParams {
    /** 0-based spine index of the document this script is meant for. */
    spineIndex: number
    /**
     * Trailing path of the spine document's URL. Android may evaluate the before-content
     * script while the *previous* document is still current; the bundle compares this to
     * `location.href` and ignores documents it wasn't built for.
     */
    documentPath: string
    css: string
    layout: EpubPaginationConfig
    target: ReaderTarget
    highlights: InjectedHighlight[]
}

/** App → WebView. */
export type ReaderCommand =
    | { type: 'style'; css: string }
    | { type: 'highlights'; highlights: InjectedHighlight[] }
    | { type: 'goTo'; target: ReaderTarget }
    | { type: 'select'; range: AddressRange }
    | { type: 'clearSelection' }
    | { type: 'setTextSelectionEnabled'; enabled: boolean }

/** WebView → app. */
export type ReaderMessage =
    | { type: 'ready'; spineIndex: number; visible: AddressRange | null }
    | { type: 'location'; spineIndex: number; visible: AddressRange }
    | { type: 'selection'; spineIndex: number; range: AddressRange | null; text: string }
    | { type: 'highlightTap'; spineIndex: number; id: string }
    | { type: 'contentTap'; spineIndex: number }
    | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
