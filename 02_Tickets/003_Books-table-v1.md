---
Status: done
Tags: sqlite, drizzle, books, schema, library
Version: kyle-readium-experiment
---

*NOTE: this was from an early version when Kyle was trying to do a build with Readium. We ended up pulling the plug on this in Ticket 007*

# Ticket 003 — SQLite `books` table v1 + smoke seed

**Status:** Done  
**Phase:** 0.2 — Read a book  
**Created:** 2026-11-17  

## Metadata

| Field | Value |
|-------|--------|
| Commit | _(none yet)_ |
| Depends on | [002 — Reader adapter + persistent reading position](./002_Persistent-Location.md) |
| Unblocks | Copy-on-import + library list (004, not drafted yet), highlight persistence (later), “missing file” UX |

---

## Summary

Introduce the **`books`** table in SQLite (expo-sqlite + Drizzle) so every **`bookId`** the app opens has a **durable library record**: display metadata, where the epub bytes live, and whether the **file is on device** (`fileOnDevice`). Seed one row for the existing smoke dev path (`fixture.smoke`). Refactor **`resolveBookFile`** to resolve opens from the **book record** (bundled fixture vs on-disk path), not from a hardcoded in-memory map alone.

This ticket is **schema + services + adapter wiring**. It does **not** add import, a real library list, or delete flows—that is **004+**. After 003, every `reading_progress` row must have a matching `books` parent (**SQLite FK, `ON DELETE RESTRICT`**).

**Why now:** 002 proved locator round-trip on a conventional `bookId`. Import and list UI need a stable book model and path rules before we copy files and show titles. Doing schema first avoids baking import-specific columns twice.

---

## Decisions (locked before implementation)

| Topic | Decision |
|-------|-----------|
| **Identity** | Same **`bookId` string** as 002 (`reading_progress.book_id` = `books.book_id`). Smoke id stays `fixture.smoke`. |
| **Migration** | **0001** (next after `0000_black_raider`): create `books`; do **not** drop/recreate `reading_progress`. |
| **Book kinds (v1)** | `kind` `TEXT` NOT NULL: `bundled_fixture` \| `imported`. Only smoke is `bundled_fixture` in this ticket. |
| **Bundled opens** | For `bundled_fixture`, store `fixture_key` (e.g. `smoke`) → existing `resolveBundledEpub(fixtureKey)`. `library_relative_path` NULL. `file_on_device` = 1 (always readable). |
| **Imported paths** | **`library_relative_path`** TEXT (relative to library root, e.g. `epubs/{bookId}.epub`). Not an absolute URI in SQLite. **`file_on_device`** 0 \| 1. When 0, path may remain (re-download slot); open fails until bytes exist. 004 copies into tree under `getLibraryEpubRoot()`. |
| **Imported opens (prep only)** | No `imported` rows in 003 except schema/resolver. Open path: `join(getLibraryEpubRoot(), library_relative_path)` → `file://` for Readium. |
| **Metadata (v1 columns)** | `title` NOT NULL. Smoke: fixed label **“Smoke fixture”** (no OPF read in 003). `author` nullable for smoke (NULL). Real metadata at **import (004)**. |
| **Timestamps** | `added_at`, `updated_at` — integer epoch ms (match `reading_progress.updated_at` style). |
| **FK to progress** | **Yes.** Migration 0001 adds `FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE RESTRICT` on `reading_progress`. Create + seed `books` (smoke) **before** enabling FK. Progress/highlights are precious; accidental `DELETE FROM books` must not orphan artifacts. |
| **File off device** | **`file_on_device` / path changes only** on the book record. Does **not** delete `reading_progress` (or future highlight rows). Matches PRD. |
| **Remove book entirely (later)** | Out of scope in 003. **RESTRICT** means full removal is an **explicit, deliberate** flow (later ticket): delete artifacts in a transaction, then delete the book—not one-tap easy delete. |
| **Pre-release DBs** | No real user library data before import/delete UX ships. Dev/test progress may be wiped (clear app storage) if a migration fails on orphans; no special backfill program required beyond seeding smoke. |
| **Seeding smoke** | **`INSERT` in migration 0001 SQL** (Option A). Same migration, after `CREATE books`, **before** FK on `reading_progress`. Fixed literals (`fixture.smoke`, `bundled_fixture`, `smoke`, title **“Smoke fixture”**). No app startup seed for smoke. |
| **Library root** | Implement **`getLibraryEpubRoot()`** in `services/` (e.g. Expo `documentDirectory` + fixed subfolder `epubs/`). Document path convention in code comment; 004 copies into this tree. No user import in 003. |
| **UX** | Infrastructure ticket — no library list. Optional dev-only: reader toolbar shows **title from DB** instead of raw `bookId`. |
| **Devices** | Schema + smoke open/resume on **physical Android** (same bar as 002); emulator smoke optional. |

