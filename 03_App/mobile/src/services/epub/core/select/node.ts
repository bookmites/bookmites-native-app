import type { Node as XmlDomNode } from '@xmldom/xmldom'

/**
 * Node type and document-position constants.
 *
 * The browser exposes these on the global `Node`, but this module also runs in React Native
 * (Hermes) and in Jest's node environment, where no such global exists. Using literals keeps
 * one implementation working against browser DOM nodes (inside the reader WebView) and
 * `@xmldom/xmldom` nodes (in the app process).
 */
export const DOMNode = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    DOCUMENT_POSITION_PRECEDING: 2,
    DOCUMENT_POSITION_FOLLOWING: 4,
    DOCUMENT_POSITION_CONTAINS: 8,
    DOCUMENT_POSITION_CONTAINED_BY: 16,
} as const;

export type NodeType = 'text' | 'element' | 'other';

export interface NodeImpl<N = Node> {
    getParentNode: (node: N) => N | null;
    getAllChildNodes: (node: N) => N[];
    iterChildNodes(node: N): Generator<N>;
    getFirstChild: (node: N) => N | null;
    getLastChild: (node: N) => N | null;
    getNodeType: (node: N) => NodeType;
    getTextContent: (node: N) => string;
    getAttribute: (node: N, name: string) => string | null;
    setAttribute: (node: N, name: string, value: string) => void;
    removeAttribute: (node: N, name: string) => void;


    /**
     * returns true if node is before other
     * @param node
     * @param other
     * @returns boolean
     */
    isBefore: (node: N, other: N) => boolean;

    /**
     * returns true if node is after other
     * @param node
     * @param other
     * @returns boolean
     */
    isAfter: (node: N, other: N) => boolean;
    isSamePosition: (node: N, other: N) => boolean;
    isAncestorOf: (node: N, other: N) => boolean;
    isDescendantOf: (node: N, other: N) => boolean;
    isContentful: (node: N) => boolean;
    isSameNode: (node: N, other: N) => boolean;
}

// @xmldom/xmldom can return `null` childNodes for non-element nodes, unlike browser DOM
// (which returns an empty NodeList). Read through this helper to keep the runtime guard.
const childNodesOf = (node: Node): NodeListOf<ChildNode> | null => node.childNodes ?? null;

export const NodeImplDOM : NodeImpl = {
    getParentNode : (node: Node): Node | null => {
        return node.parentNode;
    },
    getAllChildNodes : (node: Node): Node[] => {
        const childNodes = childNodesOf(node);
        return childNodes ? Array.from(childNodes) : [];
    },
    *iterChildNodes(node: Node): Generator<Node> {
        const childNodes = childNodesOf(node);
        if (!childNodes) return;
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            if (child) yield child;
        }
    },
    getFirstChild : (node: Node): Node | null => {
        return node.firstChild;
    },
    getLastChild : (node: Node): Node | null => {
        return node.lastChild;
    },
    getNodeType : (node: Node): NodeType => {
        return node.nodeType === DOMNode.ELEMENT_NODE ? 'element' : node.nodeType === DOMNode.TEXT_NODE ? 'text' : 'other';
    },
    getTextContent(node: Node): string {
        return node.textContent ?? '';
    },
    getAttribute : (node: Node, name: string): string | null => {
        if (node.nodeType !== DOMNode.ELEMENT_NODE) {
            return null;
        }
        return (node as Element).getAttribute(name);
    },
    setAttribute : (node: Node, name: string, value: string): void => {
        if (node.nodeType !== DOMNode.ELEMENT_NODE) {
            return;
        }
        (node as Element).setAttribute(name, value);
    },
    removeAttribute : (node: Node, name: string): void => {
        if (node.nodeType !== DOMNode.ELEMENT_NODE) {
            return;
        }
        (node as Element).removeAttribute(name);
    },
    // returns true if node is before other
    isBefore : (node: Node, other: Node): boolean => {
        return (node.compareDocumentPosition(other) & DOMNode.DOCUMENT_POSITION_FOLLOWING) !== 0;
    },
    // returns true if node is after other
    isAfter : (node: Node, other: Node): boolean => {
        return (node.compareDocumentPosition(other) & DOMNode.DOCUMENT_POSITION_PRECEDING) !== 0;
    },
    isSamePosition : (node: Node, other: Node): boolean => {
        return node.compareDocumentPosition(other) === 0;
    },
    isAncestorOf : (node: Node, other: Node): boolean => {
        return (node.compareDocumentPosition(other) & DOMNode.DOCUMENT_POSITION_CONTAINS) !== 0;
    },
    isDescendantOf : (node: Node, other: Node): boolean => {
        return (node.compareDocumentPosition(other) & DOMNode.DOCUMENT_POSITION_CONTAINED_BY) !== 0;
    },
    isContentful : (node: Node): boolean => {
        return node.nodeType === DOMNode.ELEMENT_NODE || node.nodeType === DOMNode.TEXT_NODE;
    },
    isSameNode : (node: Node, other: Node): boolean => {
        return node === other;
    }
}

/** xmldom >= 0.9 implements `compareDocumentPosition`, so the DOM implementation applies as-is. */
export const NodeImplXMLDom: NodeImpl<XmlDomNode> = NodeImplDOM as unknown as NodeImpl<XmlDomNode>
