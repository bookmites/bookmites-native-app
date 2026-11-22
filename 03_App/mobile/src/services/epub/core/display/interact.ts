import type { Event } from "../util/listener";
import { EventListener } from "../util/listener";
import type { CFIDisplayUtils } from "./view";
import type { CFIView } from "./view";
import { DragHandler } from "./domevent";
import type { CFIHighlightsManager } from "./highlights";
import type { CFISelectionUtils } from "../select/selector";
import type { CFISelector } from "../select/selector";




type Address = CFISelectionUtils.FullAddress;
export type Selection = [Address, Address]

const VERSE_HIGHLIGHT_HANDLE_CLASS = '__verse_highlight_handle__';
export interface SelectionEvent extends Event {
    name: 'select';
    startAddr: Address;
    endAddr: Address;
    state : EventState;
}
export interface ClearEvent extends Event {
    name: 'clear';
}
type EventState = 'update' | 'done';
export type Place = 'start' | 'end';
export abstract class TextSelectionInteraction {
    protected _dragHandler: DragHandler;

    constructor(
        protected _selector: CFISelector,
        protected _view: CFIView,
        protected _highlightsManager: CFIHighlightsManager
    ) {
        this._dragHandler = new DragHandler(this._document, {
            startFilter: e => {
                return e.target instanceof HTMLElement && e.target.classList.contains(VERSE_HIGHLIGHT_HANDLE_CLASS);
            }
        });
    }

    protected _handleSize = 16;
    protected _handleTargetSize = 44;
    events = new EventListener<SelectionEvent | ClearEvent>();

    protected _selection : Selection | null = null;
    protected _newSelection : Selection | null = null;
    protected _dragPlace : Place | null = null;

    protected _startHandle : HTMLElement | null = null;
    protected _endHandle : HTMLElement | null = null;


    protected get _document() {
        return this._view.document;
    }

    get currentSelection() {
        return this._selection;
    }

    protected abstract _cursorAddressForLocation(place: Place, location: {x: number, y: number}) : Address | null;

