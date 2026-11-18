---
Status: done
Tags: readium, sqlite, drizzle, locator, progress
---
# Ticket 002 — Reader adapter + persistent reading position (smoke `bookId`)

**Status:** Done  
**Phase:** 0.2 — Read a book  
**Created:** 2026-11-17  

## Metadata

| Field | Value |
|-------|--------|
| Commit | _(none yet)_ |
| Depends on | [001 — Mobile foundation](./001_Mobile-scaffold-and-Readium-dev-build.md) |
| Unblocks | Full `books` schema (003), copy-on-import + library list (004), highlight persistence (later) |

---

## Summary

Extend the **permanent** reader stack so a stable **`bookId`** opens an epub through `services/`, and **Readium locator JSON** is saved to **SQLite (expo-sqlite + Drizzle)** with debounced writes. Dogfood on the **smoke fixture** using the same IDs and APIs that imported library books will use later.

This ticket delivers the **first real schema migration** (small on purpose): one table for reading position. It also thickens the reader adapter (resolve book → open file + `initialLocation`, observe `onLocationChange`, persist). No document picker, no library DB rows beyond what smoke needs implicitly.

**Why now:** 001 proved render + pagination. Resume is the next riskiest reading behavior (locator round-trip, timing with `ReadiumView`, DB on device). Import and full `books` metadata land once this path is stable.

---

## Decisions (locked before implementation)

| Topic | Decision |
|-------|----------|
| **Identity** | Route and persistence use **`bookId`** (string), not `fixture`. Smoke uses a fixed id: `fixture.smoke` (constant in `services/`). |
| **Open path** | `services/reader` exposes **`resolveBookFile(bookId)`** → `{ url, initialLocation? }`. Fixture map stays internal; 004 adds library paths without changing the feature contract. |
| **Locator format** | Persist **Readium `Locator` as JSON** (`TEXT` column). Serialize/deserialize in `db/` or a thin `services/readingProgress` helper — not in `features/reader/`. |
| **SQLite scope (002)** | **Migration 0001:** `reading_progress` only (`book_id` PK, `locator_json`, `updated_at`). **No** full library `books` table until **003** (avoids duplicating import metadata work). |
| **Stack** | **expo-sqlite** + **Drizzle** + versioned migrations under `src/db/`. Run migrations on app startup (or first DB access) before reader open. |
| **Save policy** | Debounced save on `onLocationChange` (default **500 ms**; tune in implementation notes if needed). Flush on unmount / leaving reader when possible. |
| **Resume policy** | Pass saved locator via **`file.initialLocation`** on open (per `react-native-readium` `ReadiumFile`). Do not rely on route-only state. |
| **Devices** | Same as 001: validate on **emulator** and **physical Android** before close. |
| **UX** | Infrastructure ticket — no progress % UI, no “continue reading” card, no settings. Dev may show `bookId` in toolbar caption (replace fixture label). |

---

## Goals (acceptance)

1. **Dependencies:** `expo-sqlite`, `drizzle-orm`, migration tooling documented in **Implementation notes** (e.g. `drizzle-kit` dev dependency + generate/migrate script pattern).
2. **`src/db/`** is real (not stub):
   - Schema for `reading_progress`
   - Migration **0001** committed in repo
   - Typed query helpers: `getReadingProgress(bookId)`, `upsertReadingProgress(bookId, locator)`
3. **Reader adapter (`services/reader/`):**
   - `resolveBookFile(bookId)` for at least `fixture.smoke`
   - Loads saved locator before building `ReadiumFile`
   - `ReaderSurface` / session hook wires `onLocationChange` → debounced persist
   - **`features/reader/` still does not import `react-native-readium`**
4. **Navigation:** Library dev control opens reader with **`bookId=fixture.smoke`** (query param). Reader screen uses `bookId` param (retire `fixture` param).
5. **Smoke acceptance:**
   - Open smoke → turn several pages → back to library → open smoke again → **opens near last position** (same chapter/location, not necessarily pixel-identical on first frame).
   - Force-quit app → reopen → same resume behavior.
   - No crash on emulator or physical device during the above.
6. **Architecture doc:** If schema or adapter boundaries change materially, note in ticket; user can update [Architecture](../01_PRD-and-Guidelines/3_Architecture-and-Dependencies.md) when 003 lands (optional small pointer in 002 implementation notes only).

**Explicitly out of scope**

- `books` table, titles, import paths, `fileOnDevice`
- Document picker / copy-on-import
- TOC navigation UI, `goTo` from UI controls beyond resume
- Font / theme / dyslexic font (locator should still be valid later; no font toggle test required here)
- Highlights table or decorations
- iOS-specific work beyond “should not regress” if someone builds
- Polished reader chrome, progress percentage, sync/backup

---

## Proposed steps

### Step A — SQLite + Drizzle bootstrap

- Add `expo-sqlite` + Drizzle; configure `src/db/client.ts` (or equivalent).
- Establish `src/db/migrations/` (or Drizzle convention) and run migrations on startup.
- Remove or replace `dbNotImplemented` stub export.

### Step B — Schema 0001 (`reading_progress`)

