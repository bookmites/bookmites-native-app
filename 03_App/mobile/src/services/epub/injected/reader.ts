/**
 * In-document reader: runs inside the WebView on one spine document.
 *
 * Adapted from the Bookmites web renderer (`EpubRendererRemote`), which drove an iframe from
 * its host page. Here the host is React Native, so the same responsibilities — layout,
 * restoring a position, reporting what is in view, native text selection, and painting
 * highlights — run inside the document and talk to the app over `postMessage`.
 */
import { CFIHighlightsManagerSVG } from '../core/display/highlights'
import { createEpubLayoutManager, type EpubLayoutManager } from '../core/display/page'
import { CFIView, CFIViewLineHeight } from '../core/display/view'
import { CFISelectorDOM, type CFISelectorOptions } from '../core/select/selector'
import type {
    AddressRange,
    InjectedHighlight,
    PreloadParams,
    ReaderCommand,
    ReaderMessage,
    ReaderTarget,
} from './protocol'

/** Elements we add to the document. Excluded from CFI traversal so addresses stay stable. */
export const INJECT_CLASS = '__bookmites-inject__'
const READER_STYLE_ID = '__bookmites-reader-style__'
const BASE_STYLE_ID = '__bookmites-base-style__'
const SELECT_GUARD_STYLE_ID = '__bookmites-select-guard__'
const VIEWPORT_META_ID = '__bookmites-viewport__'

const LOCATION_THROTTLE_MS = 200
const SELECTION_DEBOUNCE_MS = 60
const LAYOUT_SETTLE_TIMEOUT_MS = 1500
/** Quick tap to toggle reader chrome — tuned on device. */
const CONTENT_TAP_MAX_MOVE_PX = 10
const CONTENT_TAP_MAX_MS = 400

const BASE_CSS = `
.${INJECT_CLASS} {
  pointer-events: none !important;
  -webkit-user-select: none !important;
  user-select: none !important;
}
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
`

const isInjected = (node: Node): boolean => {
    const element = node.nodeType === 1 ? (node as Element) : node.parentElement
    return Boolean(element?.closest(`.${INJECT_CLASS}`))
}

/** CFIView that never reports our own overlay elements as content in view. */
class ReaderView extends CFIView {
    override inViewLeafNodes() {
        return super.inViewLeafNodes().filter(node => !isInjected(node))
    }
}

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => { resolve() }))

const whenLaidOut = (doc: Document, win: Window) => {
    const loaded = doc.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>(resolve => { win.addEventListener('load', () => { resolve() }, { once: true }) })
    const fonts = doc.fonts?.ready.then(() => undefined) ?? Promise.resolve()
    const timeout = new Promise<void>(resolve => setTimeout(resolve, LAYOUT_SETTLE_TIMEOUT_MS))
    return Promise.race([Promise.all([loaded, fonts]).then(() => undefined), timeout])
}

export class InDocumentReader {
    private readonly _doc: Document
    private readonly _win: Window
    private readonly _selector: CFISelectorDOM
    private readonly _view: ReaderView
    private readonly _highlights: CFIHighlightsManagerSVG
    private readonly _layout: EpubLayoutManager
    private _highlightParams: InjectedHighlight[]
    /** Kept until the user moves, so late reflows (images, fonts) re-apply the restore. */
    private _pendingTarget: ReaderTarget | null
    private _ready = false
    private _locationTimer: ReturnType<typeof setTimeout> | null = null
    private _selectionTimer: ReturnType<typeof setTimeout> | null = null
    /** Nav chrome: no highlight/select; taps return to read. */
    private _textSelectionEnabled = true

    constructor(
        private readonly _params: PreloadParams,
        private readonly _post: (message: ReaderMessage) => void,
    ) {
        this._doc = document
        this._win = window
        const options: CFISelectorOptions = { traversalFilter: node => !(node as Element).classList?.contains(INJECT_CLASS) }
        this._selector = new CFISelectorDOM(this._doc.body, options)
        this._view = new ReaderView(this._doc, this._win, this._selector)
        // Line-height rects give highlights an even band per line instead of glyph-hugging boxes.
        this._highlights = new CFIHighlightsManagerSVG(new CFIViewLineHeight(this._doc, this._win, this._selector))
        this._layout = createEpubLayoutManager(this._view, _params.layout)
        this._highlightParams = _params.highlights
        this._pendingTarget = _params.target
    }

