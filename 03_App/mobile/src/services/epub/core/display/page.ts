import { FullAddress } from "../select/utils";
import { CFIAddrTransformer } from "../select/transform";
import { CFIView } from "./view";

export interface EpubPaginationConfig {
    /** Columns per page. Omit for continuous scroll over the whole spine document. */
    cols?: 'single' | 'double'
    /** Horizontal padding inside the viewport, in CSS pixels. Defaults to 30. */
    paddingX?: number
    /** Vertical padding inside the viewport, in CSS pixels. Defaults to 30. */
    paddingY?: number
}

export const DEFAULT_EPUB_PAGINATION_CONFIG: EpubPaginationConfig = {
    cols: 'single',
}

const STYLE_ID = '__epub-pagination-style__';
const COLUMN_GAP = 32;
const DEFAULT_PADDING = 30;

const IDENTITY_TRANSFORMER: CFIAddrTransformer = {
    apply: a => a,
    revert: a => a,
};

const paddingX = (config: EpubPaginationConfig) => config.paddingX ?? DEFAULT_PADDING;
const paddingY = (config: EpubPaginationConfig) => config.paddingY ?? DEFAULT_PADDING;

const writeStyle = (doc: Document, css: string) => {
    let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
        style = doc.createElement('style');
        style.id = STYLE_ID;
        (doc.head ?? doc.body).appendChild(style);
    }
    if (style.textContent !== css) {
        style.textContent = css;
    }
};

/**
 * Dropping the paginated `overflow: hidden` off the root leaves the document
 * scrollable to script and to the keyboard, but the frame's scroll node keeps its
 * old, unscrollable extent — the wheel and the trackpad do nothing and the gesture
 * chains out to the page instead. Detaching the body's layout box and re-attaching
 * it forces the frame to rebuild that scroll node.
 */
const forceScrollableViewport = (doc: Document) => {
    const win = doc.defaultView;
    if (!win) return;
    const body = doc.body;
    const top = win.scrollY;
    const prevDisplay = body.style.display;
    body.style.display = 'none';
    void body.offsetHeight;
    body.style.display = prevDisplay;
    win.scrollTo({ top });
};

/** Places a spine document inside the viewport — either paged columns or continuous scroll. */
export interface EpubLayoutManager {
    readonly config: EpubPaginationConfig
    readonly addrTransformer: CFIAddrTransformer
    setConfig(config: EpubPaginationConfig): void
    /** Re-apply the layout after a reflow (load, resize, style injection). */
    sync(): void
    /** Move forward within this document; false when there is nowhere left to go. */
    nextPage(): boolean
    /** Move back within this document; false when there is nowhere left to go. */
    prevPage(): boolean
    /** Bring the given address into view. */
    goToAddress(addr: FullAddress): void
    /** Move to the end of the document. */
    goToEnd(): void
    /** Take over a document the other layout mode was already displaying. */
    adopt(): void
    /** Drop anything this manager left on the document. */
    dispose(): void
}

export const isPaginated = (config: EpubPaginationConfig) => config.cols !== undefined;

export const createEpubLayoutManager = (view: CFIView, config: EpubPaginationConfig): EpubLayoutManager =>
    isPaginated(config)
        ? new EpubPaginationManager(view, config)
        : new EpubScrollManager(view, config);

export class EpubPaginationManager implements EpubLayoutManager {
    constructor(
        private readonly _view: CFIView,
        private _config: EpubPaginationConfig,
    ) {}

    private _pageCount = 0;
    private _pageIndex = 0;

    get pageCount() { return this._pageCount; }
    get pageIndex() { return this._pageIndex; }
    get config() { return this._config; }

    // CSS columns don't mutate the DOM, so addresses are stable.
    get addrTransformer(): CFIAddrTransformer {
        return IDENTITY_TRANSFORMER;
    }

    setConfig(config: EpubPaginationConfig) {
        this._config = config;
        this.sync();
    }

    // update the pagination display
    // called on first construction and on window resize
    sync() {
        const doc = this._view.document;
        const win = doc.defaultView;
        if (!win) return;

        this._injectStyle(doc, win);

        // Measure page count with the transform reset, then re-apply.
        const prevTransform = doc.body.style.transform;
        doc.body.style.transform = '';
        const stride = this._pageStride(win);
        // scrollWidth includes body padding on both sides; subtract it back out
        // and add a trailing gap so the last page rounds correctly.
        const innerExtent = doc.body.scrollWidth - 2 * paddingX(this._config);
        this._pageCount = Math.max(1, Math.ceil((innerExtent + COLUMN_GAP) / stride));
        doc.body.style.transform = prevTransform;

        this.goToPage(Math.min(this._pageIndex, this._pageCount - 1));
    }

    goToPage(index: number) {
        const doc = this._view.document;
        const win = doc.defaultView;
        if (!win) return;
        const clamped = Math.max(0, Math.min(index, this._pageCount - 1));
        this._pageIndex = clamped;
        doc.body.style.transform = `translateX(${-clamped * this._pageStride(win)}px)`;
    }

    goToAddress(addr: FullAddress) {
        this.goToPage(this.pageForAddress(addr));
    }

    goToEnd() {
        this.goToPage(this._pageCount - 1);
    }

    // Columns need nothing beyond the sync that follows: the layout is rebuilt from
    // the injected CSS either way, and a paged document never scrolls.
    adopt() {}

    dispose() {}

    private _pageStride(win: Window) {
        return win.innerWidth - 2 * paddingX(this._config) + COLUMN_GAP;
    }

    nextPage() {
        if (this._pageIndex >= this._pageCount - 1) return false;
        this.goToPage(this._pageIndex + 1);
        return true;
    }

