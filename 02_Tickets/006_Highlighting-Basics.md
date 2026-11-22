---
Status: superseded by 007 (completed on the in-house reader)
Tags: readium, book-quotes, highlights, notebook, sqlite, locator
---
# Ticket 006 — BookQuotes: highlight basics + Notebook + data page

**Status:** Superseded by [007 — In-house epub reader](./007_In-house-epub-reader.md). The product scope below (create / edit / persist / Notebook / data page) is completed there on the in-house reader; the Readium implementation notes are historical. Schema changed in 007: `locator_json` → `cfi`, plus `refcode`.  
**Phase:** 0.2 — Read a book  
**Created:** 2026-11-18  

## Metadata

| Field | Value |
|-------|--------|
| Commit | _(none yet)_ |
| Depends on | [005 — Reader font size](./005_Font-size.md) |
| Unblocks | Per-quote delete, colors/tags/annotations, remove book / file-off (later tickets) |
| Living contracts | [Schema and paths](../01_PRD-and-Guidelines/4_Schema-and-Paths.md); [Architecture](../01_PRD-and-Guidelines/3_Architecture-and-Dependencies.md) |
| Product direction | [BookQuotes](../01_PRD-and-Guidelines/6_BookQuotes.md); [BookID](../01_PRD-and-Guidelines/5_BookID.md) _(lifecycle / matching — not implemented in 006)_ |

---

## Summary

Introduce **`BookQuote`** persistence: user **highlights** selected text in the reader, stored as rows in SQLite with **Readium locator JSON** and a **snippet** for list UI. Existing quotes **reappear in the reader** when the book is reopened. A **Notebook** screen lists quotes **across all books** without opening the reader. A **data page** shows raw stored rows for dogfooding.

This ticket proves the **peer object** model from [BookQuotes](../01_PRD-and-Guidelines/6_BookQuotes.md): quotes are not owned by reader UI state; **`services/bookQuotes`** and **`db/`** are the source of truth; reader and notebook are two clients.

**Why now:** **005** locked locator stability under font resize. Phase 0.2 still requires **highlight**; architecture already assumes locator-anchored artifacts. Notebook + data page force the correct boundaries before polish (colors, tags, delete flows, sharing).

**006 ships (product):**

1. User can **create** a highlight in the reader (locator + **selection text** → snippet).
2. User can **change highlight scope** in the reader → **same `BookQuote`**, updated locator + snippet.
3. Highlights **persist** and **render** when reopening the same `bookId`.
4. **Basic Notebook** — flat list of all `BookQuote`s (snippet + book title).
5. **Data page** — ugly but readable dump of relevant SQLite tables (see **Decisions**).

---

## Decisions (locked before implementation)