    async start() {
        this._installHead()
        this._layout.sync()
        this._addListeners()

        await whenLaidOut(this._doc, this._win)
        await nextFrame()

        this._layout.sync()
        this._resolvePendingTarget()
        this._paintHighlights()
        this._ready = true
        this._post({ type: 'ready', spineIndex: this._params.spineIndex, visible: this._visibleRange() })
    }

    receive(command: ReaderCommand) {
        switch (command.type) {
            case 'style':
                void this._applyStyle(command.css)
                return
            case 'highlights':
                this._highlightParams = command.highlights
                this._paintHighlights()
                return
            case 'goTo':
                this._pendingTarget = command.target
                this._resolvePendingTarget()
                this._scheduleLocation(0)
                return
            case 'select':
                this._view.setDocumentSelection(command.range.start, command.range.end)
                return
            case 'clearSelection':
                this._win.getSelection()?.removeAllRanges()
                return
            case 'setTextSelectionEnabled':
                this._textSelectionEnabled = command.enabled
                this._applyTextSelectionGuard()
                return
        }
    }

    private _applyTextSelectionGuard() {
        if (!this._textSelectionEnabled) {
            this._writeStyle(
                SELECT_GUARD_STYLE_ID,
                `html, body, body * {
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
}`,
            )
            this._win.getSelection()?.removeAllRanges()
            return
        }
        const block = this._doc.getElementById(SELECT_GUARD_STYLE_ID)
        block?.remove()
    }

    // -- document setup ---------------------------------------------------------------

    private _installHead() {
        const head = this._doc.head ?? this._doc.documentElement
        if (!this._doc.getElementById(VIEWPORT_META_ID)) {
            const meta = this._doc.createElement('meta')
            meta.id = VIEWPORT_META_ID
            meta.setAttribute('name', 'viewport')
            meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
            head.appendChild(meta)
        }
        this._writeStyle(BASE_STYLE_ID, BASE_CSS)
        this._writeStyle(READER_STYLE_ID, this._params.css)
    }

    private _writeStyle(id: string, css: string) {
        let style = this._doc.getElementById(id) as HTMLStyleElement | null
        if (!style) {
            style = this._doc.createElement('style')
            style.id = id
            ;(this._doc.head ?? this._doc.documentElement).appendChild(style)
        }
        if (style.textContent !== css) {
            style.textContent = css
        }
    }

    private async _applyStyle(css: string) {
        // Re-anchor on whatever was at the top of the viewport so a font change keeps place.
        const anchor = this._pendingTarget ?? this._anchorTarget()
        this._writeStyle(READER_STYLE_ID, css)
        await nextFrame()
        this._layout.sync()
        if (anchor) {
            this._pendingTarget = anchor
            this._resolvePendingTarget()
        }
        this._highlights.reflow()
        this._scheduleLocation(0)
    }

    private _anchorTarget(): ReaderTarget | null {
        const start = this._view.inViewAddresses()?.[0]
        return start ? { kind: 'address', address: start } : null
    }

    // -- navigation -------------------------------------------------------------------

    private _resolvePendingTarget() {
        const target = this._pendingTarget
        if (!target) return
        switch (target.kind) {
            case 'start':
                this._win.scrollTo({ top: 0 })
                return
            case 'end':
                this._layout.goToEnd()
                return
            case 'address':
                this._layout.goToAddress(target.address)
                return
            case 'fragment': {
                const element = this._doc.getElementById(target.id)
                if (element && !isInjected(element)) {
                    this._layout.goToAddress(this._selector.addressFromNode(element))
                }
                return
            }
        }
    }

    // -- reporting --------------------------------------------------------------------

    private _visibleRange(): AddressRange | null {
        const range = this._view.inViewAddresses()
        if (!range) return null
        const [start, end] = range
        return { start, end }
    }

