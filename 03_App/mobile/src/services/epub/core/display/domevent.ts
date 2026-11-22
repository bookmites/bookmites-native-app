export type DragHandlerCallback<P = void> = (
    mode: 'start' | 'move' |  'end', 
    point: {x: number, y: number}, 
    diff: {x: number, y: number},
    element: HTMLElement
) => P;
export interface DragHandlerOptions {
    startFilter? : (e: MouseEvent | TouchEvent | PointerEvent) => boolean;
}

export class DragHandler<P = void> {
    private _callback?: DragHandlerCallback<P>;
    private _startPoint: {x: number, y: number} | undefined;
    private _sessionParams: P | undefined;

    constructor(private _document: Document, private _options: DragHandlerOptions = {}) {}

    onDrag(callback: DragHandlerCallback<P>) {
        this._callback = callback;
    }

    private _pointFromEvent(e: MouseEvent) {
        return {x: e.clientX, y: e.clientY};
    }

    private _pointFromTouchEvent(e: TouchEvent) {
        const t = e.touches[0] ?? e.changedTouches[0];
        if (!t)
            return null;
        return {x: t.clientX, y: t.clientY};
    }

    private _handleDown(point: {x: number, y: number}, target: HTMLElement) {
        this._startPoint = point;
        const params = this._callback?.('start', point, {x: 0, y: 0}, target);
        if (params)
            this._sessionParams = params;
    }

    private _handleMove(point: {x: number, y: number}, target: HTMLElement) {
        if (!this._startPoint)
            return;
        const diff = {x: point.x - this._startPoint.x, y: point.y - this._startPoint.y};
        const params = this._callback?.('move', point, diff, target);
        if (params)
            this._sessionParams = params;
    }

    private _handleUp(point: {x: number, y: number}, target: HTMLElement) {
        if (!this._startPoint)
            return;
        const diff = {x: point.x - this._startPoint.x, y: point.y - this._startPoint.y};
        this._callback?.('end', point, diff, target);
        this._startPoint = undefined;
    }
    
    private _handleMouseDown = (e: MouseEvent) => {
        if (this._options.startFilter && !this._options.startFilter(e))
            return;
        const point = this._pointFromEvent(e);
        this._handleDown(point, e.target as HTMLElement);
    }

    private _handleMouseMove = (e: MouseEvent) => {
        const point = this._pointFromEvent(e);
        this._handleMove(point, e.target as HTMLElement);
    }

    private _handleMouseUp = (e: MouseEvent) => {
        const point = this._pointFromEvent(e);
        this._handleUp(point, e.target as HTMLElement);
    }

    private _handleTouchStart = (e: TouchEvent) => {
        if (this._options.startFilter && !this._options.startFilter(e))
            return;
        const point = this._pointFromTouchEvent(e);
        if (!point)
            return;
        this._handleDown(point, e.target as HTMLElement);
    }

    private _handleTouchMove = (e: TouchEvent) => {
        if (this._startPoint)
            e.preventDefault();
        const point = this._pointFromTouchEvent(e);
        if (!point)
            return;
        this._handleMove(point, e.target as HTMLElement);
    }

    private _handleTouchEnd = (e: TouchEvent) => {
        if (!this._startPoint)
            return;
        this._handleUp(this._startPoint, e.target as HTMLElement);
    }

    get sessionParams() {
        return this._sessionParams;
    }

    setup() {
        this._document.addEventListener('mousedown', this._handleMouseDown);
        this._document.addEventListener('mousemove', this._handleMouseMove);
        this._document.addEventListener('mouseup', this._handleMouseUp);
        this._document.addEventListener('touchstart', this._handleTouchStart);
        this._document.addEventListener('touchmove', this._handleTouchMove, {passive: false});
        this._document.addEventListener('touchend', this._handleTouchEnd);
    }

    destroy() {
        this._document.removeEventListener('mousedown', this._handleMouseDown);
        this._document.removeEventListener('mousemove', this._handleMouseMove);
        this._document.removeEventListener('mouseup', this._handleMouseUp);
        this._document.removeEventListener('touchstart', this._handleTouchStart);
        this._document.removeEventListener('touchmove', this._handleTouchMove);
        this._document.removeEventListener('touchend', this._handleTouchEnd);
    }
}


export type LongPressCallback = (point: {x: number, y: number}, element: HTMLElement) => void;
export interface LongPressHandlerOptions {
    startFilter? : (e: MouseEvent | TouchEvent | PointerEvent) => boolean;
    durationMs?: number;
    moveTolerancePx?: number;
}

export class LongPressHandler {
    private _callback?: LongPressCallback;
    private _timer: number | null = null;
    private _startPoint: {x: number, y: number} | undefined;
    private _lastPoint: {x: number, y: number} | undefined;
    private _target: HTMLElement | undefined;
    private _fired = false;
    private _suppressNextClick = false;

