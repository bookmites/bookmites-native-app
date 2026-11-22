import { safeArchiveSegments, safeDirectoryName } from './archivePaths'

describe('safeArchiveSegments', () => {
    it('splits ordinary entries', () => {
        expect(safeArchiveSegments('OEBPS/text/ch 1.xhtml')).toEqual(['OEBPS', 'text', 'ch 1.xhtml'])
        expect(safeArchiveSegments('mimetype')).toEqual(['mimetype'])
    })

    it('skips directory entries', () => {
        expect(safeArchiveSegments('OEBPS/')).toBeNull()
    })

    it('rejects paths that escape the destination', () => {
        expect(safeArchiveSegments('../evil.xhtml')).toBeNull()
        expect(safeArchiveSegments('OEBPS/../../evil')).toBeNull()
        expect(safeArchiveSegments('/etc/passwd')).toBeNull()
        expect(safeArchiveSegments('C:/x')).toBeNull()
        expect(safeArchiveSegments('OEBPS\\..\\x')).toBeNull()
        expect(safeArchiveSegments('a//b')).toBeNull()
    })
})

describe('safeDirectoryName', () => {
    it('keeps uuids and fixture ids', () => {
        expect(safeDirectoryName('fixture.smoke')).toBe('fixture.smoke')
        expect(safeDirectoryName('0b8f6f9e-2d0a-4c7e-9f0b-0f7f6a9b1c2d')).toBe('0b8f6f9e-2d0a-4c7e-9f0b-0f7f6a9b1c2d')
    })

    it('replaces unsafe characters and rejects dot-only names', () => {
        expect(safeDirectoryName('a/b')).toBe('a_b')
        expect(() => safeDirectoryName('..')).toThrow()
    })
})
