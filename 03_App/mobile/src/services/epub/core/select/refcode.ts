import { CFI } from "./cfi";
import { type CFISelector } from "./selector";
import * as CFISelectionUtils from "./utils";
import type { Epub } from "../epub";


const CONSTRUCTION_TYPE_DEFAULT = 1;

// CFI content paths are document-relative (rooted at <html>), while the body selector
// is rooted at <body> — the second element child of <html> (after <head>), i.e. step 4.
// toSelectorAddress() strips this leading step, so we prepend it when rebuilding a CFI.
const BODY_STEP = 4;

const OFFSET_DIGITS = 5;
const ELEMENT_CODE_DIGITS = 4;
const SPINE_CODE_DIGITS = 3;

const OFFSET_MULTIPLIER = 1;
const ELEMENT_CODE_MULTIPLIER = 10 ** OFFSET_DIGITS;
const SPINE_CODE_MULTIPLIER = 10 ** (OFFSET_DIGITS + ELEMENT_CODE_DIGITS);
const CONSTRUCTION_TYPE_MULTIPLIER = 10 ** (OFFSET_DIGITS + ELEMENT_CODE_DIGITS + SPINE_CODE_DIGITS);



export const refCodeFromCFI = async (cfi: string, epub: Epub) => {
    const parsedCfi = CFI.fromString(cfi);
    if (!parsedCfi.isValid)
        return;

    const spineIndex = parsedCfi.spineIndex / 2 - 1;
    const address = parsedCfi.toSelectorAddress();
    
    const bodySelector = await epub.spineBodySelector(spineIndex);
    if (!bodySelector)
        return;

    const refCode = refCodeFromAddress(spineIndex, address, bodySelector);
    return refCode;
}

export const cfiFromRefCode = async (refCode: number, epub: Epub) => {
    const { spineCode, elementCode, offset } = parseRefCode(refCode);

    const bodySelector = await epub.spineBodySelector(spineCode);
    if (!bodySelector)
        return;

    const allTextContainers = bodySelector.getAllNonEmptyLeafNodes();
    if (allTextContainers.length === 0)
        return;

    const node = allTextContainers[elementCode];
    if (!node)
        return;

    const steps = [BODY_STEP, ...bodySelector.addressFromNode(node)];
    const spineIndex = (spineCode + 1) * 2;
    const cfi = CFI.build({ spineIndex, steps, offset });
    return cfi.toString();
}

const refCodeFromAddress = <N = Node>(spineIndex: number, address: CFISelectionUtils.FullAddress, bodySelector: CFISelector<N>) => {
    const offset = CFISelectionUtils.getOffset(address);
    const nodeAddress = CFISelectionUtils.toNodeAddress(address);
    const node = bodySelector.nodeFromAddress(nodeAddress);
    if (!node)
        return;

    const allTextContainers = bodySelector.getAllNonEmptyLeafNodes();
    if (allTextContainers.length === 0)
        return;

    // A CFI may terminate on a text node (odd step, with a fine-grained offset) or on
    // an element (even step). For an element, use the first non-empty text node within
    // it, or — when the element is empty (e.g. a verse-start boundary marker) — the
    // first non-empty text node following it in document order, at offset 0.
    // (allTextContainers is in document order, so the first match is the nearest one.)
    const lastStep = nodeAddress[nodeAddress.length - 1];
    const terminatesOnElement = lastStep !== undefined && lastStep % 2 === 0;

    let textNode: N = node;
    let textOffset = offset ?? 0;
    if (terminatesOnElement) {
        const nodeImpl = bodySelector.getNodeImpl();
        const firstTextNode = allTextContainers.find(leaf => nodeImpl.isAfter(leaf, node));
        if (firstTextNode === undefined)
            return;
        textNode = firstTextNode;
        textOffset = 0;
    }

    const nodeIndex = allTextContainers.indexOf(textNode);
    if (nodeIndex < 0)
        return;

    return buildRefCode(CONSTRUCTION_TYPE_DEFAULT, spineIndex, nodeIndex, textOffset);
}

const buildRefCode = (constructionType: number, spineCode: number, elementCode: number, offset: number): number =>
    constructionType * CONSTRUCTION_TYPE_MULTIPLIER
    + spineCode * SPINE_CODE_MULTIPLIER
    + elementCode * ELEMENT_CODE_MULTIPLIER
    + offset * OFFSET_MULTIPLIER;

const parseRefCode = (refCode: number) => {
    const constructionType = Math.floor(refCode / CONSTRUCTION_TYPE_MULTIPLIER);
    const spineCode = Math.floor((refCode % CONSTRUCTION_TYPE_MULTIPLIER) / SPINE_CODE_MULTIPLIER);
    const elementCode = Math.floor((refCode % SPINE_CODE_MULTIPLIER) / ELEMENT_CODE_MULTIPLIER);
    const offset = refCode % ELEMENT_CODE_MULTIPLIER;
    return { constructionType, spineCode, elementCode, offset };
}

