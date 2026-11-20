---
Status: done
Tags: readium, preferences, font-size, reader-settings, locator
---
# Ticket 005 — Reader font size (global) + locator after resize

**Status:** Done  
**Phase:** 0.2 — Read a book  
**Created:** 2026-11-17  

## Metadata

| Field | Value |
|-------|--------|
| Commit | `d2b37150f44262de73e926e2d25d6909d4754fa4` |
| Depends on | [004 — Copy-on-import + library list](./004_Copy-on-import-and-library-list.md) |
| Unblocks | Dyslexic font / reader theme (later), highlight persistence (later) |
| Living contracts | [Schema and paths](../01_PRD-and-Guidelines/4_Schema-and-Paths.md) (locators + new prefs storage); [Architecture](../01_PRD-and-Guidelines/3_Architecture-and-Dependencies.md) |

---

## Summary

Add **global reader font size** (tier picker in a bottom **card modal**), wire **`preferences.fontSize`** into **`ReadiumView`** via the existing reader adapter, and **persist** the tier in SQLite. Primary product risk: **changing size must not lose reading position**—same logical place while reading, on back navigation, and after cold start.

This ticket is **font size only** (not font family, theme, TOC, or highlights).

**Why now:** **004** closed the import → open → resume loop. Phase 0.2 still requires adjustable reading text; architecture assumes **locator JSON** survives reflow—this ticket proves that on a real imported book.

---

## UI/UX experience

This ticket introduces our first **feature settings block** nested inside a **reusable UI modal**.

`ReaderSettings` is a block that controls reader settings. Eventually it will hold font size, contrast, density, light/dark, reader font, etc. **This ticket:** font size only.

`reader-font-size` defaults to **`Medium`**. Tiers:

| Size | Scale (vs Medium) |
|------|-------------------|
| `Small` | 0.85× Medium |
| `Medium` | 1× (Readium baseline for this ticket) |
| `Large` | 1.25× Medium |
| `XL` | 1.5× Medium |
| `2XL` | 1.75× Medium |

**Note:** **`ReaderSettings`** controls apply to the **epub engine** (Readium), not to library/toolbar chrome. Shell UI stays on **`design/tokens`** (see **Decisions — Shell vs `ReaderSettings`**).

**`CardModal`** (`components/ui/`): reusable bottom card.

- When opened: pinned to bottom of screen.
- Tap outside → close.
- Close (X) upper right → close.
- Does **not** auto-close when a tier is selected.

**`ReaderSettingsModal`:** `CardModal` + title “Reader Settings” + **`TextSizeBlock`** (one row of **`SelectButton`**s, one tier at a time).

**`SelectButton` / `SelectButtonRow`** (`components/ui/selectbutton/`): row supports single- or multi-select; this ticket is **single-select** only. States: selected / unselected.

**Live preview (reader only):** With modal open in the reader, changing tier updates epub text **immediately** (modal may stay open). Modal overlays the page that launched it.

**Entry points:**

1. **Library** — settings control (upper area) opens the same modal; changes apply on **next** book open (no live epub on library).
2. **Reader** — settings control in toolbar opens modal with live preview.

---

## Decisions (locked before implementation)

| Topic | Decision |
|-------|----------|
| **Scope of prefs** | **Global** reader font size (one tier for all books). Library and reader share the same modal and stored value. |
| **Persistence** | Selected tier (`small` … `2xl`) in **SQLite** (new migration). **Not** keyed by `bookId` in v1. |
| **Readium wire format** | Map tier → `preferences.fontSize` (`number`). **Medium = `1.0`** (Readium “normal”). Other tiers use the UX scale table (see **Small vs Medium** below). |
| **UI labels** | Tier buttons: **Small**, **Medium**, **Large**, **XL**, **`2XL`** (locked). |
| **Shell vs `ReaderSettings`** | **Locked.** App chrome (library, toolbar, modals, `SelectButton`s, all `AppText`) uses **`design/tokens`** — **never** tied to reader tier. Only settings inside **`ReaderSettings`** map to **Readium `preferences`** for **epub content** (size in 005; family, contrast, etc. later). |
| **No publication remount** | In reader, change tier by updating `preferences` on the mounted `ReadiumView`. Do **not** re-run `resolveBookFile` / full open for size alone. |
| **Progress writes** | Keep **002** debounced `onLocationChange` → `reading_progress`. Reflow may emit a new locator; persisting it is expected. |
| **Open order** | Load saved tier before first meaningful paint of epub where feasible (avoid flash at default then jump). |
| **Default for existing installs** | **Medium** when no row exists. |
| **Devices** | Validate on **physical Android** (same bar as **004**). |

