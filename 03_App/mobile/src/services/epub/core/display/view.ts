import { CFISelectionUtils, type CFISelector, CFISelectorDOM } from "../select/selector";
import * as CFIDisplayUtils from "./utils";
export { CFIDisplayUtils };


type Rect = CFIDisplayUtils.Rect;
type QueryMode = 'first' | 'last'

export class CFIView {
    constructor(document: Document, window: Window, selector?: CFISelector) {
        this._document = document;
        this._window = window;
        this._selector = selector ?? new CFISelectorDOM(document.body);
    }

    protected _document: Document;
    protected _window: Window;
    protected _selector: CFISelector;

    private _isRectValid(rect: Rect) {
        return rect.width > 0 && rect.height > 0;
    }

    private _isRectInView(rect: Rect, mode:'overlap' | 'contains') {
        const windowRect = this._windowRect();

        // ignore invisible elements
        if (!this._isRectValid(rect))
            return false;

        return mode === 'overlap' ? 
            CFIDisplayUtils.rectsOverlap(windowRect, rect) :
            CFIDisplayUtils.rectContains(windowRect, rect)
    }

    protected _preprocessRect(rect: Rect) : Rect {
        return rect
    }

    private _rectFromNode(node: Node) : Rect {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const rect = (node as HTMLElement).getBoundingClientRect();
            return this._preprocessRect(rect);
        }
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node as Text;
            const range = this._document.createRange();
            range.selectNode(text);
            const rect = range.getBoundingClientRect();
            return this._preprocessRect(rect);
        }
        return CFIDisplayUtils.NULL_RECT;
    }

    private _getTextChild(node: Node) : Text | null {
        if (node.nodeType === Node.TEXT_NODE)
            return node as Text;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const children = Array.from(node.childNodes);
            for (const child of children) {
                const text = this._getTextChild(child);
                if (text) return text;
            }
        }
        return null;
    }

    private _windowRect() : Rect {
        const width = this._window.innerWidth;
        const height = this._window.innerHeight;
        return {
            x: 0,
            y: 0,
            width,
            height
        }
    }

    get document() {
        return this._document;
    }

    *iterWords(textNode: Node) {
        const text = textNode.textContent;
        const words = text?.split(' ') ?? [];
        let start = 0, end = 0
        for (const word of words) {
            end = start + word.length;
            const range = this._document.createRange();
            range.setStart(textNode, start);
            range.setEnd(textNode, end);
            yield range;
            start = end + 1;
        }
    }

    addressForClientPoint(point:{x: number, y: number}, focusNode?: Node)  {
        const root = focusNode ?? this._document.body;
        const leaves = CFISelectionUtils.getAllLeafNodes(root);
        for (const leaf of leaves) {
            const textNode = this._getTextChild(leaf);
            if (!textNode)
                continue;
            const words = this.iterWords(textNode);
            let word: IteratorResult<Range, void>;
            while (!(word = words.next()).done) {
                const range = word.value;
                const rect = this._preprocessRect(range.getBoundingClientRect());
                
                if (CFIDisplayUtils.rectContainsPoint(rect, point)) {
                    return this._selector.addressFromNode(leaf);
                }
            }
        }
    }

    addressRangeForClientPoint(point:{x: number, y: number}, focusNode?: Node) : [CFISelectionUtils.FullAddress, CFISelectionUtils.FullAddress] | null {
        const root = focusNode ?? this._document.body;
        const leaves = CFISelectionUtils.getAllLeafNodes(root);
        for (const leaf of leaves) {
            const textNode = this._getTextChild(leaf);
            if (!textNode)
                continue;
            const words = this.iterWords(textNode);
            let word: IteratorResult<Range, void>;
            while (!(word = words.next()).done) {
                const range = word.value;
                const rect = this._preprocessRect(range.getBoundingClientRect());
                
                if (CFIDisplayUtils.rectContainsPoint(rect, point)) {
                    const nodeAddr = this._selector.addressFromNode(leaf);
                    const startAddr : CFISelectionUtils.FullAddress = [...nodeAddr, CFISelectionUtils.makeOffset(range.startOffset)];
                    const endAddr : CFISelectionUtils.FullAddress = [...nodeAddr, CFISelectionUtils.makeOffset(range.endOffset)];
                    return [startAddr, endAddr];
                }
            }
        }
        return null;
    }

    inViewTextOffset(textNode: Node, mode:QueryMode) {
        const words = this.iterWords(textNode);
        let word: IteratorResult<Range, void>;
        while (!(word = words.next()).done) {
            const range = word.value;
            const rect = this._preprocessRect(range.getBoundingClientRect());
            const isInView = this._isRectInView(rect, 'contains')
            const done = mode === 'first' ? isInView : !isInView;
            if (done) {
                return range.startOffset;
            }
        }
        return null;
    }

    inViewLeafNodes() {
        const body = this._document.body;
        const leaves = CFISelectionUtils.getAllLeafNodes(body);
        return leaves.filter(leaf => this._isRectInView(this._rectFromNode(leaf), 'overlap'));
    }

    inViewAddresses() : [CFISelectionUtils.FullAddress, CFISelectionUtils.FullAddress] | null {
        const leaves = 
            this.inViewLeafNodes()
                .filter(leaf => this._isRectValid(this._rectFromNode(leaf)))
                .sort((a, b) => {
                    const aRect = this._rectFromNode(a);
                    const bRect = this._rectFromNode(b);
                    return aRect.y - bRect.y;
                });
        if (leaves.length === 0)
            return null;

        const startLeaf = leaves[0];
        const endLeaf = leaves[leaves.length - 1];
        if (!startLeaf || !endLeaf)
            return null;

        const startAddr : CFISelectionUtils.FullAddress = this._selector.addressFromNode(startLeaf);
        const endAddr : CFISelectionUtils.FullAddress = this._selector.addressFromNode(endLeaf);

        const startText = this._getTextChild(startLeaf);
        const endText = this._getTextChild(endLeaf);  

        const startOffset = startText ? this.inViewTextOffset(startText, 'first') : null;
        if (startOffset !== null)
            startAddr.push(CFISelectionUtils.makeOffset(startOffset));
        const endOffset = endText ? this.inViewTextOffset(endText, 'last') : null;
        if (endOffset !== null)
            endAddr.push(CFISelectionUtils.makeOffset(endOffset));

        return [startAddr, endAddr];
    }

    rangeFromAddresses(start: CFISelectionUtils.FullAddress, end: CFISelectionUtils.FullAddress) : Range | null {
        const startNode = this._selector.nodeFromAddress(CFISelectionUtils.toNodeAddress(start));
        const endNode = this._selector.nodeFromAddress(CFISelectionUtils.toNodeAddress(end));

        if (!startNode || !endNode)
            return null;

        const offsetStart = CFISelectionUtils.getOffset(start);
        const offsetEnd = CFISelectionUtils.getOffset(end);

        const range = this._document.createRange();
        try {
            range.setStart(startNode, offsetStart ?? 0);
            range.setEnd(endNode, offsetEnd ?? 1);
            return range;
        } catch (e) {
            console.error('Error getting range for addresses', e);
        }
        return null;
    }

    rectsForRange(start: CFISelectionUtils.FullAddress, end: CFISelectionUtils.FullAddress) : Rect[] {
        const range = this.rangeFromAddresses(start, end);
        if (!range)
            return [];

        const rects = range.getClientRects();
        const rectsArray = Array.from(rects).map(rect => this._preprocessRect(rect));
        return rectsArray
            .map(rect => {
                return {
                    width: rect.width,
                    height: rect.height,
                    x: rect.x + this._window.scrollX,
                    y: rect.y + this._window.scrollY
                }
            });
    }

    /**
     * Document-space rect for a single address (e.g. a saved position). A collapsed DOM range
     * can report no client rects (notably in WebKit), so a text position is measured as the
     * one character beside it, and an element as its own box.
     */
    rectForAddress(address: CFISelectionUtils.FullAddress) : Rect | null {
        const node = this._selector.nodeFromAddress(CFISelectionUtils.toNodeAddress(address));
        if (!node)
            return null;
        if (node.nodeType === Node.TEXT_NODE) {
            const length = node.textContent?.length ?? 0;
            if (length > 0) {
                const offset = Math.min(Math.max(CFISelectionUtils.getOffset(address) ?? 0, 0), length);
                const start = offset < length ? offset : length - 1;
                const range = this._document.createRange();
                range.setStart(node, start);
                range.setEnd(node, start + 1);
                const rects = Array.from(range.getClientRects())
                    .map(rect => this._preprocessRect(rect))
                    .filter(rect => rect.width > 0 || rect.height > 0);
                const first = rects[0];
                if (first) {
                    return { x: first.x + this._window.scrollX, y: first.y + this._window.scrollY, width: first.width, height: first.height };
                }
            }
        }
        const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
        if (!element)
            return null;
        const box = this._preprocessRect(element.getBoundingClientRect());
        return { x: box.x + this._window.scrollX, y: box.y + this._window.scrollY, width: box.width, height: box.height };
    }

    boundingRectForRange(start: CFISelectionUtils.FullAddress, end: CFISelectionUtils.FullAddress) : Rect | null {
        // We could just call range.getBoundingClientRect(),
        // but that does not account for preprocessing from _preprocessRect()
        const rects = this.rectsForRange(start, end);
        if (rects.length === 0)
            return null;
        return CFIDisplayUtils.getBounds(...rects);
    }

    setDocumentSelection(start: CFISelectionUtils.FullAddress, end: CFISelectionUtils.FullAddress) {
        const range = this.rangeFromAddresses(start, end);
        if (!range)
            return;
        const selection = this._document.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    }
}

