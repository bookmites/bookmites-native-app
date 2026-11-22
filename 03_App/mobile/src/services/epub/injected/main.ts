/**
 * Entry point of the reader bundle injected into every spine document.
 * Built to an IIFE string by `scripts/build-reader-bundle.mjs`; never imported by app code.
 *
 * The app injects this bundle twice per page load (before content, and after load) because
 * Android evaluates the before-content script at `onPageStarted`, which can land in the
 * previous document. Booting is therefore idempotent and checks it is in the right document.
 */
import {
    BRIDGE_GLOBAL,
    PRELOAD_GLOBAL,
    type PreloadParams,
    type ReaderCommand,
    type ReaderMessage,
} from './protocol'
import { InDocumentReader } from './reader'

interface Bridge {
    receive(command: ReaderCommand): void
}

type ReaderWindow = Window & {
    ReactNativeWebView?: { postMessage(message: string): void }
    [BRIDGE_GLOBAL]?: Bridge
    [PRELOAD_GLOBAL]?: PreloadParams
}

const post = (message: ReaderMessage) => {
    ;(window as ReaderWindow).ReactNativeWebView?.postMessage(JSON.stringify(message))
}

const lastSegment = (path: string) => {
    const segment = path.split(/[?#]/)[0]?.split('/').filter(Boolean).pop() ?? ''
    try {
        return decodeURIComponent(segment)
    } catch {
        return segment
    }
}

const isIntendedDocument = (params: PreloadParams) =>
    lastSegment(window.location.pathname) === lastSegment(params.documentPath)

const describe = (error: unknown) => (error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error))

function boot() {
    const win = window as ReaderWindow
    const params = win[PRELOAD_GLOBAL]
    if (win[BRIDGE_GLOBAL] || !params || !isIntendedDocument(params)) {
        return
    }

    let reader: InDocumentReader | null = null
    let started = false
    const queued: ReaderCommand[] = []

    win[BRIDGE_GLOBAL] = {
        receive(command) {
            if (reader && started) {
                reader.receive(command)
            } else {
                queued.push(command)
            }
        },
    }

    win.addEventListener('error', event => {
        post({ type: 'log', level: 'error', message: `${event.message} (${event.filename}:${String(event.lineno)})` })
    })

    const init = () => {
        try {
            const instance = new InDocumentReader(params, post)
            reader = instance
            instance
                .start()
                .then(() => {
                    started = true
                    for (const command of queued.splice(0)) {
                        instance.receive(command)
                    }
                })
                .catch((error: unknown) => {
                    post({ type: 'log', level: 'error', message: `reader start failed: ${describe(error)}` })
                })
        } catch (error) {
            post({ type: 'log', level: 'error', message: `reader init failed: ${describe(error)}` })
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true })
    } else {
        init()
    }
}

boot()
