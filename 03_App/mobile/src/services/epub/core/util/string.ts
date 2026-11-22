export const DIGIT_TO_SUPERSCRIPT: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
}

export const HAS_URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i


export const formatTime = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export const joinPath = (...parts: string[]) => 
    // Simple POSIX-style join suitable for RNFS paths
    parts
        .filter(Boolean)
        .map((p) => p.replace(/\/+$/, ''))
        .join('/')
        .replace(/\/+/g, '/')

/** Join a base URL to a path; trims extra slashes so the result has a single `/` between segments. */
export const joinBaseUrl = (base: string | undefined, path: string) => {
    const b = (base ?? '').replace(/\/+$/, '')
    const p = path.replace(/^\/+/, '')
    return `${b}/${p}`
}

export const basename = (path: string) => path.split('/').pop() ?? ''

/**
 * Squash runs of whitespace into single spaces. Text pulled out of EPUB markup carries the
 * source document's line breaks and indentation, which paste as ragged prose.
 */
export const collapseWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim()

export const slugify = (s: string): string =>
    s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