    constructor(private _document: Document, private _options: LongPressHandlerOptions = {}) {}

    onLongPress(callback: LongPressCallback) {
        this._callback = callback;
    }

    private _pointFromMouseEvent(e: MouseEvent) {
        return {x: e.clientX, y: e.clientY};
    }

    private _pointFromTouchEvent(e: TouchEvent) {
        const t = e.touches[0] ?? e.changedTouches[0];
        if (!t)
            return null;
        return {x: t.clientX, y: t.clientY};
    }

    private _startTimer(point: {x: number, y: number}, target: HTMLElement) {
        const duration = this._options.durationMs ?? 500;
        this._clearTimer();
        this._fired = false;
        this._timer = (this._document.defaultView as Window).setTimeout(() => {
            this._timer = null;
            this._fired = true;
            try {
                this._callback?.(this._lastPoint ?? point, target);
                // Prevent the immediate click that often follows a long press
                this._suppressNextClick = true;
            } catch {
                console.error('Error in long press callback');
            }
        }, duration) as unknown as number;
    }

    private _clearTimer() {
        if (this._timer != null) {
            try { (this._document.defaultView as Window).clearTimeout(this._timer); } catch {
                console.error('Error clearing long press timer');
            }
        }
        this._timer = null;
    }

    private _cancel() {
        this._clearTimer();
        this._startPoint = undefined;
        this._lastPoint = undefined;
        this._target = undefined;
        this._fired = false;
    }

    private _movedTooFar(p: {x: number, y: number}) {
        if (!this._startPoint)
            return false;
        const tol = this._options.moveTolerancePx ?? 10;
        const dx = p.x - this._startPoint.x;
        const dy = p.y - this._startPoint.y;
        return (dx*dx + dy*dy) > (tol*tol);
    }

    private _handleMouseDown = (e: MouseEvent) => {
        if (this._options.startFilter && !this._options.startFilter(e))
            return;
        this._startPoint = this._pointFromMouseEvent(e);
        this._lastPoint = this._startPoint;
        this._target = e.target as HTMLElement;
        this._startTimer(this._startPoint, this._target);
    }

    private _handleMouseMove = (e: MouseEvent) => {
        if (!this._startPoint)
            return;
        const p = this._pointFromMouseEvent(e);
        this._lastPoint = p;
        if (this._movedTooFar(p))
            this._cancel();
    }

    private _handleMouseUp = (_e: MouseEvent) => {
        this._cancel();
    }

    private _handleTouchStart = (e: TouchEvent) => {
        if (this._options.startFilter && !this._options.startFilter(e))
            return;
        const p = this._pointFromTouchEvent(e);
        if (!p)
            return;
        this._startPoint = p;
        this._lastPoint = p;
        this._target = e.target as HTMLElement;
        this._startTimer(p, this._target);
    }

    private _handleTouchMove = (e: TouchEvent) => {
        if (!this._startPoint)
            return;
        const p = this._pointFromTouchEvent(e);
        if (!p)
            return;
        this._lastPoint = p;
        if (this._movedTooFar(p))
            this._cancel();
    }

    private _handleTouchEnd = (_e: TouchEvent) => {
        this._cancel();
    }

    private _handleClickCapture = (e: MouseEvent) => {
        if (!this._suppressNextClick)
            return;
        this._suppressNextClick = false;
        try {
            if (e.cancelable) e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
        } catch {
            console.error('Error in click capture');
        }
    }

    setup() {
        this._document.addEventListener('mousedown', this._handleMouseDown);
        this._document.addEventListener('mousemove', this._handleMouseMove);
        this._document.addEventListener('mouseup', this._handleMouseUp);
        this._document.addEventListener('touchstart', this._handleTouchStart, {passive: true});
        this._document.addEventListener('touchmove', this._handleTouchMove, {passive: true});
        this._document.addEventListener('touchend', this._handleTouchEnd);
        this._document.addEventListener('click', this._handleClickCapture, {capture: true});
    }

    destroy() {
        this._document.removeEventListener('mousedown', this._handleMouseDown);
        this._document.removeEventListener('mousemove', this._handleMouseMove);
        this._document.removeEventListener('mouseup', this._handleMouseUp);
        this._document.removeEventListener('touchstart', this._handleTouchStart);
        this._document.removeEventListener('touchmove', this._handleTouchMove);
        this._document.removeEventListener('touchend', this._handleTouchEnd);
        this._document.removeEventListener('click', this._handleClickCapture, {capture: true});
        this._cancel();
    }
}


export type ShortPressCallback = (point: {x: number, y: number}, element: HTMLElement) => void;
export interface ShortPressHandlerOptions {
    startFilter? : (e: MouseEvent | TouchEvent | PointerEvent) => boolean;
    maxDurationMs?: number;
    moveTolerancePx?: number;
}