| Topic | Decision |
|-------|----------|
| **Domain name** | Stored entity = **`BookQuote`** (table `book_quotes`). UI in reader may say “highlight”; code/types prefer `BookQuote` / `bookQuotes` in `services/` and `db/`. |
| **Primary key** | `quote_id` = **`randomUUID()`** on create (not derived from locator). |
| **`book_id`** | Required FK → `books.book_id` **`ON DELETE RESTRICT`**. Same integrity story as `reading_progress` ([Schema and paths](../01_PRD-and-Guidelines/4_Schema-and-Paths.md)). |
| **Anchor** | **`locator_json`** — Readium locator JSON as `TEXT` (same contract as progress). **Not** pixel/selection rects. |
| **Snippet** | **`snippet`** `TEXT NOT NULL` — **selection text** at save time (plain words the user highlighted). **Required for ship:** locator + snippet are a **pair**; locator-only / empty snippet is **not** viable ([BookQuotes](../01_PRD-and-Guidelines/6_BookQuotes.md)). Step 0 **blocks** if Readium cannot expose selection text on the create path. |
| **BookQuote vs fields** | **`quote_id`** is stable identity. **`locator_json`** and **`snippet`** are **mutable** when the user changes highlight scope in the reader (same row, updated fields). Overlapping or adjacent highlights on the same page are **separate** `BookQuote` rows (separate `quote_id`s). |
| **In-reader edit (006)** | While the book is open, user may **resize or move** an existing highlight’s selection; app **updates** that `BookQuote` (`locator_json`, `snippet`, `updated_at`). **Does not** mint a new `quote_id`. Notebook reflects updated snippet after refresh. |
| **Timestamps** | `created_at` set on insert; **`updated_at`** on create **and** on in-reader highlight edit. |
| **Colors, tags, notes** | **Out of scope.** No columns for color/annotation/tags in 006. Reader uses **one fixed decoration style** in code (not a `BookQuote` field). Later fields/tables per [BookQuotes](../01_PRD-and-Guidelines/6_BookQuotes.md). |
| **Local `bookId`** | Unchanged: **per-import UUID** on `books`. Social / catalog matching is [BookID](../01_PRD-and-Guidelines/5_BookID.md) — **not** 006. |
| **Deletion / lifecycle** | **No** remove-book, remove-file, or delete-quote UX in 006. Design schema so quotes survive **`file_on_device = 0`** (notebook uses **snippet** + join on `books` for title). Nuclear delete / per-artifact deletes per [BookID](../01_PRD-and-Guidelines/5_BookID.md) — later ticket. |
| **Notebook scope** | **Flat list**, newest-first (or `created_at` desc). Snippet primary line; **book title** secondary (join `books`; author optional if cheap). No filters, tags, or detail screen. |
| **Data page** | **User-visible** (not `__DEV__`-only): raw dump of **`books`**, **`reading_progress`**, **`book_quotes`**, **`reader_global_settings`**. Lives in **`features/data/`** (or similar); Library button for now. Ugly is fine; IA polish later ([Nefko Q2](#clarifications-for-nefko)). |
| **Navigation** | New routes (Expo Router): **`/notebook`** (product), **`/data`** or **`/dev-data`** (dogfood). Library includes affordance to open **Notebook** (product-visible). |
| **Boundaries** | **`features/reader/`** and **`features/notebook/`** do **not** import Readium. Selection + decorations wired in **`services/reader/`**. CRUD/list in **`services/bookQuotes/`** + **`db/`**. Notebook does **not** import from `features/reader/`. |
| **Progress interaction** | **002** debounced progress unchanged. New quote must not wipe `reading_progress`. |
| **Devices** | Validate on **physical Android** (imported book preferred). Smoke regression on `fixture.smoke` if highlight works there. |

### BookQuote vs highlight (terminology)

| Term | 006 meaning |
|------|-------------|
| **BookQuote** | Persisted row in `book_quotes`. |
| **Highlight** | User action + Readium **decoration** while reading. One default style; not stored as DB color. |

### Locator + snippet (pair)

**`locator_json`** and **`snippet`** answer different questions: *where in this epub* vs *what words*. Both are required for 006 close. They are **not** separate objects—both columns on the same **`BookQuote`** row—so changing the highlighted range in the reader updates **one** `quote_id` without creating a duplicate Notebook entry. A **new** drag-selection that does not attach to an existing decoration creates a **new** `BookQuote` (overlap = multiple rows, multiple ids).

---

## Schema (006 migration)

Proposed table (names snake_case in SQL, camelCase in Drizzle):

| Column | Type | Notes |
|--------|------|--------|
| `quote_id` | TEXT PK | UUID |
| `book_id` | TEXT FK → `books` RESTRICT | Open book / integrity |
| `locator_json` | TEXT NOT NULL | Readium locator; **updated** on in-reader highlight edit |
| `snippet` | TEXT NOT NULL | Selection text; **updated** with locator on edit |
| `created_at` | INTEGER NOT NULL | Epoch ms |
| `updated_at` | INTEGER NOT NULL | Epoch ms |

**Explicitly not in 006 columns:** `color`, `note`, `tags`, `canonical_work_id`, content hash — see [BookID](../01_PRD-and-Guidelines/5_BookID.md) / [BookQuotes](../01_PRD-and-Guidelines/6_BookQuotes.md) for later.

---

## Goals (acceptance)

1. **Migration** `book_quotes` + Drizzle schema + helpers (`createBookQuote`, **`updateBookQuote`**, `listBookQuotesByBook`, `listAllBookQuotes` with book title).
2. **`services/bookQuotes/`** — create, **update**, list APIs used by reader and notebook (no Readium inside).
3. **Reader** — user can select text and save a BookQuote; **edit** highlight scope in reader → **same `quote_id`**, new locator + snippet; **decorations** show existing quotes for open `bookId`; quotes still visible after back → reopen.
4. **Notebook** — all quotes listed (**list only**, no tap-through to reader in 006 — [Nefko Q1](#clarifications-for-nefko)).
5. **Data page** — shows stored quote rows (and other tables) for inspection.
6. **Regression** — **005** font-size acceptance still passes on same book after adding quotes; adding quotes does not break resume.
7. **Docs** — Update [Schema and paths](../01_PRD-and-Guidelines/4_Schema-and-Paths.md) with `book_quotes` and boundary note; link this ticket.

**Explicitly out of scope**

- Annotation, tags, **persisted** highlight colors, organization, share, home reminders, AI retrieval
- Delete quote, reset progress, remove file, remove book / nuclear library delete ([BookID](../01_PRD-and-Guidelines/5_BookID.md))
- Import dedupe, `content_hash`, catalog / Standard Epub ids, cross-user matching
- TOC, multi-color systems, notebook search/sort/filters
- iOS-first polish, store release
- Automated tests / CI (deferred)

---

## Readium spike (Step 0 — block if unsupported)

Before schema UI work, confirm in **`react-native-readium`** (current app version):

- How **text selection** is surfaced (props, ref, or callbacks on `ReadiumView`).
- How to **add/list/remove decorations** (or equivalent) from saved locators.
- Whether **selected text** is available for `snippet` on **create and edit**.
- Whether user can **change the scope** of an existing highlight in the reader (handles, drag, or equivalent) and how that maps to a stable decoration ↔ **`quote_id`**.

**Gate:** If selection text is unavailable, **do not ship** 006. If in-reader edit is not supported by Readium without substantial native work, record in **Implementation notes** and agree a fallback with Nefko (default: **edit in reader is required** for close).

---

## Proposed steps

### Step A — Spike + schema

- Readium selection/decoration spike on device or emulator.
- Migration + `schema.ts` + `db/bookQuotes.ts` (or split if needed).
- `services/bookQuotes/` create, update, list.

### Step B — Reader: load decorations

- On publication ready for `bookId`, load quotes → map to Readium decoration format in **`services/reader/`**.
- Extend `ReaderSurface` props only as needed (callbacks/refs stay in services layer).

### Step C — Reader: create + update quote

- **Create:** selection → `createBookQuote({ bookId, locatorJson, snippet })` → refresh decorations.
- **Update:** when user changes scope of an existing highlight → `updateBookQuote({ quoteId, locatorJson, snippet })` → refresh decorations. Decoration layer must carry **`quote_id`** (or equivalent mapping) so edit targets one row.
- Minimal chrome so create (and edit, if not gesture-only) is obvious in dogfood.

### Step D — Notebook feature

- `features/notebook/NotebookScreen.tsx` + route.
- Library link “Notebook” (product string).
- `useBookQuotesList` or similar calling `listAllBookQuotes`.

### Step E — Data page

- `features/dev/` or `features/data/` screen + route.
- Library dev/dogfood entry “View stored data”.
- Raw `JSON.stringify` / monospace list acceptable.

### Step F — Device acceptance

- Imported book: highlight two passages → notebook shows both → reader shows both → change font tier (**005**) → quotes still roughly anchored; resume OK.
- Data page shows expected rows.
- Record results in **Implementation notes**.

---

## Acceptance spike (physical Android)

1. Open imported book; highlight a sentence; note **`quote_id`**, snippet, and locator in data page.
2. Back to library → **Notebook** → same snippet + title.
3. Reopen book → highlight visible.
4. **Edit highlight in reader** (wider/narrower selection) → **same `quote_id`** in data page; **snippet** and **locator_json** changed; **`updated_at`** newer than **`created_at`**; Notebook shows new snippet after visit/refresh.
5. Second highlight (non-overlapping) → notebook shows **2 rows**, two `quote_id`s.
6. **Medium → Large → Medium** with quotes present → reading position acceptable; quotes still visible (exact pixel match not required).
7. Smoke book: optional quote if selection works.

---

## Technical boundaries

| Layer | Responsibility |
|-------|----------------|
| `db/` | `book_quotes` migration, typed queries |
| `services/bookQuotes/` | Create, **update**, list by book, list all (+ join metadata for notebook) |
| `services/reader/` | Readium selection, decoration mapping, `ReaderSurface` wiring |
| `features/reader/` | Trigger create flow; no direct SQLite |
| `features/notebook/` | List UI only |
| `features/library/` | Links to Notebook + data page |
| `features/*` | **No** `react-native-readium` import |

---

## Design philosophy

**Consistent with [Design Philosophy](../01_PRD-and-Guidelines/2_Design-Philosophy.md)**

- BookQuote logic in **`services/`** + **`db/`**; thin features.
- Shared shell UI (`Screen`, `AppText`, tokens) for Notebook and data page.
- Small modules: decoration mapper separate from SQLite accessors.

**Consistent with [BookQuotes PRD](../01_PRD-and-Guidelines/6_BookQuotes.md)**

- Quote visible **inside and outside** reader in 006.
- Structure allows later color/tags/annotation **on the row**, not in reader-only state.

**Inconsistent / temporary debt (acceptable in 006)**

- Single undifferentiated highlight color in reader (not stored).
- Notebook is a flat list only.
- Data page is intentionally ugly.
- Snippet/edit behavior depends on Readium selection + decoration APIs.
- No **delete** quote; no notebook-side edit.

**Later alignment ([BookID](../01_PRD-and-Guidelines/5_BookID.md), not built here)**

- Per-artifact delete, reset progress, file-off vs nuclear delete.
- Re-import matching and shared catalog ids.

---

## Clarifications for Nefko

*Question 1:*
Should Notebook rows **tap through** to the reader for that `bookId` in 006, or is list-only enough for this ticket?
*Answer:*
No, it just lists the quote. 
(this will be complicated because changing the location in the reader is tricky. We'll have to think deeply about it later).

*Question 2:*
Should the **data page** be **dev-only** (`__DEV__` / hidden in release builds) or always reachable from Library for now?
*Answer:*
No, it will ultimately be visible to end users. Later on, we'll think about the IA (information architecture) layout and location of this. For now, just put a button and a page. It should be its own "Feature" folder in our components. But it will always be visible to the user. 

*Question 3:*
If Readium cannot provide **selection text**, is a v1 with **locator-only** quotes (empty snippet) acceptable for ship, or should we block until snippet works?
*Answer:*
It is absolutely critical that we can pull the **snippet** from **selection text** in this ticket. Locator is critical, but locator-only is not viable. **Locked.**

| # | Item | Status |
|---|------|--------|
| 1 | Notebook list-only (no tap-through) | **Locked** |
| 2 | Data page user-visible; `features/data/` | **Locked** |
| 3 | Snippet required; no locator-only ship | **Locked** |
| 4 | In-reader highlight edit → same `quote_id` | **Locked** (acceptance spike #4) |

---

## Suggested follow-up tickets

| # | Title (draft) | Notes |
|---|----------------|--------|
| 007 | Remove book / file-off-device | Was “006” in **004**/**005** follow-ups; scope per [BookID](../01_PRD-and-Guidelines/5_BookID.md) |
| — | BookQuote delete + colors | Columns / UI per [BookQuotes](../01_PRD-and-Guidelines/6_BookQuotes.md) |
| — | Book matching / `content_hash` | [BookID](../01_PRD-and-Guidelines/5_BookID.md) |

---

## Implementation notes

**Readium (v5.3.0) — Step 0 gate passed in types/docs:**

- **Create:** `selectionActions` + `onSelectionAction` → `SelectionActionEvent` includes `locator` and **`selectedText`** (snippet gate).
- **Decorations:** `decorations: DecorationGroup[]` on `ReadiumView`; group name `bookmite-highlights`; decoration `id` = `quote_id`.
- **Edit:** `onDecorationActivated` sets active `quote_id`; user adjusts selection and picks **Highlight** again → `updateBookQuote` (same row). Banner + Cancel in reader chrome for dogfood.

**App wiring:**

- Migration `0003_sweet_ghost_rider`; `db/bookQuotes.ts`, `services/bookQuotes/`, `services/reader/bookQuoteDecorations.ts`, `useReaderBookQuotes`.
- Routes `/notebook`, `/data`; Library buttons (user-visible data page per Q2).

**Device acceptance:** Not run in this session — validate on physical Android per **Acceptance spike** before commit.

**Selection handle jitter (post-dogfood, open):** On Android paginated EPUB, dragging selection handles can flash/jump — reported upstream (Readium [#746](https://github.com/readium/kotlin-toolkit/issues/746), Chromium). App-side attempts (decoration latch, `ReaderSurface` memo, full-bleed chrome, pause progress during selection) did **not** resolve it for Nefko. **Reverted** experimental `scroll: true` default — that was a product/IA change, not an approved fix. **Next (needs ticket/PRD):** toolkit/version bump, optional user-facing scroll mode, highlight flow that minimizes handle adjustment, and/or tracking upstream.