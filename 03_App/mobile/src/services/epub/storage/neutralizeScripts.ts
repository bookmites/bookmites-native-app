/**
 * Disables author scripts in an epub content document before the reader WebView loads it.
 *
 * Imported epubs are arbitrary user files. The reader WebView runs our own injected script,
 * so JavaScript stays enabled — which means a script shipped inside a book would run too.
 * We neutralise them at extraction time.
 *
 * The rewrite must leave the DOM *structure* untouched: CFIs (reading position, highlights)
 * and refcodes count element and text nodes, so removing a `<script>` element would shift
 * every address after it and make our CFIs disagree with any other reader's. Instead:
 *
 * - `<script>` elements stay in place, retyped to a MIME type browsers never execute.
 * - Inline event-handler attributes (`onclick=` …) are renamed to inert `data-` attributes.
 * - `javascript:` URLs in `href` / `src` / `xlink:href` are rewritten to an inert fragment.
 *
 * Attributes are not CFI steps, so none of this changes an address.
 */

export const DISABLED_SCRIPT_TYPE = 'text/x-bookmites-disabled'

const SCRIPT_OPEN_TAG = /<script\b([^>]*?)(\/?)>/gi
const TYPE_ATTRIBUTE = /\stype\s*=\s*("[^"]*"|'[^']*'|[^\s>/]+)/gi
const ANY_OPEN_TAG = /<[a-zA-Z][^<>]*>/g
const EVENT_HANDLER_ATTRIBUTE = /(\s)on([a-z]+)(\s*=)/gi
const JAVASCRIPT_URL = /(\s(?:href|src|xlink:href)\s*=\s*["']?)\s*javascript:/gi

export function neutralizeScripts(markup: string): string {
    return markup
        .replace(SCRIPT_OPEN_TAG, (_match, attributes: string, selfClosing: string) => {
            const withoutType = attributes.replace(TYPE_ATTRIBUTE, '')
            return `<script${withoutType} type="${DISABLED_SCRIPT_TYPE}"${selfClosing}>`
        })
        .replace(ANY_OPEN_TAG, (tag) =>
            tag
                .replace(EVENT_HANDLER_ATTRIBUTE, '$1data-bookmites-on$2$3')
                .replace(JAVASCRIPT_URL, '$1#bookmites-blocked:'),
        )
}

/** Content documents the WebView may render (and therefore execute). */
export function isRenderableContentDocument(path: string): boolean {
    return /\.(xhtml|html|htm|svg)$/i.test(path)
}
