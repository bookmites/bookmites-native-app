import { cfiFromBodyAddress, parseCfiLocation, rangeCfiFromBodyAddresses, startCfiOf } from './location'

describe('location', () => {
    it('builds a point CFI from a body address', () => {
        expect(cfiFromBodyAddress(2, [2, 4, 1, ':9'])).toBe('epubcfi(/6/6!/4/2/4/1:9)')
        expect(cfiFromBodyAddress(0, [2])).toBe('epubcfi(/6/2!/4/2)')
    })

    it('round-trips a point CFI', () => {
        const parsed = parseCfiLocation('epubcfi(/6/6!/4/2/4/1:9)')
        expect(parsed).toEqual({ spineIndex: 2, start: [2, 4, 1, ':9'], end: [2, 4, 1, ':9'], isRange: false })
    })

    it('round-trips a range CFI', () => {
        const range = rangeCfiFromBodyAddresses(2, [2, 4, 1, ':9'], [2, 6, 1, ':16'])
        expect(range).toBe('epubcfi(/6/6!/4/2,/4/1:9,/6/1:16)')
        const parsed = parseCfiLocation(range ?? '')
        expect(parsed).toEqual({ spineIndex: 2, start: [2, 4, 1, ':9'], end: [2, 6, 1, ':16'], isRange: true })
        expect(startCfiOf(range ?? '')).toBe('epubcfi(/6/6!/4/2/4/1:9)')
    })

    it('rejects garbage', () => {
        expect(parseCfiLocation('not a cfi')).toBeNull()
    })
})
