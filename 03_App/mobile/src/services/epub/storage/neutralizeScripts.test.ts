import { DOMParser } from '@xmldom/xmldom'

import { NodeImplXMLDom } from '../core/select/node'
import { CFISelector } from '../core/select/selector'
import { DISABLED_SCRIPT_TYPE, isRenderableContentDocument, neutralizeScripts } from './neutralizeScripts'

const doc = (body: string) =>
    `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>t</title></head><body>${body}</body></html>`

const bodySelector = (markup: string) => {
    const dom = new DOMParser().parseFromString(markup, 'text/xml')
    const body = dom.getElementsByTagName('body').item(0)
    if (!body) throw new Error('no body')
    return new CFISelector(body, NodeImplXMLDom)
}

describe('neutralizeScripts', () => {
    it('retypes script elements', () => {
        const out = neutralizeScripts(doc('<script type="text/javascript">alert(1)</script><script src="a.js"/>'))
        expect(out).toContain(`<script type="${DISABLED_SCRIPT_TYPE}">alert(1)</script>`)
        expect(out).toContain(`<script src="a.js" type="${DISABLED_SCRIPT_TYPE}"/>`)
        expect(out).not.toContain('text/javascript')
    })

    it('renames inline event handlers and blocks javascript: urls', () => {
        const out = neutralizeScripts(doc('<img src="x.png" onerror="steal()"/><a href="javascript:steal()">x</a>'))
        expect(out).toContain('data-bookmites-onerror="steal()"')
        expect(out).not.toMatch(/\sonerror=/)
        expect(out).toContain('href="#bookmites-blocked:steal()"')
    })

    it('leaves prose that merely mentions these words alone', () => {
        const text = 'The onion said: javascript: is a scheme. <script> tags are mentioned.'
        const out = neutralizeScripts(doc(`<p>${text.replace('<script>', '&lt;script&gt;')}</p>`))
        expect(out).toContain('The onion said: javascript: is a scheme.')
    })

    it('keeps the DOM structure, so CFI addresses do not move', () => {
        const original = doc('<p>one</p><script>evil()</script><p onclick="x()">two <b>bold</b></p>')
        const before = bodySelector(original)
        const after = bodySelector(neutralizeScripts(original))
        expect(after.getEndAddress()).toEqual(before.getEndAddress())
        expect(after.extractTextRange([6, 1, ':0'], [6, 2, 1, ':4'])).toBe(before.extractTextRange([6, 1, ':0'], [6, 2, 1, ':4']))
    })

    it('identifies renderable documents', () => {
        expect(isRenderableContentDocument('OEBPS/ch1.xhtml')).toBe(true)
        expect(isRenderableContentDocument('cover.SVG')).toBe(true)
        expect(isRenderableContentDocument('content.opf')).toBe(false)
        expect(isRenderableContentDocument('style.css')).toBe(false)
    })
})
