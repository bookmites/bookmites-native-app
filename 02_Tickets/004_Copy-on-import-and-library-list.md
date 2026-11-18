---
Status: done
Tags: import, library, document-picker, copy-on-import, metadata
---
# Ticket 004 — Copy-on-import + library list

**Status:** Done  
**Phase:** 0.2 — Read a book  
**Created:** 2026-11-17  

## Metadata

| Field | Value |
|-------|--------|
| Commit | _(none yet)_ |
| Depends on | [003 — SQLite `books` table v1 + smoke seed](./003_Books-table-v1.md) |
| Unblocks | Reader prefs / locator after resize (005, draft), remove book / file-off (006), highlight persistence (later) |

---

## Summary

Let a user **add an epub from the device** (system document picker), **copy it into app-private storage**, create an **`imported`** row in **`books`** (title/author from the epub when possible), and show **all library rows** on the Library screen. Tapping a row opens the existing reader route with the same **`bookId`** contract as smoke and import.

This ticket is **import pipeline + list UI**. It does **not** add delete/remove-file, dedupe-by-hash, covers, search/sort, progress % on the list, or highlight storage. **`resolveBookFile`** and the **`books`** schema from **003** stay as-is except for wiring new callers.

**Why now:** **003** made SQLite the source of truth for opens, relative paths, and `upsertBook` / `listBooks`. Phase 0.2 product goal “upload a book and read it” needs picker + copy + a real library surface before polish tickets (fonts, remove-file, highlights).

**Living contracts:** [Schema and paths](../01_PRD-and-Guidelines/4_Schema-and-Paths.md) (paths, `kind`, copy-on-import); [Architecture — import policy](../01_PRD-and-Guidelines/3_Architecture-and-Dependencies.md).

---

## Decisions (locked before implementation)

| Topic | Decision |
|-------|----------|
| **Import policy** | **Copy on import** only. Picker returns a content URI; app copies bytes into **`getLibraryEpubRoot()`** and never stores the source URI in SQLite. |
| **`bookId` on import** | New **random UUID** per import (`expo-crypto` **`randomUUID()`** or equivalent). Assigned **before** copy so the destination filename is stable. Not derived from title or file hash (**dedupe later**). |
| **Relative path shape** | **`{bookId}.epub`** stored in **`library_relative_path`** (filename only; root is already `…/documentDirectory/epubs/`). No extra `epubs/` segment in the column. |
| **Copy order of operations** | (1) Generate `bookId`. (2) Copy picker URI → `join(getLibraryEpubRoot(), relativePath)`. (3) Extract metadata from **our copy**. (4) **`upsertBook`** with `kind = imported`, `file_on_device = 1`, `fixture_key` NULL. (5) Refresh library UI. On failure after partial copy: delete destination file if created; **no** `books` row. |
| **Picker** | **`expo-document-picker`**; single file; MIME filter **`application/epub+zip`** (allow `*/*` fallback only if Android picker ignores MIME — document in implementation notes). |
| **Metadata v1** | Read **`dc:title`** and first **`dc:creator`** (or `dc:contributor`) from package OPF on the **copied** file. **Fallback title:** sanitized original filename without `.epub` extension. **Fallback author:** `NULL`. Failed parse must not block import. |
| **Metadata implementation** | Small module under **`services/`** (e.g. `services/epub/readEpubPackageMetadata.ts`): unzip enough to read `META-INF/container.xml` + content OPF; pure JS deps acceptable if SDK-aligned (e.g. `fflate` + lightweight XML). No Readium call from import path. |
| **Library list data** | All **`books`** rows shown (including smoke). **Sort:** `bundled_fixture` first (smoke at top), then **`imported`** by title A→Z. Show **title**; **author** when non-null (muted secondary line). |
| **Smoke / bundled rows** | Smoke row **in the list** as the first entry (“Smoke fixture”). Keep **dev-only “Open smoke book”** button as redundant shortcut until a later ticket removes it. |
| **Open from list** | `router.push({ pathname: "/reader", params: { bookId } })` — same as today. |
| **After import** | **No** navigation to reader. User returns to Library; refresh list only ([Nefko Q1]). |
| **Errors** | User-visible message for picker cancel (silent), copy failure, non-epub/wrong type, and missing file on open (already in resolver). No crash; use existing `AppText` / patterns. |
| **Schema migration** | **None** for 004 — `books` columns are sufficient. |
| **Devices** | Validate import + open + resume on **physical Android** (same bar as 002–003). Emulator optional. |
| **Boundaries** | Picker, copy, metadata, and `importBookFromDocument` in **`services/library/`** (or `services/epub/` for parse-only). **`features/library/`** = UI + hook that calls service and `listBooks`. **`db/`** = `upsertBook` / `listBooks` only. **No** Readium import in features. |

