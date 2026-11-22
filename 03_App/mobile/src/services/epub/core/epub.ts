import { DOMParser, Node, type Document, type Element as XmlElement } from '@xmldom/xmldom'
import { type JPathOrMatcher, XMLParser } from 'fast-xml-parser'
import { CFI } from './select/cfi'
import { NodeImplXMLDom } from './select/node'
import { CFISelector } from './select/selector'
import { HAS_URL_SCHEME, joinBaseUrl, joinPath } from './util/string'
import type { Metadata, Package } from './models'

/** Display metadata derived from the package OPF. */
export interface EpubBookInfo {
    /** Last path segment of the epub root (the extracted directory name). */
    id: string
    title: string
    /** First dc:creator, falling back to the first dc:contributor; null when neither is present. */
    author: string | null
    description: string
    /** Absolute path / URI of the cover image, when the package declares one. */
    coverImgPath?: string
}

const CONTAINER_XML_PATH = 'META-INF/container.xml'
const CONTAINER_NS = 'urn:oasis:names:tc:opendocument:xmlns:container'
const OEBPS_PACKAGE_MEDIA_TYPE = 'application/oebps-package+xml'
const OPF_NS = 'http://www.idpf.org/2007/opf'
/** URIs EPUB tooling uses interchangeably */
const DC_NS_VARIANTS = [
    'http://purl.org/dc/elements/1.1/',
    'http://purl.org/dc/elements/1.1',
] as const

function textsFromDc(parent: XmlElement | null, localName: string): string[] {
    if (!parent) return []
    const seenEl = new Set<XmlElement>()
    const out: string[] = []
    for (const ns of DC_NS_VARIANTS) {
        const nodes = parent.getElementsByTagNameNS(ns, localName)
        for (let i = 0; i < nodes.length; i++) {
            const el = nodes.item(i)
            if (!el || seenEl.has(el)) continue
            seenEl.add(el)
            const t = el.textContent?.trim()
            if (t) out.push(t)
        }
    }
    return out
}

function metaElementsUnder(metadataEl: XmlElement): Set<XmlElement> {
    const metas = new Set<XmlElement>()
    const byNs = metadataEl.getElementsByTagNameNS(OPF_NS, 'meta')
    for (let i = 0; i < byNs.length; i++) {
        const el = byNs.item(i)
        if (el) metas.add(el)
    }
    const byTag = metadataEl.getElementsByTagName('meta')
    for (let i = 0; i < byTag.length; i++) {
        const el = byTag.item(i)
        if (el) metas.add(el)
    }
    return metas
}

function coverManifestIdFromMetadata(metadataEl: XmlElement | null): string | undefined {
    if (!metadataEl) return undefined
    for (const el of metaElementsUnder(metadataEl)) {
        const name = el.getAttribute('name')
        if (name?.trim().toLowerCase() !== 'cover') continue
        const content = el.getAttribute('content')?.trim()
        if (content) return content
    }
    return undefined
}

/** EPUB 3: manifest item with `properties` containing the `cover-image` token. */
function coverItemIdFromManifest(doc: Document): string | undefined {
    const manifest =
        doc.getElementsByTagNameNS(OPF_NS, 'manifest').item(0) ??
        doc.getElementsByTagName('manifest').item(0)
    if (!manifest) return undefined
    const collectItems = (): XmlElement[] => {
        const byNs = manifest.getElementsByTagNameNS(OPF_NS, 'item')
        const out: XmlElement[] = []
        const seen = new Set<XmlElement>()
        for (let i = 0; i < byNs.length; i++) {
            const el = byNs.item(i)
            if (el && !seen.has(el)) {
                seen.add(el)
                out.push(el)
            }
        }
        const byTag = manifest.getElementsByTagName('item')
        for (let i = 0; i < byTag.length; i++) {
            const el = byTag.item(i)
            if (el && !seen.has(el)) {
                seen.add(el)
                out.push(el)
            }
        }
        return out
    }
    for (const el of collectItems()) {
        const props = el.getAttribute('properties')?.trim()
        if (!props) continue
        const tokens = props.split(/\s+/).filter(Boolean)
        if (!tokens.includes('cover-image')) continue
        const id = el.getAttribute('id')?.trim()
        if (id) return id
    }
    return undefined
}

