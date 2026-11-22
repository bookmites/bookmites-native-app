# Schema and paths

**Living document** for **SQLite tables, filesystem layout, and path rules** on device. The [Architecture overview](./3_Architecture-and-Dependencies.md) stays high-level; **this file** records concrete decisions, rationale, and what ships in each phase so tickets (001–004…) do not need to re-debate them.

**Source of truth in code:** `03_App/mobile/src/db/schema.ts`, migrations under `src/db/drizzle/`, `getLibraryEpubRoot()` in `src/services/library/`, open resolution in `src/services/reader/openReaderBook.ts`, extraction in `src/services/epub/storage/extractEpub.ts`.

**When to update:** After a ticket changes schema, paths, integrity rules, or open/import behavior—summarize the decision here and link the ticket.

---

## Principles

| Principle | Meaning |
|-----------|---------|
| **`bookId` is the spine** | One stable string ties `books`, reading routes, and artifact rows (`reading_progress`, highlights later). Not the same as display title or file name. |
| **Book record ≠ user artifacts** | `books` is library metadata and *where* bytes live; progress/highlights are separate rows keyed by `bookId`. |
| **Bytes vs flags** | Removing a file from device updates **`file_on_device`** (and maybe presence of bytes on disk)—**not** locator rows. |
| **Paths in DB are relative** | Imported epubs store **`library_relative_path`**; absolute `file://` URIs are built at open time via **`getLibraryEpubRoot()`**. Avoids baking install-specific prefixes into SQLite. |
| **Copy on import** | User picks a file; app copies into app-private storage and reads **our copy** (see [Architecture — import policy](./3_Architecture-and-Dependencies.md)). |
| **CFIs, not pixels** | Progress and highlights store **EPUB CFIs** so font/theme reflow does not break resume ([ticket 007](../02_Tickets/007_In-house-epub-reader.md); Readium locator JSON before that). |
| **Migrations are real** | **expo-sqlite + Drizzle**, versioned SQL in repo; `PRAGMA foreign_keys = ON` on DB open. |

---

## Identity: `bookId`

**Decision:** All persistence and reader navigation use **`bookId`** (TEXT primary key on `books`).

**Why:**

- Decouples routing and artifacts from epub filename or OPF title.
- Import assigns **`expo-crypto` `randomUUID()`** before copy ([ticket 004](../02_Tickets/004_Copy-on-import-and-library-list.md)).
- Dev smoke uses a conventional id: **`fixture.smoke`** ([ticket 002](../02_Tickets/002_Persistent-Location.md)).

**Convention:** Artifact tables use column **`book_id`** referencing **`books.book_id`**.

---

## Filesystem: library root and imports

**Decision:** Imported epubs live under **`{documentDirectory}epubs/`**, exposed in code as **`getLibraryEpubRoot()`** (trailing slash).

**Why:**

- Single place to change layout if we add subfolders or move the tree.
- Aligns with copy-on-import: import writes bytes under this root; SQLite stores **`library_relative_path`** = **`{bookId}.epub`** (filename only; root is already `…/epubs/`). See [004](../02_Tickets/004_Copy-on-import-and-library-list.md).

**Not stored in SQLite:** Absolute `file://` paths for imported books.

**Open path (imported):** `join(getLibraryEpubRoot(), library_relative_path)` → existence check when `file_on_device = 1` → **extract** (below) → reader WebView renders the extracted spine documents.

**Extracted cache (ticket 007):** The reader WebView renders spine XHTML straight from disk, so each epub is unpacked to **`{cacheDirectory}epub-extracted/{bookId}/`**. The original `.epub` under the library root stays the **source of truth**; the extracted directory is **regenerable** (OS cache root: excluded from backups, may be purged — the reader re-extracts on open). A marker file `.bookmites-extracted.json` (format version + source size) is written last; a missing/stale marker triggers re-extraction. At extraction, author scripts are **neutralised without changing DOM structure** (scripts retyped, `on*` handlers renamed, `javascript:` URLs blocked) so CFIs are unaffected. Zip entries that would escape the directory are skipped.

**Bundled dev epubs:** No file under library root. **`kind = bundled_fixture`** uses **`fixture_key`** → bundled asset resolver (`resolveBundledEpub`). `library_relative_path` is NULL.

---

## SQLite schema (Phase 0.2, through ticket 004)

### `books`

