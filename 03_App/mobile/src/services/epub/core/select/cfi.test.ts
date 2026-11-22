import { CFI } from "./cfi"

describe('cfi', () => {

    it('should be able to parse a cfi', async () => {
        const cfi = 'epubcfi(/6/2!/4/2/4/8/2/2)'
        const parsed = CFI.fromString(cfi)
        expect(parsed).toBeDefined()
        expect(parsed.spineIndex).toBe(2)
        expect(parsed.baseSteps).toEqual([4, 2, 4, 8, 2, 2])
    })

    it('should be able to merge two cfis', async () => {
        const cfi1 = 'epubcfi(/6/2!/4/2/4/8/2/2/2/1:0)'
        const cfi2 = 'epubcfi(/6/2!/4/2/4/8/2/2/4/1:10)'
        const merged = CFI.fromRange(cfi1, cfi2)
        expect(merged).toBeDefined()
        expect(merged?.spineIndex).toBe(2)
        expect(merged?.baseSteps).toEqual([4,2,4,8,2,2])
        expect(merged?.rangeStart.toString()).toBe(cfi1)
        expect(merged?.rangeEnd.toString()).toBe(cfi2)

        const expected = 'epubcfi(/6/2!/4/2/4/8/2/2,/2/1:0,/4/1:10)'
        expect(merged?.toString()).toBe(expected)
    })
})