    prevPage() {
        if (this._pageIndex <= 0) return false;
        this.goToPage(this._pageIndex - 1);
        return true;
    }

    /** Which page contains the given address. Returns 0 if not resolvable. */
    pageForAddress(addr: FullAddress): number {
        const win = this._view.document.defaultView;
        if (!win) return 0;
        const rect = this._view.rectForAddress(addr);
        if (!rect) return 0;
        // rect.x is post-transform viewport coords; add current page offset
        // back to get the layout-space x, then divide by the page stride.
        const stride = this._pageStride(win);
        const layoutX = rect.x + this._pageIndex * stride;
        return Math.max(0, Math.min(this._pageCount - 1, Math.floor(layoutX / stride)));
    }

    private _injectStyle(doc: Document, win: Window) {
        const cols = this._config.cols === 'double' ? 2 : 1;
        const viewportWidth = win.innerWidth;
        const viewportHeight = win.innerHeight;
        const padX = paddingX(this._config);
        const padY = paddingY(this._config);
        const columnWidth = (viewportWidth - 2 * padX - COLUMN_GAP * (cols - 1)) / cols;
        const contentHeight = viewportHeight - 2 * padY;

        const css = [
            'html {',
            '  margin: 0;',
            '  padding: 0;',
            `  height: ${viewportHeight}px;`,
            `  width: ${viewportWidth}px;`,
            '  overflow: hidden;',
            '}',
            'body {',
            '  margin: 0;',
            `  padding: ${padY}px ${padX}px;`,
            '  box-sizing: border-box;',
            `  height: ${viewportHeight}px;`,
            `  width: ${viewportWidth}px;`,
            '  overflow: visible;',
            `  column-width: ${columnWidth}px;`,
            `  column-gap: ${COLUMN_GAP}px;`,
            '  column-fill: auto;',
            '  will-change: transform;',
            '}',
            'img, svg, video, table {',
            '  max-width: 100%;',
            `  max-height: ${contentHeight}px;`,
            '  break-inside: avoid;',
            '}',
            'p, h1, h2, h3, h4, h5, h6, li, blockquote {',
            '  break-inside: avoid-column;',
            '}',
        ].join('\n');

        writeStyle(doc, css);
    }
}

/**
 * No pagination: the spine document is one continuously scrolling page, which is
 * how the reader behaved before paging existed. Moving past either end of the
 * document is left to the caller, which navigates the spine.
 */
export class EpubScrollManager implements EpubLayoutManager {
    constructor(
        private readonly _view: CFIView,
        private _config: EpubPaginationConfig,
    ) {}

    private _cancelRebuild: (() => void) | null = null;

    get config() { return this._config; }

    // Nothing here mutates the DOM, so addresses are stable.
    get addrTransformer(): CFIAddrTransformer {
        return IDENTITY_TRANSFORMER;
    }

    setConfig(config: EpubPaginationConfig) {
        this._config = config;
        this.sync();
    }

    sync() {
        const doc = this._view.document;
        // Undo the page offset in case we were paginated a moment ago.
        doc.body.style.transform = '';
        this._injectStyle(doc);
    }

    /**
     * A document handed over from paginated layout needs its scroll node rebuilt, but
     * the handover runs from the settings dialog, and a modal dialog makes the reader
     * inert: the rebuild is ignored while the dialog is up, and closing it does not
     * schedule another one. So arm the rebuild and run it on the reader's first
     * interaction, which by definition comes after it stopped being inert. A wheel
     * tick that arrives before the rebuild would be dropped, so replay it by hand.
     */
    adopt() {
        this.dispose();
        const doc = this._view.document;

        const rebuild = (event: Event) => {
            this.dispose();
            forceScrollableViewport(doc);
            if (event.type === 'wheel') {
                doc.defaultView?.scrollBy({ top: (event as WheelEvent).deltaY });
            }
        };

        // Hovering precedes every press, so `pointerover` covers the pointer without
        // a listener that could disturb the press that starts a text selection.
        const events = ['wheel', 'pointerover'] as const;
        for (const name of events) {
            doc.addEventListener(name, rebuild, { capture: true, passive: true });
        }
        this._cancelRebuild = () => {
            for (const name of events) {
                doc.removeEventListener(name, rebuild, { capture: true });
            }
            this._cancelRebuild = null;
        };
    }

    dispose() {
        this._cancelRebuild?.();
    }

    nextPage() { return false; }

    prevPage() { return false; }

    goToAddress(addr: FullAddress) {
        const doc = this._view.document;
        const win = doc.defaultView;
        if (!win) return;
        // Rects from the view are document-space (scroll offset already added in).
        const rect = this._view.rectForAddress(addr);
        if (!rect) return;
        win.scrollTo({ top: Math.max(0, rect.y - paddingY(this._config)) });
    }

    goToEnd() {
        const doc = this._view.document;
        const win = doc.defaultView;
        if (!win) return;
        win.scrollTo({ top: doc.documentElement.scrollHeight });
    }

    private _injectStyle(doc: Document) {
        // Replaces any paginated CSS wholesale — the document keeps its natural
        // height and the iframe scrolls it.
        const css = [
            'html {',
            '  margin: 0;',
            '  padding: 0;',
            '}',
            'body {',
            '  margin: 0;',
            `  padding: ${paddingY(this._config)}px ${paddingX(this._config)}px;`,
            '  box-sizing: border-box;',
            '}',
            'img, svg, video, table {',
            '  max-width: 100%;',
            '}',
        ].join('\n');

        writeStyle(doc, css);
    }
}
