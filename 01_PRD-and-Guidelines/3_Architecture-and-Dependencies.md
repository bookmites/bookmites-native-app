
# Architecture Overview

*One-pager outline (Phase 0.2 — local epub reader on Android). Details and rationale live in **Discussion Notes** below.*

Core Goals:
- **Great UX:** a little complexity on the code side is fine if it means the epub experience *feels* really smooth and solid. 
- **Local-First** data primarily stored to the phone, back up to the cloud.



#### Product scope
FOSS mobile reader for epub2/epub3, text-first (images OK; rich media not a priority). Phase 0.2 is **local-first**: no account or cloud required to read. **Android-first** for builds and dogfooding; iOS in Phase 0 but not the initial integration spike.

#### Client platform
**React Native** with **Expo** (managed workflow + **development builds**). Stock **Expo Go** is insufficient once Readium is in the stack; day-to-day work stays Metro + Fast Refresh after a custom dev client is installed.

#### Code layout
Application code under `03_App/mobile/src/`: **`features/`** (library, reader, …), **`components/ui/`**, **`services/`**, **`db/`**, **`design/`**. Product screens and hooks live in features; shared UI is product-agnostic. **Features do not import Readium directly.**

#### Epub engine
**Readium** via **`react-native-readium`**—native reader surface, not WebView + epub.js. Chosen for pagination, highlighting, and locator stability when users change fonts and reading settings.

#### Reader integration
A thin **`services/`** reader adapter exposes app-level verbs: open/close, TOC, `goTo(locator)`, position updates, highlights; later, text around a locator for AI. Insulates `features/reader/` from Readium API churn and keeps one place to debug reading behavior.

#### Local data
**App-private filesystem** holds epub copies; **SQLite** holds structured library and reading state. Optional user-driven cloud backup is a later concern; Phase 0.2 assumes the phone is the source of truth.

#### Data model
**Book records** (title, paths, `fileOnDevice`, etc.) are separate from **user artifacts** (progress, highlights, notes) linked by `bookId`. Users can remove the epub file from device but keep artifacts until they explicitly delete the book from the library.

#### SQLite stack
**expo-sqlite** + **Drizzle** with versioned migrations from the first schema. Chosen for Expo fit and typed schema; **op-sqlite** remains a fallback if profiling shows DB pressure on device.

#### Import policy
**Copy on import** into app storage from the system file picker—no reference-only URIs. Mobile paths are unreliable; we always read our own copy so opens do not break when Downloads or email attachments move.

#### Locators
Store **Readium locator JSON** for reading position and highlights—not pixel scroll or page index—so reflow and font changes do not lose the user’s place. Optional plain-text **snippet** on highlights for list/search UI only.

#### Build & test
APKs via Gradle (`expo run:android`, EAS when useful). Readium needs **JDK 17** and native Android/iOS config persisted through Expo **prebuild** and config plugins. Primary validation target: physical Android device, not desktop browser.

#### Android API levels
Use **Expo’s defaults** for `minSdk` and `targetSdk` at project creation; ensure **compileSdk** satisfies Readium. Do not raise `minSdk` without a concrete feature need—confirm values in `build.gradle` during the Readium spike.

#### Explicitly later
In-app AI and BYOK, book companion/skill files, opt-in cloud backup, import dedupe by file hash, Play Store release and signing hardening. None of these block Phase 0.2 “read a book.”

*Feedback welcome on: Readium + Expo integration risk, adapter boundaries, locator/highlight schema, and anything we’re underestimating for a quality highlight UX.*


















--------------------------------------------------
# **Discussion Notes**


**Folder Structure & components**

*Decision:* App source uses **`features/`** for product areas and **`components/ui/`** (plus optional `components/layout/`) for product-agnostic UI. Cross-cutting non-UI logic lives in **`services/`** and **`db/`** at the app root—not mixed in with buttons and dropdowns.

*Reasoning:*
- Keeps a **clean distinction in the tree**: `components/` means reusable presentation only; anything that exists because “Library” or “Reader” is a section lives under `features/<name>/`.
- **Colocation:** screens (`.tsx`), feature-local UI, and hooks/helpers (`.ts`) for that section sit together, so you do not hunt across folders for one flow.
- Aligns with [design philosophy](./2_Design-Philosophy.md): UI stays thin; persistence, epub/readium adapters, and import logic stay out of feature folders until they are truly single-feature-only—shared code moves to `services/` or `db/`.

*Import rule (high level):* `components/ui` → no imports from `features/`; `features/*` → may use `ui`, `services`, `db`; `services/` and `db/` → do not import from `features/` or UI.

*Sketch (details TBD):* `03_App/mobile/src/` → `components/ui/`, `features/library/`, `features/reader/`, …, `services/`, `db/`, `design/`.


-------------------------------------------------------



-------------------------------------------------------

**Expo**