export class ShortPressHandler {
    private _callback?: ShortPressCallback;
    private _startPoint: {x: number, y: number} | undefined;
    private _lastPoint: {x: number, y: number} | undefined;
    private _target: HTMLElement | undefined;
    private _downTimeMs: number | null = null;
    private _movedBeyondTolerance = false;

    constructor(private _document: Document, private _options: ShortPressHandlerOptions = {}) {}

    onShortPress(callback: ShortPressCallback) {
        this._callback = callback;
    }

    private _pointFromMouseEvent(e: MouseEvent) {
        return {x: e.clientX, y: e.clientY};
    }

    private _pointFromTouchEvent(e: TouchEvent) {
        const t = e.touches[0] ?? e.changedTouches[0];
        if (!t)
            return null;
        return {x: t.clientX, y: t.clientY};
    }

    private _movedTooFar(p: {x: number, y: number}) {
        if (!this._startPoint)
            return false;
        const tol = this._options.moveTolerancePx ?? 10;
        const dx = p.x - this._startPoint.x;
        const dy = p.y - this._startPoint.y;
        return (dx*dx + dy*dy) > (tol*tol);
    }

    private _reset() {
        this._startPoint = undefined;
        this._lastPoint = undefined;
        this._target = undefined;
        this._downTimeMs = null;
        this._movedBeyondTolerance = false;
    }

    private _handleMouseDown = (e: MouseEvent) => {
        if (this._options.startFilter && !this._options.startFilter(e))
            return;
        const p = this._pointFromMouseEvent(e);
        this._startPoint = p;
        this._lastPoint = p;
        this._target = e.target as HTMLElement;
        this._downTimeMs = Date.now();
        this._movedBeyondTolerance = false;
    }

    private _handleMouseMove = (e: MouseEvent) => {
        if (!this._startPoint)
            return;
        const p = this._pointFromMouseEvent(e);
        this._lastPoint = p;
        if (this._movedTooFar(p))
            this._movedBeyondTolerance = true;
    }

    private _handleMouseUp = (_e: MouseEvent) => {
        if (this._downTimeMs == null)
            return;
        const maxDuration = this._options.maxDurationMs ?? 250;
        const elapsed = Date.now() - this._downTimeMs;
        if (!this._movedBeyondTolerance && elapsed <= maxDuration && this._target) {
            try {
                this._callback?.(this._lastPoint ?? this._startPoint as {x: number, y: number}, this._target);
            } catch {
                console.error('Error in short press callback');
            }
        }
        this._reset();
    }

    private _handleTouchStart = (e: TouchEvent) => {
        if (this._options.startFilter && !this._options.startFilter(e))
            return;
        const p = this._pointFromTouchEvent(e);
        if (!p)
            return;
        this._startPoint = p;
        this._lastPoint = p;
        this._target = e.target as HTMLElement;
        this._downTimeMs = Date.now();
        this._movedBeyondTolerance = false;
    }

    private _handleTouchMove = (e: TouchEvent) => {
        if (!this._startPoint)
            return;
        const p = this._pointFromTouchEvent(e);
        if (!p)
            return;
        this._lastPoint = p;
        if (this._movedTooFar(p))
            this._movedBeyondTolerance = true;
    }

    private _handleTouchEnd = (_e: TouchEvent) => {
        if (this._downTimeMs == null)
            return;
        const maxDuration = this._options.maxDurationMs ?? 250;
        const elapsed = Date.now() - this._downTimeMs;
        if (!this._movedBeyondTolerance && elapsed <= maxDuration && this._target) {
            try {
                this._callback?.(this._lastPoint ?? this._startPoint as {x: number, y: number}, this._target);
            } catch {
                console.error('Error in short press callback');
            }
        }
        this._reset();
    }

    setup() {
        this._document.addEventListener('mousedown', this._handleMouseDown);
        this._document.addEventListener('mousemove', this._handleMouseMove);
        this._document.addEventListener('mouseup', this._handleMouseUp);
        this._document.addEventListener('touchstart', this._handleTouchStart, {passive: true});
        this._document.addEventListener('touchmove', this._handleTouchMove, {passive: true});
        this._document.addEventListener('touchend', this._handleTouchEnd);
    }

    destroy() {
        this._document.removeEventListener('mousedown', this._handleMouseDown);
        this._document.removeEventListener('mousemove', this._handleMouseMove);
        this._document.removeEventListener('mouseup', this._handleMouseUp);
        this._document.removeEventListener('touchstart', this._handleTouchStart);
        this._document.removeEventListener('touchmove', this._handleTouchMove);
        this._document.removeEventListener('touchend', this._handleTouchEnd);
        this._reset();
    }
}