---

## Goals (acceptance)

1. **`expo-document-picker`** added via `npx expo install` and works in **dev client** (rebuild if native module added).
2. **`importBookFromDocument`** (name may vary): picker → copy → metadata → `upsertBook`; returns `bookId` or structured error.
3. **Filesystem:** Imported bytes live at `{getLibraryEpubRoot()}{bookId}.epub`; matches **`resolveImportedEpubPath`** / **`importedEpubExists`**.
4. **Library screen:** Lists all books from DB; **Add book** (or equivalent) runs import; tap row opens reader.
5. **Read path:** Imported book opens in Readium; location saves and **resume** works on second open (reuse **002** behavior).
6. **Regression:** Smoke book still opens and resumes; FK + `fixture.smoke` unchanged.
7. **Docs:** Update [Schema and paths](../01_PRD-and-Guidelines/4_Schema-and-Paths.md) — lock `bookId` generation, relative path pattern, metadata source; link this ticket.

**Explicitly out of scope**

- Remove book, remove file from device, `file_on_device = 0` UX (**006**)
- Duplicate import detection (hash / same file twice)
- Cover images, rich metadata (publisher, language), OPF series
- Library search, sort, filters, “continue reading” / progress %
- iOS-first polish (non-regression OK)
- EAS / store release
- Highlights, notes, settings persistence
- User choice “link vs copy” (architecture rejects for Phase 0.2)

---

## Proposed steps

### Step A — Dependencies + import service skeleton

- `npx expo install expo-document-picker` (and metadata deps if needed).
- `services/library/importBookFromDocument.ts` (or split copy vs orchestration if file grows).
- Unit-testable helpers: `destinationPathForImport(bookId)`, `copyPickerAssetToLibrary(uri, dest)`.

### Step B — Epub metadata reader

- `services/epub/readEpubPackageMetadata.ts` (or similar): input = absolute path to **our** epub; output `{ title, author? }`.
- Handle corrupt/odd epubs with filename fallback.

### Step C — DB row creation

- Call existing **`upsertBook`** with `BOOK_KINDS.imported`, `libraryRelativePath: \`${bookId}.epub\``, `fileOnDevice: true`.
- Do not insert until copy + metadata attempt completes (metadata failure still inserts with fallback title).

### Step D — Library UI

- Hook e.g. `useLibraryBooks()` — load `listBooks`, refresh after import.
- Replace placeholder empty state: list + add action; optional pull-to-refresh if cheap.
- Reuse **`Screen`**, **`AppText`**, **`Button`** from `components/ui/`.

### Step E — Wire + dev cleanup

- Keep **dev-only smoke button** alongside list row (remove in a later ticket).
- Export import + library helpers from `services/` barrel if project pattern requires.

### Step F — Verification

- Physical device: pick epub from Downloads (or file manager) → appears in list → open → read → back → reopen → resume.
- Fresh install: only smoke until import; after import, two rows.
- Failure: revoke mid-copy or pick non-epub → no orphan row; no crash.

**Ticket closes** after Step F passes.

---

## Suggested follow-up tickets

| # | Title (draft) | Notes |
|---|----------------|--------|
| 005 | Reader preferences + locator after resize | Font/theme; verify locator survives reflow |
| 006 | Remove book / file-off-device | `fileOnDevice` UX; RESTRICT-aware delete flow |
| — | Import dedupe by hash | Optional; architecture TBD |