| Column | Purpose |
|--------|---------|
| `book_id` | PK; stable `bookId`. |
| `title`, `author` | Display metadata; author nullable. Import fills from package OPF (`dc:title` / `dc:creator`), filename fallback; smoke uses fixed title. |
| `kind` | `bundled_fixture` \| `imported`. Chooses open strategy. |
| `fixture_key` | For `bundled_fixture` only (e.g. `smoke`). NULL for imported. |
| `library_relative_path` | For `imported` only; relative to library root. NULL for bundled. |
| `file_on_device` | 0 \| 1. When 0, open fails; progress may remain. |
| `added_at`, `updated_at` | Epoch ms. |

**Why two `kind` values:** Production library is **`imported`**. **`bundled_fixture`** is for committed smoke/dev epubs without pretending they went through import.

### `reading_progress`

| Column | Purpose |
|--------|---------|
| `book_id` | PK; FK → `books.book_id` **ON DELETE RESTRICT**. |
| `cfi` | **Point CFI** of the first content in view (TEXT). Was `locator_json` (Readium) until **007**. |
| `updated_at` | Epoch ms; saves debounced in reader session (**002**). |

**Why RESTRICT (not CASCADE):** Progress is precious. Deleting a `books` row must not happen accidentally and orphan or auto-wipe positions.

**Product implication ([ticket 003](../02_Tickets/003_Books-table-v1.md)):**

- **File off device** → update `books.file_on_device` / files on disk only; **keep** `reading_progress`.
- **Remove book from library (later)** → explicit UX: delete artifacts (progress, then highlights), **then** delete `books`—not one easy tap. FK **RESTRICT** enforces that order in the database.

**BookQuotes (ticket 006):** `book_quotes` references `book_id` with **ON DELETE RESTRICT**, same pattern as `reading_progress`. Quotes survive `file_on_device = 0`; notebook lists by snippet + join on `books` for title.

### `book_quotes`

| Column | Purpose |
|--------|---------|
| `quote_id` | PK; `randomUUID()` on create (not derived from position). |
| `book_id` | FK → `books.book_id` **ON DELETE RESTRICT**. |
| `cfi` | **Range CFI** of the highlighted text; updated when user changes highlight scope in reader. Was `locator_json` (Readium) until **007**. |
| `refcode` | INTEGER, nullable. **Refcode** of the range start — a sortable reading-order key (`listBookQuotesByBook` orders by it). Null if it could not be computed. |
| `snippet` | Selection text at save time, whitespace-collapsed (required for list UI; paired with the CFI). |
| `created_at`, `updated_at` | Epoch ms; `updated_at` changes on in-reader highlight edit. |

**Boundary:** CRUD in `db/bookQuotes.ts` + `services/bookQuotes/`; highlight painting/selection in `services/reader/` + the WebView bundle (`services/epub/injected/`). Features do not import the WebView or the epub engine.

---

## Integrity and deletion semantics

| User intent | Book row | File on disk | `reading_progress` |
|-------------|----------|--------------|---------------------|
| Keep reading | unchanged | unchanged | updated on read |
| Remove file from device (keep library entry) | `file_on_device = 0`; may keep `library_relative_path` as slot | delete or absent | **retained** |
| Remove book entirely (later) | **delete** after artifacts removed | delete copy | **delete** in same deliberate flow |

**Why document separately from PRD:** PRD states user-visible goals; this table is the **implementation contract** for 004–006.

---

## Path shape decision (absolute vs relative)

**Decision (ticket 003 Q4):** Store **`library_relative_path` + `getLibraryEpubRoot()`**, not absolute path in `books`.

**Alternatives considered:**

- **Absolute `epub_path` in DB** — simpler resolver, painful when storage root or layout changes, awkward for backup/restore pairing.

**Why relative won:**

- Matches “known root + per-book slot” from architecture.
- **`file_on_device = 0`** can keep the relative slot while bytes are gone.
- Import (**004**) only writes relative paths and copies into the known tree.

---

## Dev / smoke data

**Decision:** One bundled row **`fixture.smoke`** inserted in **migration SQL** (not app startup seed), **before** FK is applied on `reading_progress`.

**Why SQL seed:**

- Same rows on every install; upgrade from **002** needs a `books` parent when FK lands.
- Fixed title **“Smoke fixture”**; no OPF read in **003**.

**Not a product pattern:** Real users get **`imported`** rows from **004**, not `bundled_fixture`.

---

## Reader resolution (who owns what)