### Shell vs `ReaderSettings` (locked)

| Layer | What the user sees | Styling / controls source |
|-------|--------------------|---------------------------|
| **Shell** | Library, reader toolbar, `ReaderSettingsModal` chrome, buttons, labels | **`design/tokens`** (`colors`, `spacing`, `typography` via `AppText` and UI components). **Including color in later tickets** — shell colors stay on tokens, not on reader tier or Readium theme. |
| **`ReaderSettings` blocks** | Controls that affect how the **book** renders (e.g. `TextSizeBlock` now; contrast, font, etc. later) | Persisted prefs → **`services/reader/`** → **Readium `preferences`** on **`ReadiumView`** only. |

**Rules:**

- Reader font **tier does not** change shell font size or layout scale.
- Modal **title** and **tier buttons** are shell UI (tokens), even though they *control* epub size.
- Later reader prefs (theme/contrast inside the book, dyslexic font, …) follow the same split: **`ReaderSettings`** → Readium; app chrome → tokens.

**Optional shell polish (still tokens):** e.g. a `settingLabel` variant for tap-friendly control labels — not Readium.

---

### Small vs Medium (product + implementation)

**Product intent (locked):** **Small** must look **noticeably smaller** than **Medium** on a real book. You should not need to pick internal numbers—that is implementation.

**Why this is in the ticket at all:** Readium does not know our button names. We send a **number**; **`1.0`** is their usual default. Your UX table says Small = **0.85×** Medium, which would be **`0.85`** if Medium = `1.0`. The Readium docs we ship with suggest `fontSize` often only goes down to **`1.0`**, so **`0.85` might be ignored** and Small could look the same as Medium until we verify.

**Implementation (Step E, not a Nefko choice):** On physical Android, if `0.85` does not shrink text, adjust the mapping (e.g. set Medium slightly above `1.0` so Small can be `1.0`, or use the smallest value Readium actually honors) until Small is visibly smaller than Medium. Record the final tier → number table in **Implementation notes** on the ticket.

---

## Reading position & font resize

**Principle:** [Schema — locators, not pixels](../01_PRD-and-Guidelines/4_Schema-and-Paths.md). Progress is **Readium locator JSON**, not scroll offset or page index.

**While reading:**

- User stays on the **same passage** after each tier change (no jump to start, root, or unrelated chapter).
- Font change must **not** delete `reading_progress` for the open `bookId`.
- Updated locators after reflow may be saved (debounced).

**After leave / cold start:**

- Reopen uses **`initialLocation`** from SQLite (**002**) **and** saved global tier.
- Resume passage matches last session; text renders at saved tier.

**Acceptance spike (physical device, imported book preferred):**

1. Read past first screen; note a distinctive sentence.
2. In reader modal: **Medium → Large → XL → Medium** without closing modal; sentence stays recognizable each time.
3. Library → reopen same book → same place, correct tier.
4. Change tier on **library** (no book open) → open book → tier applies; resume OK.
5. Force-quit app → reopen → tier + locator both restored.

**Failure:** wrong chapter after resize; cold start wrong place after in-session size change; tier not restored.

---

## Goals (acceptance)