---

## Goals (acceptance)

1. **Drizzle schema** — `books` table in `src/db/schema.ts` with types exported.
2. **Migration 0001** — committed under `src/db/drizzle/`; applies on startup with existing migrator.
3. **DB helpers** — e.g. `getBook(bookId)`, `upsertBook(...)` (for **004 import**, not smoke seed), `listBooks()` if trivial (may be unused until 004).
4. **Smoke seed** — migration SQL leaves `fixture.smoke` in place after 0001: `kind = bundled_fixture`, `fixture_key = smoke`, title **“Smoke fixture”**.
5. **Reader adapter** — `resolveBookFile(bookId)`:
   - Loads book from DB; unknown id → clear error (same as today).
   - Resolves URL from `kind` + `fixture_key`, or `library_relative_path` + `getLibraryEpubRoot()` + `file_on_device`.
   - Still loads `initialLocation` via existing progress path.
6. **Regression** — Smoke flow: library dev control → read → back → reopen → **resume still works**; existing `reading_progress` row for `fixture.smoke` intact.
7. **`getLibraryEpubRoot()`** exists; imported open logic lives in `services/reader/` (not `db/`).
8. **Boundaries** — `features/reader/` still no Readium import; book lookup in `db/` + `services/reader/` only.

**Explicitly out of scope**

- Document picker, copy-on-import, creating `imported` rows from user action
- Library list UI, search, sort, cover images
- Delete book UI, remove-file UX, highlight cascade (003 only adds **RESTRICT** FK + schema; behavior in **006**)
- Highlights, notes, settings tables
- OPF metadata extraction pipeline (unless explicitly pulled into 003 via clarification)
- iOS-specific work beyond non-regression
- Architecture doc full rewrite (short pointer in implementation notes; user may update [Architecture](../01_PRD-and-Guidelines/3_Architecture-and-Dependencies.md) on commit)

---

## Proposed steps

### Step A — Schema design + migration 0001

- Add `books` table (columns per decisions; names snake_case in SQL, camelCase in Drizzle).
- Same migration (or ordered steps in 0001): seed `fixture.smoke`, then attach FK on `reading_progress` with **RESTRICT**. (SQLite may require table rebuild to add FK—use Drizzle-generated pattern, not hand-waved `ALTER`.)
- Generate migration; verify journal/snapshot; run on **fresh install**; dev upgrade: reinstall or clear app data if orphan progress blocks FK.

### Step B — Query helpers

- `src/db/books.ts` (or split if tiny): get by id, list all, upsert for import (004).
- Keep files small; no god-module.

### Step C — Smoke seed (SQL only)

- `INSERT` for `fixture.smoke` lives in **0001** (with Step A), not in `DbProvider`.
- Order: `CREATE books` → seed INSERT → FK on `reading_progress`.

### Step D — `resolveBookFile` refactor

- Replace / narrow `bookToFixture` map: DB is source of truth for which ids exist; fixture key only on bundled rows.
- **`imported`:** `resolveImportedEpubPath(relative)` (or inline in resolver) = join `getLibraryEpubRoot()` + `library_relative_path`; optional existence check before open.
- Handle `file_on_device = 0` with clear error (“file not on device”)—no UI yet.

### Step E — Thin feature touch (optional)

- Reader dev caption: `title` from `getBook` if cheap.
- Library unchanged except maybe comment linking to 004.

### Step F — Verification

- Physical device: smoke open + resume after 003 migrate on a device that already has 002 progress (upgrade path).
- Fresh install: migrate → seed → open smoke → save progress → resume.

**Ticket closes** after Step F passes.

---

## Suggested follow-up tickets

| # | Title (draft) | Notes |
|---|----------------|--------|
| 004 | Copy-on-import + library list | Picker, copy under `getLibraryEpubRoot()`, set `library_relative_path` + `imported` rows, list UI |
| 005 | Reader preferences + locator after resize | Font/theme; verify locator survives reflow |
| 006 | Remove book / file-off-device | `fileOnDevice` without deleting artifacts; **remove entirely** = explicit multi-step tx (progress/highlights, then `books`) because FK is RESTRICT |