---

## Design philosophy

**Consistent with [Design Philosophy](../01_PRD-and-Guidelines/2_Design-Philosophy.md)**

- Import and copy logic in **`services/`**; library feature stays thin (list + actions).
- Small focused modules (picker orchestration vs OPF parse vs UI hook), not a god `LibraryScreen`.
- Tokens and shared UI components; no raw color/spacing in feature styles.
- Copy-on-import supports **data sovereignty** and reliable opens (local bytes we control).
- Library list is utilitarian — titles, not marketing layout — aligns with avoiding the “infinite agora.”

**Inconsistent / temporary debt (acceptable in 004)**

- **No dedupe:** Same file imported twice = two UUIDs and two copies (disk waste until hash ticket).
- **Minimal metadata:** Title/author only; filename fallback may be ugly for some downloads.
- **Smoke in list + dev button:** Bundled smoke is first list row and still has a dev shortcut—intentional until smoke is removed from product UX.
- **Pure-JS epub unzip** for metadata only — separate from Readium’s full parser (intentional scope cut).

---

## Clarifications for Nefko

_(Answers locked in **Decisions** above.)_

*Question 1:*
After a successful import, should the app **navigate straight into the reader** for that `bookId`, or **stay on the library list** (current draft: stay on list)?

*Answer:*
No, do not navigate. User will return to the page that they launched the file picker from. 


*Question 2:*
Should **`bundled_fixture`** rows (smoke) appear in the user-facing library list, or should the list hide them and keep smoke only via a dev entry?

*Answer:*
It continues to appear. It is the first book on the books list. 

*Question 3:*
If OPF metadata is missing or unparsable, is **filename-based title** acceptable for v1, or do you want a blocking “Could not read book metadata” error?

*Answer:*
Use the file name based title as a fallback. 

*Question 4:*
Any preference on **`bookId` format** beyond random UUID (e.g. human-readable slug prefix `import.{uuid}` for log grep)?

*Answer:*
Prefer it to be a random string of letters/numbers. Human-readable formats are likely to lead to collisions. 

---

## Implementation notes

_(Fill in during/after implementation.)_

**Dependencies:**

- `expo-document-picker` ~57.0.3, `expo-crypto` ~57.0.4, `fflate` ^0.8.3 (`npx expo install` + npm).

**Copy API:**

- `expo-file-system/legacy`: `copyAsync`, `makeDirectoryAsync`, `deleteAsync`, `readAsStringAsync` (Base64 for OPF zip parse).

**New modules:**

- `services/library/importBookFromDocument.ts` — `pickAndImportBook`
- `services/epub/*` — OPF metadata from copied bytes
- `features/library/useLibraryBooks.ts`, `LibraryBookRow.tsx`

**Deviations from plan and why:**

- Import path uses `resolveImportedEpubPath` from reader services for DRY destination paths (same join rules as open).

**Native rebuild:**

- `expo-document-picker` requires dev client rebuild (`npx expo run:android`).

**Device smoke (004):**

- Result: **Pass** — import, open, resume; smoke regression OK (per Nefko).
- Device: physical Android

---

## What to do (runbook)

Work top to bottom. Check boxes as you go.

### Step A — Dependencies + import service

- [x] `expo-document-picker` installed; dev client rebuilt if needed
- [x] Import orchestration in `services/library/`

### Step B — Metadata

- [x] OPF title/author from copied epub + fallbacks

### Step C — Persist

- [x] `upsertBook` only after successful copy

### Step D — Library UI

- [x] List from `listBooks`; add-book action; navigate to reader on row tap

### Step E — Cleanup + exports

- [x] Dev smoke shortcut kept alongside smoke list row

### Step F — Devices

- [x] Physical Android: import + open + resume
- [x] Smoke regression

**Where you are now:**

- **Ticket closed.** Copy-on-import, OPF metadata, library list on physical Android.