1. SQLite migration + get/set **global** font size tier.
2. Tier → `preferences.fontSize` mapping module in **`services/reader/`** (single source of truth).
3. **`ReaderSurface` / session hook** passes `preferences` into `ReadiumView`; features do not import Readium.
4. **`ReaderSettingsModal`** + **`TextSizeBlock`** + **`CardModal`** + **`SelectButton`** row; tokens for shell UI.
5. Entry points on **library** and **reader**; live preview in reader only.
6. Acceptance spike passes on **imported** book (smoke regression still passes).
7. Update **Schema and paths** for prefs table / tier enum.

**Explicitly out of scope**

- Font **family** / dyslexic face, theme/contrast, margins, line height
- Per-book font size
- TOC, highlights, remove book (**006**)
- iOS-first polish, store release

---

## Proposed steps

### Step A — Schema + mapping

- Migration for global reader settings (tier column or key-value row).
- `readerFontSizeTier.ts` (name TBD): tier enum, `toReadiumPreferences(tier)`, defaults.

### Step B — UI kit

- `CardModal`, `SelectButton`, `SelectButtonRow` with token-based styles.

### Step C — Reader wiring

- Hook loads tier; passes `preferences` to `ReaderSurface`.
- On tier change in reader: update prefs state only (no remount).

### Step D — Library + reader entry

- Shared modal component; library persists tier without `ReadiumView`.

### Step E — Verification

- Run acceptance spike; note Small-tier mapping outcome in ticket.

---

## Implementation notes (2026-11-17)

**Tier → Readium `fontSize` (locked in code):**

| Tier | Multiplier (vs product Medium) | `fontSize` sent to Readium |
|------|--------------------------------|----------------------------|
| Small | 0.85× | `1.0` (Readium min) |
| Medium | 1× | `≈ 1.176` (`1 / 0.85`) |
| Large | 1.25× | `≈ 1.471` |
| XL | 1.5× | `≈ 1.765` |
| 2XL | 1.75× | `≈ 2.059` |

Values clamped to Readium range `[1.0, 3.0]`. Module: `services/reader/readerFontSizeTier.ts`.

**Device acceptance (physical Android, 2026-11-17):** Pass. Font size changes from **library** and **reader** entry points; reading position retained in Readium; locators continue to save (no jump on resize).

---

## Technical boundaries

| Layer | Responsibility |
|-------|----------------|
| `components/ui/` | `CardModal`, `SelectButton`, `SelectButtonRow` |
| `features/reader/`, `features/library/` | Settings affordance, compose `ReaderSettingsModal` |
| `services/reader/` | Preferences mapping, load/save tier, wire session |
| `db/` | Migration, typed accessors |
| `features/*` | **No** `react-native-readium` import |

---

## Design philosophy

**Consistent with [Design Philosophy](../01_PRD-and-Guidelines/2_Design-Philosophy.md)**

- Readium and prefs mapping stay in **`services/reader/`**; thin features.
- Reusable modal and select controls in **`components/ui/`**.
- Shell styling via tokens; no raw magic numbers in feature styles.

**Inconsistent / temporary debt (acceptable in 005)**

- Global size only (no per-book).
- Tier buttons instead of continuous slider (Readium `RANGES.fontSize` allows finer control later).
- Tier → number table may be tweaked once on device if **Small** at `0.85` is ignored by Readium.
- Library settings with no in-context preview.

---

## Clarifications for Nefko

| # | Item | Status |
|---|------|--------|
| 1 | **Shell vs `ReaderSettings`:** shell on tokens (incl. color later); only `ReaderSettings` → Readium for epub. | **Locked** |
| 2 | **Tier button labels:** Small, Medium, Large, XL, **2XL**. | **Locked** |
| 3 | **Small smaller than Medium:** must be true in the app; exact Readium numbers left to implementation + device check. | **Locked** |

---

## Suggested follow-up tickets

| # | Title (draft) | Notes |
|---|----------------|--------|
| 006 | Remove book / file-off-device | Unchanged from **004** |
| — | Reader font family + dyslexic | May share `ReaderSettings` blocks |
| — | Reader theme / contrast (in-book) | `ReaderSettings` → Readium `preferences`; shell colors unchanged (`tokens`) |