/**
 * Validates a zip entry name and splits it into path segments for writing under the
 * extraction directory. Returns null for directory entries and for any name that could
 * escape the destination ("zip slip": `..`, absolute paths, drive letters, backslashes).
 */
export function safeArchiveSegments(entryName: string): string[] | null {
    if (entryName.length === 0 || entryName.endsWith('/')) {
        return null
    }
    if (entryName.includes('\\') || entryName.startsWith('/') || /^[a-zA-Z]:/.test(entryName)) {
        return null
    }
    const segments = entryName.split('/')
    for (const segment of segments) {
        if (segment === '' || segment === '.' || segment === '..' || segment.includes('\0')) {
            return null
        }
    }
    return segments
}

/** A filesystem-safe directory name for a book id. */
export function safeDirectoryName(bookId: string): string {
    const cleaned = bookId.replace(/[^A-Za-z0-9._-]/g, '_')
    if (cleaned.length === 0 || /^\.+$/.test(cleaned)) {
        throw new Error(`Cannot derive a directory name from book id “${bookId}”.`)
    }
    return cleaned
}