/** Parses OPF `<metadata>` Dublin Core literals (prefixed dc: or same namespace URI). */
export function parseOpfMetadata(opfXml: string): Metadata {
    const doc = new DOMParser().parseFromString(opfXml, 'text/xml')
    const byNs = doc.getElementsByTagNameNS(OPF_NS, 'metadata')
    const metaEl =
        byNs.length > 0 ? byNs.item(0)! : doc.getElementsByTagName('metadata').item(0)
    const coverItemId = coverManifestIdFromMetadata(metaEl) ?? coverItemIdFromManifest(doc)

    const base: Metadata = {
        titles: textsFromDc(metaEl, 'title'),
        creators: textsFromDc(metaEl, 'creator'),
        contributors: textsFromDc(metaEl, 'contributor'),
        descriptions: textsFromDc(metaEl, 'description'),
    }

    return coverItemId === undefined ? base : { ...base, coverItemId }
}

export interface FSOperations {
    readFile(path: string): Promise<string>
}

export class Epub {

    static async open(rootPath: string, fsOperations: FSOperations) {
        const epub = new this(rootPath, fsOperations)
        await epub.load()
        return epub
    }

    protected _rootPath: string
    /** Path to the package OPF relative to epub root (e.g. `epub/content.opf`). */
    protected _packageOpfRelPath?: string
    protected _package?: Package
    protected _fsOperations: FSOperations
    constructor(rootPath: string, fsOperations: FSOperations) {
        this._rootPath = rootPath
        this._fsOperations = fsOperations
    }

    protected _readFile(path: string) {
        return this._fsOperations.readFile(path)
    }

    protected _opfFilePath(rootPath: string) {
        if (!this._packageOpfRelPath) {
            throw new Error("Book not loaded")
        }
        return this._joinPath(rootPath, this._packageOpfRelPath)
    }

    /** Directory containing the OPF; manifest/spine hrefs are resolved against this. */
    protected _opfDirectory(): string {
        if (!this._packageOpfRelPath) {
            throw new Error("Book not loaded")
        }
        const p = this._packageOpfRelPath.replaceAll('\\', '/')
        const slash = p.lastIndexOf('/')
        return slash >= 0 ? p.slice(0, slash) : ''
    }

    // Parses META-INF/container.xml, sets `_packageOpfRelPath`, returns absolute-ish path to the OPF
    protected async _initOebps(rootPath: string) {
        const containerFile = await this._readFile(this._joinPath(rootPath, CONTAINER_XML_PATH))
        const doc = new DOMParser().parseFromString(containerFile, 'text/xml')
        let rootfiles = doc.getElementsByTagNameNS(CONTAINER_NS, 'rootfile')
        if (rootfiles.length === 0) {
            rootfiles = doc.getElementsByTagName('rootfile')
        }
        let rootfile: { getAttribute(name: string): string | null | undefined } | null = null
        for (let i = 0; i < rootfiles.length; i++) {
            const el = rootfiles.item(i)
            if (!el) continue
            if (el.getAttribute('media-type') === OEBPS_PACKAGE_MEDIA_TYPE) {
                rootfile = el
                break
            }
        }
        if (!rootfile && rootfiles.length > 0) {
            rootfile = rootfiles.item(0)
        }
        if (!rootfile) {
            throw new Error('META-INF/container.xml: missing <rootfile>')
        }
        const fullPathRaw = rootfile.getAttribute('full-path')?.trim()
        if (!fullPathRaw) {
            throw new Error('META-INF/container.xml: rootfile missing full-path')
        }
        const fullPath = fullPathRaw.replaceAll('\\', '/').replace(/^\/+/, '')
        this._packageOpfRelPath = fullPath
        return this._joinPath(rootPath, fullPath)
    }

    protected async _opfFile(rootPath: string) {
        const filePath = this._opfFilePath(rootPath)
        return await this._readFile(filePath)
    }

