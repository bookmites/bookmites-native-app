/// <reference types="node" />
import { readFile } from "fs/promises"
import { Epub } from "../epub"
import { cfiFromRefCode, refCodeFromCFI } from "./refcode"

const TEST_EPUB_PATH = 'test/fixtures/epub/guy'

describe('refcode', () => {

    let epub : Epub

    beforeAll(async () => {
        epub = await Epub.open(TEST_EPUB_PATH, {
            readFile: (path) => readFile(path, 'utf-8'),
        })
    })

    it('should be able to convert cfi to refcode', async () => {
        const cfi = 'epubcfi(/6/6!/4/2/4/1:9)'
        const refCode = await refCodeFromCFI(cfi, epub)
        expect(refCode).toBeDefined()
        expect(refCode).toBe(1002000100009)
    })

    it('round-trips refcode back to the same CFI', async () => {
        const cfi = 'epubcfi(/6/6!/4/2/4/1:9)'
        const refCode = await refCodeFromCFI(cfi, epub)
        expect(refCode).toBeDefined()
        expect(await cfiFromRefCode(refCode ?? 0, epub)).toBe(cfi)
    })

    it('orders refcodes in reading order', async () => {
        // Same spine doc (later paragraph, then later offset), then a later spine doc.
        const inReadingOrder = [
            'epubcfi(/6/6!/4/2/4/1:9)',
            'epubcfi(/6/6!/4/2/4/1:16)',
            'epubcfi(/6/6!/4/2/6/1:0)',
            'epubcfi(/6/16!/4/2/6/1:80)',
        ]
        const codes = await Promise.all(inReadingOrder.map(cfi => refCodeFromCFI(cfi, epub)))
        codes.forEach(code => { expect(code).toBeDefined() })
        const sorted = [...codes].sort((a, b) => (a ?? 0) - (b ?? 0))
        expect(sorted).toEqual(codes)
    })

    it('maps an element-terminating CFI to its first text node', async () => {
        const elementCode = await refCodeFromCFI('epubcfi(/6/6!/4/2/4)', epub)
        const textCode = await refCodeFromCFI('epubcfi(/6/6!/4/2/4/1:0)', epub)
        expect(elementCode).toBeDefined()
        expect(elementCode).toBe(textCode)
    })

})
