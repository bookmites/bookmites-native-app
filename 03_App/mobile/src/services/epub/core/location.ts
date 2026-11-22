import { CFI } from './select/cfi'
import type { FullAddress } from './select/utils'

/**
 * Conversions between EPUB CFIs and body-relative selector addresses.
 *
 * Selector addresses (`FullAddress`) are rooted at a spine document's `<body>` — the reader
 * WebView and the xmldom-backed `CFISelector` both work in that space. CFIs are rooted at
 * the package document, so they carry two extra steps: the spine step (`/6/N`, where
 * N = (spineIndex + 1) * 2) and the `<body>` step (`/4`, `<body>` being the second element
 * child of `<html>`).
 */

/** CFI package step for a 0-based spine index (spine itemrefs are even steps: 2, 4, 6, …). */
export const cfiSpineStep = (spineIndex: number) => (spineIndex + 1) * 2

/** 0-based spine index for a CFI's spine step. */
export const spineIndexFromCfiStep = (spineStep: number) => spineStep / 2 - 1

const BODY_STEP = 4

/** Point CFI for a body-relative address in the given spine document. */
export function cfiFromBodyAddress(spineIndex: number, address: FullAddress): string {
    const steps = address.filter((step): step is number => typeof step === 'number')
    const offset = address.find((step): step is `:${number}` => typeof step === 'string')
    const path = [BODY_STEP, ...steps].join('/')
    return `epubcfi(/6/${String(cfiSpineStep(spineIndex))}!/${path}${offset ?? ''})`
}

/** Range CFI spanning two body-relative addresses within one spine document. */
export function rangeCfiFromBodyAddresses(spineIndex: number, start: FullAddress, end: FullAddress): string | null {
    const range = CFI.fromRange(cfiFromBodyAddress(spineIndex, start), cfiFromBodyAddress(spineIndex, end))
    return range?.isValid ? range.toString() : null
}

export interface CfiLocation {
    /** 0-based spine index. */
    spineIndex: number
    /** Body-relative start address. Equal to `end` for a point CFI. */
    start: FullAddress
    end: FullAddress
    isRange: boolean
}

/** Parses a point or range CFI into a spine index and body-relative addresses. */
export function parseCfiLocation(cfiString: string): CfiLocation | null {
    const cfi = CFI.fromString(cfiString)
    if (!cfi.isValid) {
        return null
    }
    const spineIndex = cfi.spineIndexRaw
    if (!Number.isInteger(spineIndex) || spineIndex < 0) {
        return null
    }
    if (cfi.isRange) {
        const [start, end] = cfi.toSelectorAddressRange()
        if (!start || !end) {
            return null
        }
        return { spineIndex, start, end, isRange: true }
    }
    const point = cfi.toSelectorAddress()
    return { spineIndex, start: point, end: point, isRange: false }
}

/** Point CFI for the start of a (point or range) CFI. */
export function startCfiOf(cfiString: string): string | null {
    const location = parseCfiLocation(cfiString)
    return location ? cfiFromBodyAddress(location.spineIndex, location.start) : null
}