| Layer | Responsibility |
|-------|----------------|
| `db/` | `getBook`, `upsertBook`, progress helpers; no epub logic. |
| `services/library/` | `getLibraryEpubRoot()`, `pickAndImportBook` (copy → extract → OPF metadata), `listLibraryBooks` (UI sort). |
| `services/epub/` | In-house engine: OPF/spine (`core/epub.ts`), CFIs, selectors, refcodes (`core/`), WebView bundle (`injected/`), extraction (`storage/`). |
| `features/library/` | List UI, `useLibraryBooks`; calls `services/`, `db/`. |
| `services/reader/` | `openReaderBook`: book row → source epub → extracted `Epub` + saved CFI; `ReaderSurface` (WebView); session/quotes/font hooks. |
| `features/reader/` | UI; does not import the WebView or parse CFIs. |

**Decision:** **SQLite `books` is source of truth** for which `bookId`s exist—not an in-memory map (removed in **003**).

---

## Migrations (history)

| Tag | Ticket | Contents |
|-----|--------|----------|
| `0000_black_raider` | 002 | `reading_progress` (no FK yet). |
| `0001_happy_nitro` | 003 | `books`, smoke `INSERT`, `reading_progress` rebuilt with FK **RESTRICT**. |
| `0002_neat_tyger_tiger` | 005 | `reader_global_settings` (global font size tier). |
| `0003_sweet_ghost_rider` | 006 | `book_quotes` (highlights / BookQuote rows). |
| `0004_in_house_reader_cfi` | 007 | Clears `reading_progress` + `book_quotes` (Readium data discarded); `locator_json` → `cfi` on both; adds `book_quotes.refcode`. Hand-written (drizzle-kit's rename prompt is interactive); snapshot verified with `drizzle-kit check` / no-op `generate`. |

---

## Global reader settings (ticket 005)

| Table | Purpose |
|-------|---------|
| `reader_global_settings` | Singleton row `id = global`: `font_size_tier` (`small` \| `medium` \| `large` \| `xl` \| `2xl`), `updated_at`. Not keyed by `bookId`. |

**Default:** No row required on first run — app treats missing row as **`medium`**; first change upserts `global`.

**Wire format:** `services/reader/readerFontSizeTier.ts` maps tier → root font size injected as CSS into each spine document (Medium = 18px; Small 0.85×, Large 1.25×, XL 1.5×, 2XL 1.75×). Publisher styles in relative units scale with it. *(Before 007: Readium `preferences.fontSize`.)*

**Shell vs epub:** Only the reader WebView receives the reader stylesheet; library/reader chrome uses `design/tokens`.

---

## Import flow (ticket 004)

1. User picks epub via **`expo-document-picker`**.
2. App assigns **`randomUUID()`** `bookId`, copies to **`{getLibraryEpubRoot()}{bookId}.epub`**.
3. **`readEpubMetadata`** extracts the copy (see *Extracted cache*) and reads `dc:title` / `dc:creator` via the core `Epub`; filename fallback for a missing title. **An epub that cannot be extracted and parsed is rejected** (copy and extraction removed) — since **007**, previously it was imported with a filename title.
4. **`upsertBook`** with `kind = imported`, `library_relative_path = {bookId}.epub`, `file_on_device = 1`.
5. Library UI lists all `books` rows; **`bundled_fixture`** first, then imported by title. No navigation to reader after import.

---

## Explicitly later (not decided here)

- **006 follow-ons:** Per-quote delete, colors/tags/notes on `book_quotes`.
- Remove-file and remove-book UX wired to semantics above (remove-book should also call `deleteExtractedEpub`).
- Import **dedupe by hash**; cloud backup shape; soft-delete vs hard-delete.
- Whether **`onConflictDoUpdate`** on `upsertBook` should preserve `added_at` on conflict (current code sets on insert only).

---

## Related docs

- [Architecture and dependencies](./3_Architecture-and-Dependencies.md) — stack, copy-on-import, locators, folder layout.
- [Phases and progress](./1_Phases-and-Progress.md) — product capabilities Phase 0.2.
- Tickets: [002](../02_Tickets/002_Persistent-Location.md), [003](../02_Tickets/003_Books-table-v1.md), [004](../02_Tickets/004_Copy-on-import-and-library-list.md), [006](../02_Tickets/006_Highlighting-Basics.md), [007](../02_Tickets/007_In-house-epub-reader.md).