export class CFIViewLineHeight extends CFIView {
    constructor(...args: ConstructorParameters<typeof CFIView>) {
        super(...args);
        this._refreshLineHeight();
        // this._addStyleObserver();
    }
    private _lineHeight: number | null = null;
    private _refreshLineHeight() {
        const p0 = this._document.querySelector('p')
        if (!p0)
            return null;
        const found = parseFloat(this._window.getComputedStyle(p0).getPropertyValue('line-height'));
        if (isNaN(found) || found <= 0)
            return null;
        this._lineHeight = found;
        return this._lineHeight;
    }
    // private _addStyleObserver() {
    //     const observer = new MutationObserver((mutations) => {
    //         for (const mutation of mutations) {
    //             if (
    //                 mutation.type === 'attributes' &&
    //                 mutation.attributeName === 'style' &&
    //                 mutation.target instanceof HTMLElement &&
    //                 mutation.target.tagName.toLowerCase() === 'p'
    //             ) {
    //                 this._refreshLineHeight();
    //                 break;
    //             }
    //         }
    //     });
    //     observer.observe(this._document.body, { attributes: true, attributeFilter: ['style'], subtree: true });
    // }
    protected override _preprocessRect(rect: Rect) : Rect {
        if (rect.width === 0 && rect.height === 0)
            return rect;
        this._refreshLineHeight();
        const lineHeight = this._lineHeight
        if (lineHeight === null)
            return rect;
        const {width, x, y} = rect;
        const result = {height: lineHeight, width, x, y}
        return result
    }
}
