export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Rect extends Point, Size {}

export interface PlacementRequest {
    target : Rect;
    subject : Size;
}

export interface PlacementProvider {
    place(request: PlacementRequest) : Point;
}

/**
 * Attracts the subject to the target within the specified "bounds" regions.
 * 
 * The bounds are a list of rectangles that are valid placement regions for the subject.
 * The subject will be placed as close as possible to the target, but always remaining within the bounds.
 * The distance is measured from the midpoint of the subject to the midpoint of the target,
 * and the distance is considered the cost for the optimization.
 */
export class BoundedAttractionPlacementProvider implements PlacementProvider {
    constructor(protected _bounds: Rect[]) {}
    setBounds(bounds: Rect[]) {
        this._bounds = bounds;
    }
    place(request: PlacementRequest) : Point {
        const { target, subject } = request;
        
        // Calculate target midpoint
        const targetMidX = target.x + target.width / 2;
        const targetMidY = target.y + target.height / 2;
        
        let bestPlacement: Rect | null = null;
        let minDistance = Infinity;
        
        // Try each bound to find the best placement
        for (const bound of this._bounds) {
            // Calculate the valid placement region within this bound
            // The subject must be entirely contained within the bound
            const minX = bound.x;
            const maxX = bound.x + bound.width - subject.width;
            const minY = bound.y;
            const maxY = bound.y + bound.height - subject.height;
            
            // Skip if subject is too large to fit in this bound
            if (maxX < minX || maxY < minY) {
                continue;
            }
            
            // Calculate ideal position (aligning midpoints)
            const idealX = targetMidX - subject.width / 2;
            const idealY = targetMidY - subject.height / 2;
            
            // Clamp to valid region within bounds
            const placedX = Math.max(minX, Math.min(maxX, idealX));
            const placedY = Math.max(minY, Math.min(maxY, idealY));
            
            // Calculate the midpoint of the placed subject
            const placedMidX = placedX + subject.width / 2;
            const placedMidY = placedY + subject.height / 2;
            
            // Calculate distance between midpoints
            const dx = placedMidX - targetMidX;
            const dy = placedMidY - targetMidY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Keep track of the best placement
            if (distance < minDistance) {
                minDistance = distance;
                bestPlacement = {
                    x: placedX,
                    y: placedY,
                    width: subject.width,
                    height: subject.height
                };
            }
        }
        
        // If no valid placement found (subject doesn't fit in any bounds),
        // return the subject at its original position or the first bound's top-left
        if (bestPlacement === null) {
            const firstBound = this._bounds[0];
            return {
                x: firstBound ? firstBound.x : 0,
                y: firstBound ? firstBound.y : 0,
            };
        }
        
        return bestPlacement;
    }
}
