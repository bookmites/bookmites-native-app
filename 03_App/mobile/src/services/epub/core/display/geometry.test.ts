import * as GeometryUtils from './geometry';

describe('GeometryUtils.mergeRects', () => {
    it('should merge overlapping rectangles into a single path', () => {
        const rect1: GeometryUtils.Rect = { x: 1, y: 1, width: 2, height: 2 };
        const rect2: GeometryUtils.Rect = { x: 2, y: 2, width: 2, height: 2 };
        
        const result = GeometryUtils.mergeRects([rect1, rect2]);
        
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 },
        ];

        const expected: GeometryUtils.Path[] = [path1];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });

    it('should merge contained rectangles into a single path by removing the inner rectangle', () => {
        const rect1: GeometryUtils.Rect = { x: 1, y: 1, width: 4, height: 4 };
        const rect2: GeometryUtils.Rect = { x: 2, y: 2, width: 1, height: 1 };
        
        const result = GeometryUtils.mergeRects([rect1, rect2]);
        
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 1, y: 5 },
            { x: 5, y: 5 },
            { x: 5, y: 1 },
            { x: 1, y: 1 }
        ];
        
        const expected: GeometryUtils.Path[] = [path1];

        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });

    it('should merge non-overlapping rectangles into multiple paths', () => {
        const rect1: GeometryUtils.Rect = { x: 2, y: 2, width: 1, height: 1 };
        const rect2: GeometryUtils.Rect = { x: 2, y: 4, width: 1, height: 1 };
        
        const result = GeometryUtils.mergeRects([rect1, rect2]);
        
        const path1: GeometryUtils.Path = [
            { x: 2, y: 2 },
            { x: 3, y: 2 },
            { x: 3, y: 3 },
            { x: 2, y: 3 },
            { x: 2, y: 2 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 2, y: 4 },
            { x: 3, y: 4 },
            { x: 3, y: 5 },
            { x: 2, y: 5 },
            { x: 2, y: 4 }
        ];
        
        const expected: GeometryUtils.Path[] = [path1, path2];

        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });

    it('should properly handle duplicate adjacent rectangles', () => {
        const rect1: GeometryUtils.Rect = { x: 1, y: 1, width: 2, height: 1 };
        const rect2: GeometryUtils.Rect = { x: 3, y: 1, width: 1, height: 1 };
        const rect3: GeometryUtils.Rect = { x: 3, y: 1, width: 1, height: 1 };
        const rect4: GeometryUtils.Rect = { x: 4, y: 1, width: 2, height: 1 };
        
        const result = GeometryUtils.mergeRects([rect1, rect2, rect3, rect4]);
        
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 6, y: 1 },
            { x: 6, y: 2 },
            { x: 1, y: 2 },
            { x: 1, y: 1 },
        ];

        const expected: GeometryUtils.Path[] = [path1];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });

});

describe('GeometryUtils.normalizePath', () => {
    it('should return empty path for empty input', () => {
        const path: GeometryUtils.Path = [];
        expect(GeometryUtils.normalizePath(path)).toEqual([]);
    });

    it('should normalize a simple rectangle path', () => {
        const path: GeometryUtils.Path = [
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 2 }
        ];
        
        const normalized = GeometryUtils.normalizePath(path);
        
        // Should start from smallest point (2, 2)
        expect(normalized[0]).toEqual({ x: 2, y: 2 });
        expect(normalized[normalized.length - 1]).toEqual({ x: 2, y: 2 });
        expect(normalized.length).toBe(5);
    });

    it('should normalize path starting from different point', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 },
            { x: 3, y: 1 }
        ];
        
        const norm1 = GeometryUtils.normalizePath(path1);
        const norm2 = GeometryUtils.normalizePath(path2);
        
        // Both should normalize to start from (1, 1)
        expect(norm1[0]).toEqual({ x: 1, y: 1 });
        expect(norm2[0]).toEqual({ x: 1, y: 1 });
        expect(norm1).toEqual(norm2);
    });

    it('should handle path without closing point', () => {
        const path: GeometryUtils.Path = [
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 }
        ];
        
        const normalized = GeometryUtils.normalizePath(path);
        
        // Should add closing point
        expect(normalized[0]).toEqual({ x: 2, y: 2 });
        expect(normalized[normalized.length - 1]).toEqual({ x: 2, y: 2 });
        expect(normalized.length).toBe(5);
    });

    it('should handle path with multiple points at same x coordinate', () => {
        const path: GeometryUtils.Path = [
            { x: 5, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 3 },
            { x: 5, y: 3 },
            { x: 5, y: 1 }
        ];
        
        const normalized = GeometryUtils.normalizePath(path);
        
        // Should start from (1, 1) - smallest lexicographically
        expect(normalized[0]).toEqual({ x: 1, y: 1 });
    });

    it('should handle path with multiple points at same y coordinate', () => {
        const path: GeometryUtils.Path = [
            { x: 3, y: 5 },
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 1, y: 5 },
            { x: 3, y: 5 }
        ];
        
        const normalized = GeometryUtils.normalizePath(path);
        
        // Should start from (1, 1) - smallest lexicographically
        expect(normalized[0]).toEqual({ x: 1, y: 1 });
    });

    it('should handle complex path with many points', () => {
        const path: GeometryUtils.Path = [
            { x: 5, y: 3 },
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 3 },
            { x: 1, y: 3 },
            { x: 5, y: 3 }
        ];
        
        const normalized = GeometryUtils.normalizePath(path);
        
        // Should start from (1, 1) - smallest lexicographically
        expect(normalized[0]).toEqual({ x: 1, y: 1 });
        expect(normalized[normalized.length - 1]).toEqual({ x: 1, y: 1 });
    });
});