    private _scheduleLocation(delay = LOCATION_THROTTLE_MS) {
        if (!this._ready) return
        if (this._locationTimer !== null) {
            if (delay > 0) return
            clearTimeout(this._locationTimer)
        }
        this._locationTimer = setTimeout(() => {
            this._locationTimer = null
            const visible = this._visibleRange()
            if (visible) {
                this._post({ type: 'location', spineIndex: this._params.spineIndex, visible })
            }
        }, delay)
    }

    private _postSelection = () => {
        this._selectionTimer = null
        if (!this._textSelectionEnabled) {
            this._win.getSelection()?.removeAllRanges()
            return
        }
        const selection = this._win.getSelection()
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
        if (!range || range.collapsed) {
            this._post({ type: 'selection', spineIndex: this._params.spineIndex, range: null, text: '' })
            return
        }
        const [start, end] = this._selector.fromDOMRange(range)
        this._post({
            type: 'selection',
            spineIndex: this._params.spineIndex,
            range: { start, end },
            text: range.toString(),
        })
    }

    // -- highlights -------------------------------------------------------------------

    private _paintHighlights() {
        this._highlights.removeAll()
        for (const highlight of this._highlightParams) {
            this._highlights.add({
                id: highlight.id,
                startAddr: highlight.start,
                endAddr: highlight.end,
                color: highlight.color,
                classNames: [INJECT_CLASS],
            })
        }
    }

    // -- listeners --------------------------------------------------------------------

    private _addListeners() {
        const userMoved = () => { this._pendingTarget = null }
        let touchStart: { x: number; y: number; t: number } | null = null

        this._win.addEventListener('touchstart', (event: TouchEvent) => {
            userMoved()
            const touch = event.changedTouches[0]
            if (touch) {
                touchStart = { x: touch.clientX, y: touch.clientY, t: Date.now() }
            }
        }, { passive: true })
        this._win.addEventListener('wheel', userMoved, { passive: true })

        this._win.addEventListener('touchend', (event: TouchEvent) => {
            const start = touchStart
            touchStart = null
            if (!start) {
                return
            }
            const touch = event.changedTouches[0]
            if (!touch) {
                return
            }
            const dx = touch.clientX - start.x
            const dy = touch.clientY - start.y
            const dt = Date.now() - start.t
            const movedTooFar = dx * dx + dy * dy > CONTENT_TAP_MAX_MOVE_PX * CONTENT_TAP_MAX_MOVE_PX

            if (!this._textSelectionEnabled) {
                if (movedTooFar) {
                    return
                }
                this._win.getSelection()?.removeAllRanges()
                this._post({ type: 'contentTap', spineIndex: this._params.spineIndex })
                return
            }

            if (dt > CONTENT_TAP_MAX_MS) {
                return
            }
            if (movedTooFar) {
                return
            }
            const selection = this._win.getSelection()
            if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
                return
            }
            const probe = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true,
            })
            const { id: highlightId } = this._highlights.getHighlightIdForMouseEvent(probe)
            if (highlightId) {
                return
            }
            this._post({ type: 'contentTap', spineIndex: this._params.spineIndex })
        }, { passive: true })

        this._win.addEventListener('scroll', () => { this._scheduleLocation() }, { passive: true })

        this._doc.addEventListener('selectionchange', () => {
            if (this._selectionTimer !== null) clearTimeout(this._selectionTimer)
            this._selectionTimer = setTimeout(this._postSelection, SELECTION_DEBOUNCE_MS)
        })

        this._doc.addEventListener('click', (event: MouseEvent) => {
            const { id } = this._highlights.getHighlightIdForMouseEvent(event)
            if (!id) {
                return
            }
            if (!this._textSelectionEnabled) {
                this._post({ type: 'contentTap', spineIndex: this._params.spineIndex })
                return
            }
            this._post({ type: 'highlightTap', spineIndex: this._params.spineIndex, id })
        })

        this._win.addEventListener('resize', () => {
            const anchor = this._pendingTarget ?? this._anchorTarget()
            this._layout.sync()
            if (anchor) {
                this._pendingTarget = anchor
                this._resolvePendingTarget()
            }
            this._highlights.reflow()
            this._scheduleLocation(0)
        })
    }
}

