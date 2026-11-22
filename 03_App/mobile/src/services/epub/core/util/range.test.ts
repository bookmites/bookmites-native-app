import type { Compare, Range } from "./range";
import { RangeOperations } from "./range";

describe('RangeOperations', () => {

    const numCompare: Compare<number> = (a,b) => a - b;
    const numberline = new RangeOperations<number>(numCompare);

    it('should subtract a range from a range', () => {
        const a : Range<number> = [1, 3];
        const b : Range<number> = [2, 3];
        const aMinusB : Range<number>[] = [[1, 2]];
        expect(numberline.subtract(a, b)).toEqual(aMinusB);


        const c : Range<number> = [1, 2];
        const d : Range<number> = [2, 3];
        const cMinusD : Range<number>[] = [[1, 2]];
        expect(numberline.subtract(c, d)).toEqual(cMinusD);


        const e : Range<number> = [1, 4];
        const f : Range<number> = [2, 3];
        const eMinusF : Range<number>[] = [[1, 2], [3, 4]];
        expect(numberline.subtract(e, f)).toEqual(eMinusF);
    });
});