*What it is:* [Expo](https://expo.dev) is a toolkit on top of **React Native**: Metro bundler and Fast Refresh for JS/TS (similar rhythm to web React), plus curated native modules, project config, and optional **EAS** cloud builds. Android binaries are still produced by **Gradle** under the hood (`expo run:android`, or EAS → APK).

*Alternatives considered:*
- **Bare React Native** — full control of `android/` / `ios/` from day one; more native setup and maintenance.
- **Expo Go only** — fastest first run, but cannot load arbitrary native code (ruled out once **Readium** is in scope).

*Tradeoffs (accepted):*
- **Development build required** — custom dev client (not stock Expo Go) for `react-native-readium`; occasional native rebuilds when native deps or config change.
- **Config plugins / `prebuild`** — Readium needs Android (JDK 17, desugaring) and iOS pod setup; we persist that via Expo config, not hand-edited native projects every time.
- **Version coupling** — Expo SDK ↔ React Native ↔ Readium must be upgraded together.
- **Upside** — Lighter day-to-day loop (terminal + emulator/phone vs living in Android Studio/Xcode), solid modules for file picker / fonts / SQLite, straightforward path to **debug APKs** for on-device testing.

*Decision:* Use **Expo (managed workflow + development builds)** for `03_App/mobile`. Android-first for Phase 0.2; iOS later when needed.


-------------------------------------------------------

**Epub engine: Readium**

*What it is:* [Readium](https://readium.org/) is an open-source **epub engine** (parsing, layout, navigation, accessibility) used by serious reading apps. In our stack we integrate it via **[react-native-readium](https://github.com/5-stones/react-native-readium)** (native Android/iOS views + JS API)—not a WebView wrapping epub.js.

*Alternatives considered:*
- **WebView + epub.js** (or RN wrappers) — fastest spike; weaker pagination, highlight anchoring, and accessibility when fonts/size change; more “browser in a box.”
- **Other native engines** — no compelling FOSS option with the same RN maturity and epub2/epub3 focus for mobile.

*Tradeoffs (accepted):*
- **Heavier integration** — native deps (Nitro modules), Gradle/Podfile/config-plugin work with Expo; not playable in Expo Go.
- **Team learning curve** — Readium concepts (locators, publication model) vs simple HTML rendering.
- **Upside** — Industry-standard **logical positions** for progress/highlights; better page-turn and selection behavior; solid foundation for dyslexic fonts, TOC, and future **AI context** (text around a location).

*Decision:* **Readium** is the epub engine for The Reader. App code should talk to a thin **`services/`** adapter (open book, TOC, go to locator, observe position) so features stay decoupled from Readium API details.

*Details TBD:* exact package version, Expo config plugins, and locator storage format (see open questions below).

-------------------------------------------------------

**Reader adapter (`services/` reader engine)**

*What it is:* A thin **adapter** between app features and `react-native-readium`—a stable in-app API (names like `EpubSession` or `readerEngine` are fine). Features do **not** import Readium directly.

*Why:* Library, reader UI, SQLite, and future AI should depend on **our verbs** (open book, TOC, go to location, current locator, highlights, text around location)—not Readium’s wire format or view lifecycle.

*Surface (high level):*
- Open / close publication for a `bookId`
- Table of contents for UI
- `goTo(locator)` and observe location changes (progress)
- Create/list highlights (locator-backed)
- (Later) text slice around a locator for AI context

*Persistence:* Store **Readium locator JSON** (not scroll pixels) for reading position and highlights. Pass the same locator back into `goTo()` after font/size changes so layout reflow does not break progress or highlights.

*Decision:* One Readium-backed implementation in `services/`; `features/reader/` calls the adapter only. Engine swap is out of scope now that Readium is chosen; the adapter still limits blast radius when the Readium API or our usage changes.

-------------------------------------------------------

**Local data: storage layers and schema**

Two ideas that work together (not either/or):

*Storage layers (where bytes live):*
- **Filesystem** — epub files in app-private storage (e.g. per-book path under a known root).
- **SQLite (`db/`)** — library index, progress, highlights, settings; queryable and small.
- **Backup (later)** — optional export/sync (Drive, iCloud); out of scope for Phase 0.2.

*Logical model (what we store):*
- **Book record** — “this title is in the library”: metadata, stable `bookId`, path to epub (if present), whether the **file is on device**.
- **User artifacts** — data tied to reading, keyed by `bookId`: reading position (locator), highlights, notes; (later) chats, companion attachments.

*Why both:* Layering splits **files vs rows**; the model splits **imported content vs user-created reading data**. Artifacts stay in SQLite when the user removes the epub from device but keeps library entry and progress (Phase 0.2 “remove from local storage without losing metadata”).

*Decision:* Copy epubs into our sandbox on import; persist artifacts in SQLite linked by `bookId`; deleting the file updates the book record (`fileOnDevice` / path), does **not** cascade-delete highlights or progress unless the user explicitly removes the book entirely.

*Details:* table columns, relative paths, FK rules, and migration history — **[Schema and paths](./4_Schema-and-Paths.md)** (living doc; update when tickets change schema).

-------------------------------------------------------

**SQLite stack**

*What it is:* **[expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)** is Expo’s first-party SQLite binding for React Native—local relational DB on device for book records, progress, highlights, etc. **[Drizzle ORM](https://orm.drizzle.team/)** sits on top for schema, TypeScript types, and **versioned migrations** in `db/` (not ad-hoc `CREATE TABLE` only).

*Alternatives considered:* **op-sqlite** (+ Drizzle)—faster native driver, common in performance-focused RN apps; more native surface area alongside Readium/Nitro.

*Why expo-sqlite is marginally better for us:* Phase 0.2 load (library list, debounced position saves, highlights) is modest—raw speed rarely matters yet. What matters more is **Expo alignment** (same SDK upgrade path as the rest of the app), **one fewer native dependency** while Readium integration is already heavy, and **documented Expo + dev-client** behavior. op-sqlite stays a fallback if profiling shows DB-related jank.

| | **expo-sqlite + Drizzle** | **op-sqlite + Drizzle** |
|--|---------------------------|-------------------------|
| Expo fit | Strong default | Good; verify per SDK |
| Migrations | Drizzle in `db/` | Drizzle in `db/` |
| Phase 0.2 perf | Sufficient | Often faster |
| Native complexity | Lower | +1 native module |
| Locator JSON in `TEXT` | Yes | Yes |

*Tradeoffs (accepted):* Slightly less headroom than op-sqlite under extreme write load; we debounce progress saves and keep hot paths thin in `services/`.

*Decision:* **expo-sqlite + Drizzle**, migrations from the first schema. Revisit op-sqlite only with measured need.

*Spike (with Readium dev build):* create DB → insert book → save/read locator → one highlight round-trip on device.

-------------------------------------------------------

**Import policy: copy on import**

*What it is:* On “add book,” copy the selected **.epub** into **app-private storage** (stable path per `bookId`) and record metadata in SQLite. Reading always opens **our copy**, not the user’s Downloads/email/origin path.

*Alternatives considered:*
- **Reference only** — store a URI/path to the original file; no duplicate bytes.
- **Optional “copy vs link”** — user choice per import; more UI and support paths.

*Why copy-on-import:*
- Mobile pickers return **content URIs** that break when files move, apps clear cache, or users tidy Downloads.
- Phone file UX is chaotic; users should not lose a library entry because something outside Reader moved.
- Aligns with **local data** (storage layers + book record) above: known filesystem root + `fileOnDevice` on the book record.
- Text epubs are **small**; disk cost is usually minor vs reliability.

*Tradeoffs (accepted):*
- Extra disk if the same file is imported twice (dedupe by hash is **TBD**).
- User may edit/delete the original elsewhere without affecting Reader—they are reading our copy (can be surfaced in UI later if we want transparency).

*Decision:* **Copy on import** for Phase 0.2. No reference-only mode unless we add an explicit advanced flow later with clear “missing file” handling.

-------------------------------------------------------

**Locator scheme for progress and highlights**

*Assuming we go with Readium:* Progress and highlights must survive **font, theme, and margin changes**—store a **logical place in the publication**, not scroll pixels or screen coordinates.

*What we store:*
- **Readium locator (JSON)** — structured object the engine uses (`href`, locations/fragments, optional text hints). Serialized as `TEXT` in SQLite.
- **CFI (string)** — epub’s canonical fragment id; often appears **inside** a Readium locator, not a separate coordinate system.
- **Pixel / page index** — layout-dependent; **not** for persistence.

| | **Readium locator JSON** | **CFI string only** | **Pixel / page index** |
|--|--------------------------|---------------------|-------------------------|
| **Readium `goTo()` / highlights** | Native round-trip | May work; extra conversion | Unreliable after reflow |
| **After font resize** | Intended use case | Same in theory | Breaks often |
| **Highlights at scale** | Matches engine selection model | Range may need 2× CFI + glue | Poor |
| **DB / backup** | One JSON blob per position/highlight | Shorter string | Not portable |

*Why Readium locator JSON:*
- Readium already emits and consumes locators—we persist **what the engine gives us** through the reader adapter.
- Phase 0.2 expects **lots of highlighting and resizing**; locators + optional cached text snippet beat screen rects.
- CFI-only as the **only** column made sense for epub.js; with Readium it is redundant unless we add **export/interchange** later.

*Tradeoffs (accepted):*
- Locators can fail on badly formed epubs or if the user replaces the epub file with a different edition—**file hash / edition id** is TBD for later.
- Highlight shape (single locator vs start/end) follows `react-native-readium`; schema may gain a second locator column after the spike.

*Decision:* **Readium locator JSON** as source of truth for reading position and highlights; no pixel-based persistence. Optional `snippet` column for UI search only.

*Spike acceptance:* highlight → change dyslexic font and size twice → resume position and highlight still land on the same passage on device.

-------------------------------------------------------


