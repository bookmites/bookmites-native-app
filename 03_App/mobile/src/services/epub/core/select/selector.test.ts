import { DOMParser, Node, Element } from "@xmldom/xmldom"
import { NodeImplXMLDom } from "./node"
import { CFISelector } from "./selector"

const XML_SOURCE = `<?xml version="1.0" encoding="utf-8"?>
<html>
    <head></head>
    <body>
        <div>
            <p>A</p>
            <p>B</p>
            <div>
                <p>C</p><p class="ignore">D</p>
                E
                <p>F</p>
                <p>G12345678<span>9</span>01234567890</p>
                <p><span>H</span>I</p>
            </div>
        </div>
    </body>
</html>
`

describe('selector', () => {

    let bodyNode : Node
    let selector : CFISelector<Node>

    beforeAll(() => {
        const dom = new DOMParser().parseFromString(XML_SOURCE, 'text/xml')
        const documentElement = dom.documentElement
        if (!documentElement) {
            throw new Error('Document element not found')
        }
        const htmlRootChildren = Array.from(dom.documentElement.childNodes)
        const foundBodyNode = htmlRootChildren.find(node => node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'body') 
        if (!foundBodyNode) {
            throw new Error('Body not found')
        }
        bodyNode = foundBodyNode
        selector = new CFISelector<Node>(bodyNode, NodeImplXMLDom)
    })
    
    it('should be able to extract entire text range', async () => {
        const text = selector.extractTextRange()
        expect(text).toBeDefined()
        const clean = text.replace(/\s+/g, '')
        expect(clean).toBe('ABCDEFG12345678901234567890HI')
    })

    it('should be able to extract subrange', async () => {
        const text = selector.extractTextRange([2,2],[2,4])
        expect(text).toBeDefined()
        const clean = text.replace(/\s+/g, '')
        expect(clean).toBe('AB')
    })

    it('should be able to extract text node', async () => {
        const text = selector.extractTextRange([2,6,3],[2,6,3])
        expect(text).toBeDefined()
        const clean = text.replace(/\s+/g, '')
        expect(clean).toBe('E')
    })

    it('should be able to extract precise range of multiple node types', async () => {
        const text = selector.extractTextRange([2,6,4],[2,6,6])
        expect(text).toBeDefined()
        const clean = text.replace(/\s+/g, '')
        expect(clean).toBe('DEF')
    })

    it('should be able to extract precise range with an offset', async () => {
        const text = selector.extractTextRange([2,6,8,1,':5'],[2,6,8,1,':8'])
        expect(text).toBe('567')
    })

    it('should be able to extract precise range with an offset across multiple nodes', async () => {
        const text = selector.extractTextRange([2,6,8,1,':5'],[2,6,8,2])
        expect(text).toBeDefined()
        const clean = text.replace(/\s+/g, '')
        expect(clean).toBe('56789')

        const text2 = selector.extractTextRange([2,6,8,2,1,':0'],[2,6,8,3,':4'])
        expect(text2).toBeDefined()
        const clean2 = text2.replace(/\s+/g, '')
        expect(clean2).toBe('90123')

        const text3 = selector.extractTextRange([2,6,8,1,':5'],[2,6,8,3,':4'])
        expect(text3).toBeDefined()
        const clean3 = text3.replace(/\s+/g, '')
        expect(clean3).toBe('567890123')
    })

    it('should be able to correctly handle non-existent text nodes causing out of order indexes', async () => {

        // Terminal index of ADDR_ELEMENT (2) is greater than that of ADDR_TEXT (1),
        // but it comes first in the node tree
        // Correct traversal should consider even element steps and odd text steps separately
        // So the example should traverse in order of hierarchy: [2,6,10,2] -> [2,6,10,1]
        const ADDR_ELEMENT = [2,6,10,2]
        const ADDR_TEXT = [2,6,10,1]
        const text = selector.extractTextRange(ADDR_ELEMENT, ADDR_ELEMENT)
        expect(text).toBeDefined()
        expect(text).toBe('H')

        const text2 = selector.extractTextRange(ADDR_TEXT, ADDR_TEXT)
        expect(text2).toBeDefined()
        expect(text2).toBe('I')
    })

    it('should be able to conditionally filter nodes', async () => {
        const filteredSelector = new CFISelector<Node>(bodyNode, NodeImplXMLDom, {
            traversalFilter: (node) => {
                return node.nodeType === Node.ELEMENT_NODE && (node as Element).getAttribute('class') !== 'ignore'
            }
        })
        const ADDR = [2,6,4]
        const text = filteredSelector.extractTextRange(ADDR, ADDR)
        expect(text).toBeDefined()
        expect(text).toBe('F')
    })
})