---

## Design philosophy

**Consistent with [Design Philosophy](../01_PRD-and-Guidelines/2_Design-Philosophy.md)**

- Book records in `db/`; open resolution in `services/reader/`; features stay thin.
- Small modules (`books.ts`, resolver changes) rather than expanding reader feature files.
- Versioned migration for `books`, not runtime-only DDL.
- Aligns with architecture: **book record** separate from **user artifacts** (`reading_progress`).

**Inconsistent / temporary debt (acceptable in 003)**

- Smoke book is a **bundled fixture row**, not a user import—special `kind` until library is all imported epubs in production UX.
- `listBooks()` may exist without UI consumer (dead code briefly, or dev-only log).
- Title/author for imports still placeholder until 004 metadata extraction.
- Hardcoded smoke title in seed vs epub-derived metadata.

---

## Clarifications for Nefko

_(Lock answers in **Decisions** before implementation.)_

*Question 1:*
Should migration **0001** add a real SQLite **FOREIGN KEY** from `reading_progress.book_id` → `books.book_id`, or keep them logically linked only until we define delete/cascade rules in a later ticket?

*Answer:*
**Real FK, `ON DELETE RESTRICT`.** File-off-device is metadata-only on `books`; progress stays. Full book removal should be hard (not casual): later ticket implements explicit delete of artifacts, then book. Pre-release DBs are dev-only—clear app data if needed; no orphan-backfill obligation.

*Question 2:*
For the smoke seed row, is a fixed title (e.g. “Smoke fixture”) enough, or should 003 **read title from the bundled epub** once at seed time (small metadata spike)?

*Answer:*
Fixed title is fine. 

*Question 3:*
Preferred seed mechanism: **`INSERT` in migration SQL** (always identical on every device) vs **app startup seed function** (easier to adjust copy without new migration)?

*Answer:*
**Option A — migration SQL.** Smoke row ships inside 0001 before FK enforcement; no startup seed. Changing smoke fixture metadata later = new migration (acceptable for dev-only row).

*Question 4:*
For `imported` books in 004, confirm path shape: single **`epub_path`** column (absolute file URI/path) + **`file_on_device`**, or split **`library_relative_path`** + root helper only?

*Answer:*
**Option 2 — `library_relative_path` + `getLibraryEpubRoot()`.** DB stores path relative to app library root; resolver joins to absolute `file://`. Bundled smoke keeps `fixture_key`, `library_relative_path` NULL.

---

## Implementation notes

_(Fill in during/after implementation.)_

**Migration 0001:**

- Path: `src/db/drizzle/0001_happy_nitro.sql` (+ `migrations.js` `m0001`)
- Seed SQL: `INSERT` for `fixture.smoke` after `CREATE books`, before `reading_progress` FK rebuild.

**FK / dev DBs:**

- `PRAGMA foreign_keys = ON` in `src/db/client.ts` on open.
- Upgrade from 002 without smoke parent: ensure progress is only `fixture.smoke` or clear app storage before migrate.

**Versions:**

- `expo-file-system`: ~57.0.7 (legacy `documentDirectory` / `getInfoAsync` for library root)

**Deviations from plan and why:**

- Expo SDK 57 file API: `expo-file-system/legacy` for `getLibraryEpubRoot()` and existence check (new `Paths` API deferred).

**Device smoke (003):**

- Result: **Pass** — smoke open + resume after migration (per Nefko).
- Device: physical Android (same dev phone as 002).

---

## What to do (runbook)

Work top to bottom. Check boxes as you go.

### Step A — Schema

- [x] `books` in Drizzle schema
- [x] Migration 0001 generated and bundled

### Step B — Helpers

- [x] `getBook` / `upsertBook` (and `listBooks` if included)

### Step C — Seed

- [x] `fixture.smoke` present after migrate (SQL in 0001)

### Step D — Resolver + library root

- [x] `getLibraryEpubRoot()` in `services/library/`
- [x] `resolveBookFile` uses DB
- [x] Bundled + imported (`join` relative path) branches

### Step E — UI (optional)

- [x] Dev title in reader toolbar (shows DB title when ready)

### Step F — Devices

- [x] Physical Android: upgrade path + resume
- [x] Fresh install / migrate: smoke + resume (validated with on-device dogfood)

**Where you are now:**

- **Ticket closed.** `books` + smoke seed + FK + DB-backed `resolveBookFile`. Next: draft **004** (copy-on-import + library list).