- Columns (suggested):
  - `book_id` — `TEXT` PRIMARY KEY
  - `locator_json` — `TEXT` NOT NULL
  - `updated_at` — integer epoch ms
- No foreign key to `books` yet (003).

### Step C — `bookId` resolution

- Introduce `fixture.smoke` constant + mapping to bundled smoke epub (today’s `resolveFixtureFile` logic moves under `resolveBookFile`).
- Unknown `bookId` → clear error state on reader screen.

### Step D — Persist + resume loop

- On open: `getReadingProgress(bookId)` → parse JSON to `Locator` → `initialLocation` on `ReadiumFile`.
- On `onLocationChange`: debounce → `upsertReadingProgress`.
- Handle parse errors (corrupt row): log/delete row and open at start (document in implementation notes).

### Step E — Wire features

- `LibraryScreen`: navigate with `bookId` (dev smoke button).
- `ReaderScreen`: param `bookId`; delegate load/save to `services/` (hook such as `useReaderBookSession` acceptable if kept small).

### Step F — Device verification

- Repeat smoke acceptance on AVD + physical device; record in **Implementation notes**.

**Ticket closes** after Step F passes.

---

## Suggested follow-up tickets

| # | Title (draft) | Notes |
|---|----------------|--------|
| 003 | SQLite `books` table v1 + Drizzle | Metadata, `fileOnDevice`, FK from `reading_progress` optional |
| 004 | Copy-on-import + library list | Picker, app storage, list UI; same `bookId` → reader |
| 005 | Reader preferences + locator after resize | Font/theme spike; verify locator survives reflow |

---

## Design philosophy

**Consistent with [Design Philosophy](../01_PRD-and-Guidelines/2_Design-Philosophy.md)**

- Logic in `services/` and `db/`; reader feature stays thin.
- Readium only under `services/reader/`.
- Small modules; split if reader session hook grows past ~150 lines.
- expo-sqlite + Drizzle — industry-standard, FOSS, aligned with architecture.
- Real migrations from first table, not ad-hoc `CREATE TABLE` at runtime only.

**Inconsistent / temporary debt (acceptable in 002)**

- `reading_progress` rows without `books` parent rows — smoke `bookId` is conventional only until 003.
- Fixture-only resolution inside `resolveBookFile` — library branch added in 004.
- Minimal toolbar (back + optional dev `bookId` label); no user-facing “resume” messaging.
- Debounce interval and corrupt-row policy are pragmatic defaults, not product decisions.

---

## Clarifications for Nefko

_(None required for implementation — infrastructure defaults above are sufficient. If something changes during build, record the decision under **Implementation notes** instead of blocking.)_

---

## Implementation notes

_(Fill in during/after implementation.)_

**Versions:**

- expo-sqlite: ~57.0.5 (Expo SDK 57)
- drizzle-orm: ^0.45.4 / drizzle-kit: ^0.31.11

**Migration 0001:**

- Path: `src/db/drizzle/0000_black_raider.sql` (+ `migrations.js` journal bundle for Metro)
- Applied how: `DbProvider` in `app/_layout.tsx` via `useMigrations` from `drizzle-orm/expo-sqlite/migrator`

**Debounce / edge cases:**

- Interval ms: 500; flush pending locator on reader unmount
- Corrupt `locator_json`: parse failure in `locatorStorage.ts` → `deleteReadingProgress` → open at start

**Smoke — resume (emulator):**

- Result: Not verified for 002 (emulator pagination too poor for dogfood; resume validated on device instead).
- AVD: Pixel_8 arm64 available; Pixel_2 x86 unusable on M3.

**Smoke — resume (physical device):**

- Result: **Pass** — resume after back + reopen and after force-quit (per Nefko).
- Device: Asus Zenfone 8 (ASUS_I006D), Android 13, `M4AIB761F543SNP`.

**Deviations from plan and why:**

- Drizzle generated migration tag `0000_black_raider` (equivalent to planned 0001).
- **`org.gradle.java.home`** pinned to Temurin 17 in `android/gradle.properties` after JDK 25 CMake failures; **`JAVA_HOME` in `~/.zshrc`** added for shell/launcher alignment.
- Native rebuild required after `expo-sqlite`; `expo start --dev-client` alone insufficient until `expo run:android` on phone.

---

## What to do (runbook)

Work top to bottom. Check boxes as you go.

### Step A — DB bootstrap

- [x] Add expo-sqlite + Drizzle + migration wiring
- [x] App starts; migration 0001 applies cleanly on fresh install

### Step B — Schema

- [x] `reading_progress` table + typed helpers

### Step C — bookId + resolve

- [x] `fixture.smoke` opens smoke epub via `resolveBookFile`

### Step D — Persist / resume

- [x] Debounced save on page turns
- [x] Reopen restores via `initialLocation`

### Step E — Features

- [x] Library → reader uses `bookId`
- [x] `fixture` route param removed or unsupported

### Step F — Devices

- [ ] Emulator: open → read → back → reopen → resume; kill app → resume _(skipped — poor pagination UX)_
- [x] Physical device: same

**Where you are now:**

- **Ticket closed.** Resume on smoke `bookId` works on physical Android. Next up: draft **003** (`books` table) per suggested follow-ups.