    protected _mergedCursor(address: Address, place: Place) : Selection | null {
        if (!this._selection)
            return null

        if (place === 'start') {
            const [, selectionEnd] = this._selection;
            const cmp = this._selector.compareAddresses(address, selectionEnd)
            const isCursorAfterEnd = cmp !== null && cmp > 0;
            if (isCursorAfterEnd)
                return [selectionEnd, address];
            return [address, selectionEnd];
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (place === 'end') {
            const [selectionStart] = this._selection;
            const cmp = this._selector.compareAddresses(address, selectionStart)
            const isCursorBeforeStart = cmp !== null && cmp < 0;
            if (isCursorBeforeStart)
                return [address, selectionStart];
            return [selectionStart, address];
        }
        return null;
    }
    
    protected _handleDrag = (mode: 'start' | 'move' | 'end', point: {x: number, y: number}, diff: {x: number, y: number}, element: HTMLElement) => {
        
        if (mode === 'end') {
            this._commit();
            return
        }
        
        if (mode === 'start') {
            this._dragPlace = element.classList.contains(this._classNameForPlace('start')) ? 'start' : 'end';
            return;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (mode === 'move') {
            this._update(point);
        }
    }

    protected _classNameForPlace(place: Place) {
        return VERSE_HIGHLIGHT_HANDLE_CLASS+'_'+place;
    }

    protected _positionForHandle(rect: CFIDisplayUtils.Rect, place: Place) {
        return {
            left: (place === 'start' ? rect.x : rect.x + rect.width) - this._handleTargetSize/2,
            top: place === 'start' ? (rect.y - this._handleTargetSize/2 - this._handleSize/2) : rect.y + rect.height - this._handleTargetSize/2 + this._handleSize/2
        }
    }

    protected _buildHandleElement(rect: CFIDisplayUtils.Rect, place: Place) {
        const {top, left} = this._positionForHandle(rect, place);
        // Invisible parent: larger drag target, carries handle classes
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = `${String(left)}px`;
        wrapper.style.top = `${String(top)}px`;
        wrapper.style.width = `${String(this._handleTargetSize)}px`;
        wrapper.style.height = `${String(this._handleTargetSize)}px`;
        wrapper.style.backgroundColor = 'transparent';
        wrapper.style.zIndex = '1000';
        wrapper.style.cursor = 'move';
        wrapper.classList.add(VERSE_HIGHLIGHT_HANDLE_CLASS);
        wrapper.classList.add(this._classNameForPlace(place));

        // Visual handle: positioned at previous absolute coordinates relative to wrapper
        const handle = document.createElement('div');
        handle.style.position = 'absolute';
        handle.style.left = `${String(this._handleTargetSize/2 - this._handleSize/2)}px`;
        handle.style.top = `${String(this._handleTargetSize/2 - this._handleSize/2)}px`;
        handle.style.width = `${String(this._handleSize)}px`;
        handle.style.height = `${String(this._handleSize)}px`;
        handle.style.borderRadius = `50%`;
        // handle.style.backgroundColor = 'rgb(52, 109, 217)';
        handle.style.backgroundColor = 'rgb(134, 134, 134)';
        // Ensure drag starts on wrapper even when touching the visual handle
        handle.style.pointerEvents = 'none';

        wrapper.appendChild(handle);
        return wrapper;
    }

    protected _renderHandles(addrRange: [CFISelectionUtils.FullAddress, CFISelectionUtils.FullAddress]) {
        let [startAddr, endAddr] = addrRange;
        if (typeof startAddr[startAddr.length - 1] !== 'string')
            startAddr = [...startAddr, ':0'];
        if (typeof endAddr[endAddr.length - 1] !== 'string')
            endAddr = [...endAddr, ':0'];
        const rects = this._view.rectsForRange(startAddr, endAddr);
        const firstRect = rects[0];
        const lastRect = rects[rects.length - 1];
        if (!firstRect || !lastRect)
            return;
        
        if (this._startHandle) {
            const {left, top} = this._positionForHandle(firstRect, 'start');
            this._startHandle.style.left = `${String(left)}px`;
            this._startHandle.style.top = `${String(top)}px`;
        } else {
            this._startHandle = this._buildHandleElement(firstRect, 'start');
            this._document.body.appendChild(this._startHandle);
        }
        if (this._endHandle) {
            const {left, top} = this._positionForHandle(lastRect, 'end');
            this._endHandle.style.left = `${String(left)}px`;
            this._endHandle.style.top = `${String(top)}px`;
        } else {
            this._endHandle = this._buildHandleElement(lastRect, 'end');
            this._document.body.appendChild(this._endHandle);
        }
    }

    protected _clearHandles() {
        const handles = Array.from(this._document.querySelectorAll(`.${VERSE_HIGHLIGHT_HANDLE_CLASS}`));
        for (const handle of handles) {
            try { 
                (handle as HTMLElement).remove();
            } catch {
                console.warn('Error removing handle', handle);
            }
        }
        this._startHandle = null;
        this._endHandle = null;
    }


    protected _renderHighlights() {
        this._highlightsManager.removeRegistered();
        if (!this._selection) {
            this._clearHandles();
            return;
        }
        this._highlightsManager.add({
            id: 'selection',
            startAddr: this._selection[0],
            endAddr: this._selection[1],
            // color: 'rgba(52, 109, 217, 0.4)',
            color: 'rgba(170, 170, 170, 0.3)'
        });
        if (!this._newSelection) {
            this._renderHandles(this._selection);
            return ;
        }
        this._highlightsManager.add({
            id: 'newSelection',
            startAddr: this._newSelection[0],
            endAddr: this._newSelection[1],
            // color: 'rgba(77, 237, 194, 0.4)',
            color: 'rgba(181, 181, 181, 0.32)',
        });
        this._renderHandles(this._newSelection);
    }

    protected _update(point: {x: number, y: number}) {
        if (!this._dragPlace)
            return
        const address = this._cursorAddressForLocation(this._dragPlace, point);
        if (!address)
            return
        this._newSelection = this._mergedCursor(address, this._dragPlace);
        this._sync({state: 'update'});
    }

    protected _commit() {
        this._selection = this._newSelection;
        this._newSelection = null;
        this._sync({state: 'done'});
    }

    protected _sync({state}: {state: EventState}) {
        this._renderHighlights();
        const selection = this._newSelection ?? this._selection;
        if (!selection) {
            this.events.publish({
                name: 'clear',
            });
            return;
        }
        this.events.publish({
            name: 'select',
            startAddr: selection[0],
            endAddr: selection[1],
            state,
        });
    }

    protected _initSelection(selection: Selection) {
        this._selection = selection;
        this._newSelection = null;
        this._sync({state: 'update'});
    }

    protected _clearSelection(sendEvent = true) {
        this._selection = null;
        this._newSelection = null;
        if (sendEvent) {
            this._sync({state: 'done'});
        } else {
            this._renderHighlights();
        }
    }

    setup() {
        this._dragHandler.onDrag(this._handleDrag);
        this._dragHandler.setup();
        Array.from(this._document.querySelectorAll('p')).forEach((p) => {
            p.style.userSelect = 'none';
        });
    }

    destroy() {
        this._dragHandler.destroy();
    }
}


export class TextSelectionInteractionWord extends TextSelectionInteraction {
    protected _cursorAddressForLocation(place: Place, location: {x: number, y: number}) : Address | null {
        const addr = this._selectionForLocation(location);
        if (!addr)
            return null;
        if (place === 'start') {
            return addr[0];
        }
        return addr[1];
    }

    protected _handleClick = (e: MouseEvent) => {
        const point = {x: e.clientX, y: e.clientY};
        const addrRange = this._selectionForLocation(point);
        if (!addrRange)
            return;
        this._initSelection(addrRange);
    }

    protected _selectionForLocation(point: {x: number, y: number}) : Selection | null {
        return this._view.addressRangeForClientPoint(point);
    }

    override setup() {
        super.setup();
        this._document.addEventListener('click', this._handleClick);
    }

    override destroy() {
        this._document.removeEventListener('click', this._handleClick);
        super.destroy();
    }
    
    
}