describe('GeometryUtils.pathsEqual', () => {
    it('should return true for identical paths', () => {
        const path: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        expect(GeometryUtils.pathsEqual(path, path)).toBe(true);
    });

    it('should return true for paths with different starting points', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 },
            { x: 3, y: 1 }
        ];
        
        expect(GeometryUtils.pathsEqual(path1, path2)).toBe(true);
    });

    it('should return true for paths in reverse order', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 1, y: 3 },
            { x: 3, y: 3 },
            { x: 3, y: 1 },
            { x: 1, y: 1 }
        ];
        
        expect(GeometryUtils.pathsEqual(path1, path2)).toBe(true);
    });

    it('should return true for paths with different starting points and reverse order', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 }
        ];
        
        expect(GeometryUtils.pathsEqual(path1, path2)).toBe(true);
    });

    it('should return false for different paths', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 4, y: 1 },
            { x: 4, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        expect(GeometryUtils.pathsEqual(path1, path2)).toBe(false);
    });

    it('should return false for paths with different number of points', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 2, y: 2 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        expect(GeometryUtils.pathsEqual(path1, path2)).toBe(false);
    });

    it('should return true for empty paths', () => {
        const path1: GeometryUtils.Path = [];
        const path2: GeometryUtils.Path = [];
        
        expect(GeometryUtils.pathsEqual(path1, path2)).toBe(true);
    });

    it('should handle paths without explicit closing point', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        expect(GeometryUtils.pathsEqual(path1, path2)).toBe(true);
    });

    it('should handle complex overlapping rectangle paths', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 }
        ];
        
        expect(GeometryUtils.pathsEqual(path1, path2)).toBe(true);
    });
});

describe('GeometryUtils.pathArraysEqual', () => {
    it('should return true for identical path arrays', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 2 }
        ];
        
        const result = [path1, path2];
        const expected = [path1, path2];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });

    it('should return true for path arrays in different order', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 2 }
        ];
        
        const result = [path1, path2];
        const expected = [path2, path1];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });

    it('should return true for path arrays with paths in different order', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 2 }
        ];
        
        // Path1 in result starts from different point
        const result = [
            [
                { x: 3, y: 1 },
                { x: 3, y: 3 },
                { x: 1, y: 3 },
                { x: 1, y: 1 },
                { x: 3, y: 1 }
            ],
            path2
        ];
        
        const expected = [path1, path2];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });

    it('should return false for arrays with different lengths', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const result = [path1];
        const expected = [path1, path1];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(false);
    });

    it('should return false for arrays with different paths', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 2 }
        ];
        
        const path3: GeometryUtils.Path = [
            { x: 5, y: 5 },
            { x: 7, y: 5 },
            { x: 7, y: 7 },
            { x: 5, y: 7 },
            { x: 5, y: 5 }
        ];
        
        const result = [path1, path2];
        const expected = [path1, path3];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(false);
    });

    it('should return true for empty arrays', () => {
        const result: GeometryUtils.Path[] = [];
        const expected: GeometryUtils.Path[] = [];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });

    it('should handle arrays with multiple paths in various orders', () => {
        const path1: GeometryUtils.Path = [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
            { x: 1, y: 1 }
        ];
        
        const path2: GeometryUtils.Path = [
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 4 },
            { x: 2, y: 4 },
            { x: 2, y: 2 }
        ];
        
        const path3: GeometryUtils.Path = [
            { x: 5, y: 5 },
            { x: 7, y: 5 },
            { x: 7, y: 7 },
            { x: 5, y: 7 },
            { x: 5, y: 5 }
        ];
        
        // All paths in different orders and rotations
        const result = [
            [
                { x: 3, y: 3 },
                { x: 1, y: 3 },
                { x: 1, y: 1 },
                { x: 3, y: 1 },
                { x: 3, y: 3 }
            ],
            [
                { x: 7, y: 7 },
                { x: 5, y: 7 },
                { x: 5, y: 5 },
                { x: 7, y: 5 },
                { x: 7, y: 7 }
            ],
            [
                { x: 4, y: 2 },
                { x: 4, y: 4 },
                { x: 2, y: 4 },
                { x: 2, y: 2 },
                { x: 4, y: 2 }
            ]
        ];
        
        const expected = [path1, path2, path3];
        
        expect(GeometryUtils.pathArraysEqual(result, expected)).toBe(true);
    });
});

