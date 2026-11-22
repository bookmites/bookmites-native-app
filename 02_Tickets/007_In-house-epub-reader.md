---
Status: implemented (dev-build acceptance pending)
Tags: epub, webview, cfi, refcode, highlights, book-quotes, readium-removal
---
# Ticket 007 — Replace Readium with the in-house epub reader

**Status:** Implemented; verified in Expo Go on an Android emulator (see *Acceptance*). Dev-build and physical-device pass pending.  
**Phase:** 0.2 — Read a book  
**Created:** 2026-11-21  

## Metadata

| Field | Value |
|-------|--------|
| Branch | `ticket-007-in-house-epub-reader` |
| Depends on | [006 — BookQuotes](./006_Highlighting-Basics.md) (superseded: its product scope is completed here) |
| Unblocks | Pagination (column layout manager already ported), progress percentage from CFIs, TOC, text-around-CFI for AI |
| Living contracts | [Architecture](../01_PRD-and-Guidelines/3_Architecture-and-Dependencies.md); [Schema and paths](../01_PRD-and-Guidelines/4_Schema-and-Paths.md); [`services/epub/README.md`](../03_App/mobile/src/services/epub/README.md) |

---

## Summary

Remove `react-native-readium` and render books with the **in-house engine**: the original Bookmites epub
implementation (CFI parser, DOM selector, refcodes, highlight/selection display code), merged with fixes from
its later `tools-domain` copy, driving a **`react-native-webview`** that loads one extracted spine document at a
time. Bible-specific logic from that copy (verse selection, refs, footnotes, Bible TOC) is not included.

**Why:** 006.1 — Readium's paginated Android selection handles flickered while dragging, with no app-side fix.
Owning the engine gives us control of selection and highlight rendering.

## Decisions (from discussion, 2026-11-21)

| Topic | Decision |
|-------|----------|
| Code provenance | The engine was originally Bookmites code; OK to use. Where the demo and tools-domain differ, the newer logic wins (demo `Epub`/layout managers; tools-domain `refcode` fixes). |
| Layout | **Continuous scroll per spine document** now; pagination later (the column manager from the demo is ported in `core/display/page.ts`, unwired). |
| Selection | **Native WebView selection** with a custom menu: *Highlight* (+ *Copy* on Android, where custom items replace the system menu). `TextSelectionInteractionWord` kept in core for later. |
| Existing data | **Discarded.** Migration `0004` clears `reading_progress` and `book_quotes` (Readium locators don't map to CFIs). |
| Persistence | **CFIs**: point CFI for progress, range CFI for quotes. Quotes also store a **refcode** (sortable reading-order integer). Progress % from CFIs is a follow-up. |
| Storage | Original `.epub` stays the source of truth; extracted copy in the cache dir is regenerable. |

## What changed

- `src/services/epub/core/` — engine (pure TS) + Jest tests; `core/location.ts` CFI ⇄ address helpers; `rectForAddress` so position restore works on collapsed ranges.
- `src/services/epub/injected/` — WebView bundle (esbuild → gitignored `generated/readerBundle.ts`): layout, restore, location/selection reporting, SVG highlights, highlight taps, link handling via the app.
- `src/services/epub/storage/` — fflate extraction to `{cache}/epub-extracted/{bookId}/`, marker file, zip-slip guard, script neutralisation that preserves DOM structure (CFIs unaffected).
- `src/services/reader/` — `ReaderSurface` (WebView), `openReaderBook`, `useReaderBookSession` (CFI progress, section navigation), `useReaderBookQuotes` (create/edit/copy, refcodes), CSS font tiers.
- `src/features/reader/ReaderScreen.tsx` — toolbar / reader / section bar stacked (no overlap, so "in view" is accurate); Previous/Next section.
- Import extracts + parses at import time; unreadable epubs are rejected.
- DB: `locator_json` → `cfi` (both tables), `book_quotes.refcode`; `listBookQuotesByBook` orders by refcode.
- Removed: `react-native-readium`, `react-native-nitro-modules`, `expo-build-properties`, `plugins/withReadiumDesugaring.js`, `plugins/withKotlinGradlePlugin.js`; `android/` regenerated with `expo prebuild --clean` (the JDK 17 `org.gradle.java.home` line was restored by hand).
- Added: `react-native-webview`, `expo-clipboard`, `@xmldom/xmldom`, `fast-xml-parser`; dev: `esbuild`, `jest`.

## Acceptance

**Automated:** `npm test` — 59 tests (CFI, selector, refcode incl. round-trip + reading order, epub parsing, location helpers, script neutralisation incl. "CFI addresses unchanged", zip-slip). `npm run typecheck` clean.

**Expo Go, Android 16 emulator (Pixel 8, API 36), smoke fixture** — all pass:

1. Library loads after migration 0004; smoke book opens (extraction + OPF parse); cover renders; "Section 1 of 22".
2. Previous/Next section navigation.
3. Long-press → native selection with *Highlight · Copy* menu; dragging a handle across three lines extends the selection smoothly (no flicker).
4. *Highlight* → yellow highlight painted exactly over the selection; row in `book_quotes` with range CFI, snippet, refcode (`1004000400001` = spine 4, text node 4, offset 1).
5. Font size Medium → XL with the reader scrolled mid-chapter: the same text stays at the top.
6. Back → reopen: same section and scroll position (progress CFI `epubcfi(/6/10!/4/2/4/2/1:0)`); highlight re-rendered correctly at XL.
7. Tap highlight → edit banner, active colour, quote range pre-selected; new selection + *Highlight* → **same `quote_id`**, new CFI/snippet/refcode, `updated_at` > `created_at`.
8. Notebook lists the quote; data page shows `cfi` / `refcode` columns.

**Not verified here:**

- **Import** — Expo Go's sandbox can't read the document picker's cache (`copyAsync` "isn't readable"); this is an Expo Go limitation, the copy step is unchanged from 004. Needs a dev build: import a real epub, confirm metadata, open, highlight.
- **Dev build** — local Gradle build fails at CMake configure on JDK 24/25 ("restricted method in java.lang.System", same as ticket 001); needs JDK 17.
- **iOS** — not run. Watch: `allowingReadAccessToURL`, `/private/var` URL normalisation, custom menu item placement, collapsed-range rects in WebKit (handled by `rectForAddress`).
- **Copy** action (clipboard write) — not exercised.
- Internal links across spine documents and external links (code path written, no fixture link tested).

## Known gaps / follow-ups

- **Edit-highlight UX:** on Android, the programmatic pre-selection of a tapped quote shows no native handles; the user makes a fresh selection (banner says so). Consider the custom-handle selection (`TextSelectionInteractionWord`) for editing.
- **Pagination**: wire `EpubPaginationManager` + a setting.
- **TOC** (nav.xhtml / NCX) — not implemented; section labels are spine indices.
- **Progress %** from CFIs (planned).
- **Refcode limits**: ≤ 999 spine items, ≤ 9,999 non-empty text nodes per spine document, ≤ 99,999 chars per text node.
- **CFI interop**: text steps index text nodes only (engine convention); consistent across our WebView and xmldom, may differ from other readers for some markup. Spine docs served as `.html` are parsed as HTML by the WebView but as XML for refcodes.
- **Remove book** should call `deleteExtractedEpub`.
- **The Book of Our Stack** (99_Misc) still describes Readium (chapters 1.x–5.x, esp. 3.2–3.4).

## Design philosophy

Consistent: engine behind `services/`, features unchanged in shape; local-first storage; human-readable CFIs in SQLite; FOSS engine we own.