    protected async _parsePackage(rootPath: string): Promise<Package> {
        const opfFile = await this._opfFile(rootPath)
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
            transformAttributeName: (attrName: string) =>
                attrName.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()),
            isArray: (name: string, jpath: JPathOrMatcher) =>
                jpath === 'package.manifest.item' || jpath === 'package.spine.itemref',
        })
        const parsed = parser.parse(opfFile) as { package: Package }
        parsed.package.metadata = parseOpfMetadata(opfFile)
        return parsed.package
    }

    protected _joinPath(rootPath: string, ...parts: string[]): string {
        if (HAS_URL_SCHEME.test(rootPath)) {
            return joinBaseUrl(rootPath, joinPath(...parts))
        }
        return joinPath(rootPath, ...parts)
    }

    get rootPath() {
        return this._rootPath
    }

    get oebpsPath() {
        return this._opfDirectory()
    }

    get package() {
        if (!this._package) {
            throw new Error('Package not loaded')
        }
        return this._package
    }

    get manifest() {
        if (!this._package) {
            throw new Error('Package not loaded')
        }
        return this._package.manifest
    }
    get spine() {
        if (!this._package) {
            throw new Error('Package not loaded')
        }
        return this._package.spine
    }

    spineFilePath(index: number) {
        const itemref = this.spine.itemref[index]
        if (!itemref) return undefined
        const item = this.manifest.item.find(item => item.id === itemref.idref)
        return item?.href
    }

    spineFileUri(index: number) {
        const filePath = this.spineFilePath(index)
        if (!filePath) {
            return null
        }
        const fullPath = this._joinPath(this.rootPath, this._opfDirectory(), filePath)
        if (HAS_URL_SCHEME.test(fullPath)) {
            return fullPath
        }
        // return `file://${fullPath}`
        return fullPath
    }

    async load() {
        await this._initOebps(this.rootPath)
        this._package = await this._parsePackage(this.rootPath)
    }

    async getBookInfo(): Promise<EpubBookInfo> {
        const meta = this.package.metadata
        const id = this._rootPath.replaceAll('\\', '/').split('/').findLast(Boolean) ?? this._rootPath
        const author = meta.creators[0] ?? meta.contributors[0] ?? null
        const coverItem = this.manifest.item.find(item => item.id === meta.coverItemId)
        const coverImgPath = coverItem ? this._joinPath(this.rootPath, this._opfDirectory(), coverItem.href) : undefined

        return {
            id,
            title: meta.titles[0] ?? '',
            author,
            description: meta.descriptions.length ? meta.descriptions.join('\n\n') : '',
            coverImgPath,
        }
    }

    async spineFile(index: number): Promise<string | null> {
        const filePath = this.spineFilePath(index)
        if (!filePath) {
            return null
        }
        const absolutePath = this._joinPath(this.rootPath, this._opfDirectory(), filePath)
        const data = await this._readFile(absolutePath)
        return data
    }
    async spineDOM(index: number): Promise<Document | null> {
        const filePath = this.spineFilePath(index)
        if (!filePath) {
            return null
        }
        const absolutePath = this._joinPath(this.rootPath, this._opfDirectory(), filePath)
        const data = await this._readFile(absolutePath)
        return new DOMParser().parseFromString(data, 'text/xml')
    }
    async spineBodySelector(index: number) {
        const dom = await this.spineDOM(index)
        if (!dom?.documentElement) {
            return null
        }
        const htmlRootChildren = Array.from(dom.documentElement.childNodes)
        const body = htmlRootChildren.find(node => node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'body')
        if (!body) {
            return null
        }
        const selector = new CFISelector(body, NodeImplXMLDom)
        return selector
    }

    async wordCountInRange(startCfi: string, endCfi: string) {
        const text = await this.extractTextRange(startCfi, endCfi);
        return text.trim().split(/\s+/).length;
    }
    
    async extractTextRange(startCfi: string, endCfi: string) {
        const start = CFI.fromString(startCfi);
        const end = CFI.fromString(endCfi);

        const startSpineIndex = start.spineIndex / 2 - 1;
        const endSpineIndex = end.spineIndex / 2 - 1;

        let text = '';
        for (let i = startSpineIndex; i <= endSpineIndex; i++) {
            const isFirst = i === startSpineIndex;
            const isLast = i === endSpineIndex;
            const selector = await this.spineBodySelector(i)
            if (!selector) {
                continue;
            }
            const sectionText = selector.extractTextRange(
                isFirst ? start.toSelectorAddress() : [], 
                isLast ? end.toSelectorAddress() : []
            );
            text += sectionText + '\n';
        }
        return text;
    }

    // return -1 if cfi1Str < cfi2Str, 0 if equal, 1 if cfi1Str > cfi2Str
    // return null if not comparable
    async compareCFIs(cfi1Str: string, cfi2Str: string) {
        const cfi1 = CFI.fromString(cfi1Str);
        const cfi2 = CFI.fromString(cfi2Str);

        if (!cfi1 || !cfi2) {
            return null;
        }

        const spine1 = cfi1.spineIndex / 2 - 1;
        const spine2 = cfi2.spineIndex / 2 - 1;

        if (spine1 !== spine2) {
            return spine1 - spine2;
        }

        const address1 = cfi1.toSelectorAddress();
        const address2 = cfi2.toSelectorAddress();

        const selector = await this.spineBodySelector(spine1);
        if (!selector) {
            return null;
        }

        return selector.compareAddresses(address1, address2);
    }
}