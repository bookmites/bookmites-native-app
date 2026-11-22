import { DOMNode } from "./node";

export type Step = number;
export type Offset = `:${number}`;
export type NodeAddress = Step[]
export type FullAddress = (Step | Offset)[]  //NodeAddress | [...NodeAddress, Offset]

export interface SelectorOptions {
    filter?: (node: Node) => boolean;
    terminus?: Node
}
export const addressFromNode = (node: Node, options?: SelectorOptions): NodeAddress => {
    const steps : number[] = [];
    let current: Node = node;
    while (current.parentNode && current !== options?.terminus) {
        const filtered = Array.from(current.parentNode.childNodes).filter(options?.filter ?? (() => true));
        if (current.nodeType === DOMNode.TEXT_NODE) {
            const textNodes = filtered.filter(n => n.nodeType === DOMNode.TEXT_NODE);
            const index = textNodes.findIndex(n => n.isSameNode(current))
            const step = index * 2 + 1;
            steps.push(step);
        } else if (current.nodeType === DOMNode.ELEMENT_NODE) {
            const elementNodes = filtered.filter(n => n.nodeType === DOMNode.ELEMENT_NODE);
            const index = elementNodes.findIndex(n => n.isSameNode(current))
            const step = (index + 1) * 2;
            steps.push(step);
        } else {
            throw new Error(`Invalid node type in hierarchy: ${String(current.nodeType)}`);
        }
        current = current.parentNode;
    }
    return steps.reverse()
}
export const nodeFromAddress = (root: Node, address: NodeAddress, options?: SelectorOptions): Node | null => {
    let currentNode: Node = root;

    for (const step of address) {
        const filtered = Array.from(currentNode.childNodes).filter(options?.filter ?? (() => true));
        if (step % 2 === 0) {
            // Even step selects an element
            const elementNodes = filtered.filter(n => n.nodeType === DOMNode.ELEMENT_NODE);
            const index = (step / 2) - 1;
            if (elementNodes.length <= index) {
                return null;
            }
            const nextNode = elementNodes[index]
            if (!nextNode) return null;
            currentNode = nextNode
        } else {
            // Odd step selects a text node
            const textNodes = filtered.filter(n => n.nodeType === DOMNode.TEXT_NODE);
            const index = (step - 1) / 2;
            if (textNodes.length <= index) {
                return null;
            }
            const nextNode = textNodes[index]
            if (!nextNode) return null;
            currentNode = nextNode;
        }
    }

    return currentNode;
}
export const isValidAddress = ([first, ...rest]: FullAddress) : boolean =>
    // Empty address is invalid
    first === undefined ? false :
    // Offset must be terminal
    typeof first === 'string' ?
        rest.length === 0 
    
    // Odd step must be terminal OR followed by an offset
    : first % 2 !== 0 ?
        (
            rest.length === 0 || 
            (rest.length === 1 && typeof rest[0] === 'string') || 
            false
        )
    :
        isValidAddress(rest as FullAddress)

// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
export const makeOffset = (offset: number) : Offset => `:${offset}`

export const getOffset = (address: FullAddress) : number | null => {
    const offset = address.find(step => typeof step === 'string');
    if (!offset) return null;
    return parseInt((offset as string).substring(1));
}

export const toNodeAddress = (address: FullAddress) => 
    address.filter(step => typeof step === 'number') as NodeAddress

export const commonSteps = (start: NodeAddress, end: NodeAddress): NodeAddress => {
    const result: NodeAddress = [];
    for (let i = 0; i < start.length && i < end.length; i++) {
        if (start[i] !== end[i]) {
            return result;
        }
        const step = start[i];
        if (typeof step === 'number') result.push(step);
    }
    return result;
}

export const addressesEqual = (addr1: FullAddress, addr2: FullAddress): boolean => {
    if (addr1.length !== addr2.length) return false;
    for (let i = 0; i < addr1.length; i++) {
        if (addr1[i] !== addr2[i]) return false;
    }
    return true;
}

// non-inclusive
export const getPeerNodesBefore = (node: Node): Node[] => {
    const parent = node.parentNode;
    if (!parent) {
        return [];
    }
    const nodes: Node[] = [];
    for (const child of parent.childNodes) {
        if (child.isSameNode(node))
            break;
        nodes.push(child);
    }
    return nodes;
}
// non-inclusive
export const getPeerNodesAfter = (node: Node): Node[] => {
    const parent = node.parentNode;
    if (!parent) {
        return [];
    }
    const nodes: Node[] = [];
    let found = false;
    for (const child of parent.childNodes) {
        if (found) nodes.push(child);
        if (child.isSameNode(node)) found = true;
    }
    return nodes;
}
// non-inclusive
export const getPeerNodesBetween = (start: Node, end: Node): Node[] => {
    const parent = start.parentNode;
    if (!parent) return [];
    const nodes: Node[] = [];
    let found = false;
    for (const child of parent.childNodes) {
        if (child.isSameNode(end)) return nodes;
        if (found) nodes.push(child);
        if (child.isSameNode(start)) found = true;
    }
    return nodes;
}
export const getAllLeafNodes = (node: Node): Node[] => {
    const leaves: Node[] = [];
    if (node.childNodes.length === 0) {
        // This is a leaf element
        leaves.push(node);
    } else {
        // Recursively check children
        for (const child of node.childNodes) {
            leaves.push(...getAllLeafNodes(child));
        }
    }
    return leaves;
}
export const getAllLeafElements = (node: Node): Node[] => {
    const leaves: Node[] = [];
    const contentfulChildren = Array.from(node.childNodes).filter(n => n.nodeType === DOMNode.ELEMENT_NODE);
    if (contentfulChildren.length === 0) {
        // This is a leaf element
        leaves.push(node);
    } else {
        // Recursively check children
        for (const child of contentfulChildren) {
            leaves.push(...getAllLeafElements(child));
        }
    }
    return leaves;
}
export const isContentful = (node: Node): boolean => {
    if (node.nodeType === DOMNode.ELEMENT_NODE) {
        return true // TODO: further checks?
    }
    if (node.nodeType === DOMNode.TEXT_NODE) {
        return node.textContent?.trim() !== '';
    }
    return true;
}
export const getFirstContentfulChild = (node: Node): Node | null => {
    const child = node.firstChild;
    if (child && isContentful(child)) return child;
    for (const child of node.childNodes) {
        if (isContentful(child)) return child;
    }
    return null;
}
export const getLastContentfulChild = (node: Node): Node | null => {
    const child = node.lastChild;
    if (child && isContentful(child)) return child;
    for (const child of Array.from(node.childNodes).reverse()) {
        if (isContentful(child)) return child;
    }
    return null;
}