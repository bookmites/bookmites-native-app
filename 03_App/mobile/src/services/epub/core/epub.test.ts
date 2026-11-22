/// <reference types="node" />
import * as matchers from 'jest-extended';
import { Epub } from "./epub";
import { readFile } from "fs/promises";
expect.extend(matchers);

const TEST_EPUB_PATH = 'test/fixtures/epub/guy'

describe('epub', () => {

    let epub : Epub

    beforeAll(async () => {
        epub = await Epub.open(TEST_EPUB_PATH, {
            readFile: (path) => readFile(path, 'utf-8'),
        })
    })

    it('should be able to load the test epub', async () => {
        const html = await epub.spineFile(0)
        expect(html).toBeDefined()
        expect(html).toContain('Guy de Maupassant')

        const html2 = await epub.spineFile(6)
        expect(html2).toBeDefined()
        expect(html2).toContain('Suddenly, Madame de Marelle exclaimed in astonishment')
    })
    it('should be able to extract text range', async () => {
        const cfiStart = 'epubcfi(/6/6!/4/2/4/1:9)'
        const cfiEnd = 'epubcfi(/6/6!/4/2/4/1:16)'

        const text = await epub.extractTextRange(cfiStart, cfiEnd)
        expect(text).toBeDefined()
        expect(text).toContain('cashier')
    })
    it('should be able to extract text range across multiple spine indices', async () => {
        const cfiStart = 'epubcfi(/6/14!/4/2/480/1:0)'
        const cfiEnd = 'epubcfi(/6/16!/4/2/6/1:80)'
        const text = await epub.extractTextRange(cfiStart, cfiEnd)
        const clean = text.trim()
        expect(clean).toBeDefined()
        expect(clean).toBeString()
        expect(clean).toStartWith('One evening she said')
        expect(clean).toEndWith('began to reflect.')
    })
})
