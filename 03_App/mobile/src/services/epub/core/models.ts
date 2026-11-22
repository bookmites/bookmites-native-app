
export interface Itemref {
    idref: string
}
export interface Spine {
    itemref: Itemref[]
}

export interface ManifestItem {
    id: string
    href: string
    mediaType: string
}

export interface Manifest {
    item: ManifestItem[]
}

/** Dublin Core and related literals parsed from `<metadata>` (OPF 2/3). */
export interface Metadata {
    /** dc:title values in document order */
    titles: string[]
    /** dc:creator values in document order */
    creators: string[]
    /** dc:contributor values in document order */
    contributors: string[]
    /** dc:description values in document order */
    descriptions: string[]
    /**
     * Manifest item `id`: from OPF 2 `<meta name="cover" content="…"/>`, or EPUB 3
     * `manifest/item[@properties~='cover-image']`. `content` references `manifest/item/@id`.
     */
    coverItemId?: string
}

export interface Package {
    metadata: Metadata
    manifest: Manifest
    spine: Spine
}

