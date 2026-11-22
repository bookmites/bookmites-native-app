export const isDefined = <T>(value: T): value is Defined<T> =>
    value !== undefined && value !== null;

export type Defined<T> = T extends undefined | null ? never : T;

export type NonZeroDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Digit = 0 | NonZeroDigit;

