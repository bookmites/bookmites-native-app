export type Rect = Pick<DOMRect, 'x'|'y'|'width'|'height'>

export const NULL_RECT = { x: 0, y: 0, width: 0, height: 0 };

export const rectsOverlap = (rect1: Rect, rect2: Rect) => 
    // rect1 is to the left of rect2
    rect1.x < rect2.x + rect2.width &&
    // rect1 is to the right of rect2
    rect1.x + rect1.width > rect2.x &&
    // rect1 is above rect2
    rect1.y < rect2.y + rect2.height &&
    // rect1 is below rect2
    rect1.y + rect1.height > rect2.y

// inner is completely within container
export const rectContains = (container: Rect, inner: Rect) => 
    inner.x >= container.x &&
    inner.y >= container.y &&
    inner.x + inner.width <= container.x + container.width &&
    inner.y + inner.height <= container.y + container.height

export const rectContainsPoint = (rect: Rect, point: { x: number, y: number }) =>
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height

export const getBounds = (...rects: Rect[]) => {
    const minX = Math.min(...rects.map(r => r.x));
    const minY = Math.min(...rects.map(r => r.y));
    const maxX = Math.max(...rects.map(r => r.x + r.width));
    const maxY = Math.max(...rects.map(r => r.y + r.height));
    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}