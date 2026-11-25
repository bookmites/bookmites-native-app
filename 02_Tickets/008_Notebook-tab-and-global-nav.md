# Overview
This ticket creates the Global Nav Bar with **three or four** bottom actions (full width):
- **Last** (only when a valid last-opened book exists)
- Home
- Bookmites Library (nav label **Library**)
- Notebook


In this ticket, we stub out the global nav for our three pages and build the global nav component. 

The `GlobalNav` component is a component that will be used across the main pages of our app:
- Home
- Bookmites Library ("Library")
- Notebook

The `GlobalNav` is NOT visible when the user is in the `Reader`

The global nav has four buttons:
| Button order | Button | Action |
|---|---|---|
| 1 | Last | Opens the reader to the last book opened in a reader session (hidden if none / invalid) |
| 2 | Home | Navigates to `/` (user’s books). |
| 3 | Library | Navigates to `/bookmites-library` (Bookmites Library stub). |
| 4 | Notebook | Navigates to `/notebook`. |

#### **Home**
The page that we currently have is Home page. It displays the user's books on it. 

#### **Library**
The library page is a new component. For this ticket, it simply consists of:
- Title: Bookmites Library
- Text: Coming in V2!

#### **Notebook**:
The notebook consists of a list of the user's highlights. We already have this page; this ticket adds navigation to it from the `GlobalNav` and removes the Back button.


### **What the Global Nav Looks like**
The `GlobalNav` is a standard bottom-bar component. Make it look normal for now, we will style it later. 


--------------------------------------------------

## **Clarification Questions**

*Question 1:*
The ticket calls the personal book list **Home**, but the live screen is `LibraryScreen` with title **Library** under `features/library/`. The new stub is **Bookmites Library** (nav label **Library**). For this ticket, should we only change user-visible strings and routes, or also rename code (`LibraryScreen` → `HomeScreen`, `features/library/` → `features/home/`, route `/` vs something like `/home`)?

*Answer:*
Change the code. 
Look, create `HomeScreen` and then move the (existing) library content over it. Then add the text to the `LibraryScreen`

*Question 2:*
For the **Bookmites Library** stub, what should the **Expo Router path** be (e.g. `/bookmites-library`, `/store`, `/catalog`)? The name **Library** already means the user’s imported books in code—picking a distinct route now avoids a painful rename later.

*Answer:*
`/bookmites-library`

*Question 3:*
The overview says **Recent Book**; the button table says **Last Book**. Which label should ship on the bottom bar for button 1?

*Answer:*
Just write "last" for now.

*Question 4:*
How should **Last Book** choose a `bookId`? Options include: most recently updated row in `reading_progress`; most recently opened reader session even if progress never saved; a new persisted “last opened book” value; or something else. If two books have progress, is “most recently read” (max `reading_progress.updated_at`) the rule you want?

*Answer:*
most recently opened reader session even if progress never saved

*Question 5:*
When there is **no valid Last Book** (empty library, no progress, or `file_on_device = 0`), what should button 1 do—disabled/grayed, hidden, navigate to Home with a message, or open a specific fallback (e.g. smoke book in dev only)?

*Answer:*
Hide it. The nav will consist of three buttons. They should take up the full width of the screen.

*Question 6:*
**GlobalNav hidden in Reader**—does that mean only the `/reader` route, or should `/data` and any other stack screens also hide it (or never get the nav at all)?

*Answer:*
The GlobalNav should ONLY be visible on these screens:
- Home
- Library
- Notebook
In every other screen, it should not display. 

*Question 7:*
`LibraryScreen` still has inline **Notebook** and **View stored data** buttons. For this ticket, should those be **removed** in favor of GlobalNav (and if so, how should users reach `/data` until a later IA ticket)?

*Answer:*
Remove them. 
"Add Book", "Data", and "Settings" should move to the home screen. 
Notebook does not need a button, it will now be in global nav.

*Question 8:*
`NotebookScreen` has a **Back** button. With bottom GlobalNav, should Back be **removed** so Notebook is a peer tab (and switching tabs uses the nav only)?

*Answer:*
Remove the back button. 

*Question 9:*
For a minimal “normal” bottom bar in this ticket, do you want **text labels only**, placeholder icons, or an **active tab** style (highlight the current section)? Any must-match spacing from `Screen` / safe area (e.g. bottom inset above the home indicator)?

*Answer:*
Placeholder icons, they should be grey icons with grey text. THe selected one black icon with black text. Use a standard "safe area" at the bottom of the screen. 

*Question 10:*
When **Last Book** opens the reader, should navigation **push** `/reader` on the stack (user back-swipes to wherever they were) or **replace** the current main tab context so Back from the reader returns to a specific main page (e.g. Home)?

*Answer:*
"Back" should return the user to the page they were on before (whichever one it was).

*Question 11:*
On **Home**, should we keep the current header actions as-is (**Add book**, **Settings**, dev **Open smoke book**), and only change the page title if we’re renaming Library → Home—or should any of those move off Home in this ticket?

*Answer:*
See above. 

*Question 12:*
Kakuna ticket discipline calls for **design-philosophy consistency / inconsistency** bullets. Do you want those written into 008 now (based on your intent), or should we treat styling and Expo Router structure as “minimal stub, polish later” and you’ll add philosophy notes when you answer the questions above?

*Answer:*
minimal stub, polish later. 

---

## Decisions (locked before implementation)

| Topic | Decision |
|-------|----------|
| **IA rename** | **Home** = user’s imported/bundled books (today’s list UI). **Library** (nav label) = **Bookmites Library** stub at route **`/bookmites-library`**. Rename/move code: **`HomeScreen`** + `features/home/` for the list; **`LibraryScreen`** in `features/library/` becomes the V2 stub only. |
| **Routes** | **`/`** → Home. **`/bookmites-library`** → Bookmites Library stub. **`/notebook`** → Notebook. **`/reader`**, **`/data`** stay stack screens **without** GlobalNav. |
| **Route layout** | Expo Router **route group** `(main)/` whose `_layout` renders page content + **`GlobalNav`** (only these three routes). Root `app/_layout.tsx` remains a **Stack** for reader/data pushed on top. |
| **GlobalNav visibility** | Shown **only** on Home, Bookmites Library, Notebook. Hidden everywhere else (reader, data, etc.). |
| **Nav items** | **3 or 4** slots in one row, **equal flex** so buttons span full width. Slot 1 **“Last”** only when a valid last-opened book exists; otherwise **three** buttons (Home, Library, Notebook). |
| **Last opened book** | Persist **on reader open** (successful session start), **even if** no `reading_progress` row yet. **Not** derived from `reading_progress.updated_at`. |
| **Last book validity** | **Last** appears only when stored `bookId` resolves to a `books` row with **`file_on_device = 1`** (and open path would succeed). Otherwise hide the control. |
| **Last → reader** | **`router.push`** to `/reader?bookId=…` so **Back** returns to whichever main page the user was on (Home, Library, or Notebook). |
| **Main tab switches** | Home / Library / Notebook use **`router.replace`** (or equivalent) to avoid stacking duplicate main routes. |
| **Home chrome** | Title **Home**. Keep **Add book**, **Settings**, dev **Open smoke book**. Add **Data** (navigate to `/data`). Remove inline **Notebook** / **View stored data** row. |
| **Notebook chrome** | Remove **Back**; rely on GlobalNav + system back from reader only. |
| **Bookmites Library stub** | Title **Bookmites Library**, body **Coming in V2!** — no other behavior. |
| **Nav visual (stub)** | Placeholder **icons + labels**; inactive = grey icon + grey text (`colors.textSecondary`); active = black icon + black text (`colors.textPrimary` / `colors.accent`). **Safe area** on bottom via `react-native-safe-area-context` (e.g. `useSafeAreaInsets` on the bar). |
| **Icons** | Use **`@expo/vector-icons`** (Expo SDK–aligned; install if not already resolvable). Simple generic icons per tab (book / home / library / notebook) — polish later. |
| **Last-opened storage** | SQLite migration **`0005`**: add nullable **`last_opened_book_id`** on **`reader_global_settings`** (same singleton row as font tier). Read/write in **`db/`**; set from **`services/reader`** when a book session reaches **ready** — not in feature UI. |
| **Boundaries** | **`GlobalNav`** in **`components/layout/`** (layout primitive). **`features/home/`**, **`features/library/`**, **`features/notebook/`** stay thin; last-opened query hook may live in **`features/home/`** or **`services/navigation/`** if reused — prefer **one** `useGlobalNav` / `useLastOpenedBook` hook calling `db/` + `services/`. |

---

## Goals (acceptance)

1. **`HomeScreen`** at `/` lists books (same behavior as today’s library list); header has **Add book**, **Settings**, **Data**; title **Home**.
2. **`LibraryScreen`** at `/bookmites-library` shows stub copy only.
3. **`NotebookScreen`** at `/notebook` lists highlights; **no** Back button.
4. **`GlobalNav`** visible on the three main routes only; correct **active** state per route.
5. **3-button** nav when no valid last book; **4-button** when last book is valid; **Last** opens reader and **Back** returns to prior main screen.
6. Opening any book in the reader updates **`last_opened_book_id`** once the session is ready (smoke, import, or Last).
7. **`/data`** reachable from Home; **no** GlobalNav on data screen.
8. **`npx tsc --noEmit`** and **`npx expo lint`** pass; smoke/regression: import list → read → back → switch tabs → notebook shows quotes.

**Explicitly out of scope**

- Final nav illustration system, haptics, badges, Bookmites catalog behavior (V2).
- Renaming **`services/library/`** (import filesystem) — that name stays “library” on disk.
- Progress %, “continue reading” card on Home.
- iOS-specific tab polish beyond safe area.
- Architecture doc refresh (optional note in implementation notes only unless we make a large route-tree change).

---

## Proposed steps

### Step A — Schema: last opened book

- Extend **`reader_global_settings`** with **`last_opened_book_id`** (`TEXT`, nullable, optional FK → `books.book_id` **RESTRICT** if Drizzle migration supports cleanly).
- Generate **migration `0005`**; helpers: **`getLastOpenedBookId()`**, **`setLastOpenedBookId(bookId)`** in `db/` (upsert same global row as font settings without clobbering font tier).
- On reader session **`ready`**, call **`setLastOpenedBookId(bookId)`** from **`useReaderBookSession`** (or thin `services/reader/lastOpenedBook.ts`).

### Step B — Feature split: Home vs Library stub

- Create **`features/home/`**: move list UI from current **`LibraryScreen`** → **`HomeScreen`** (`useLibraryBooks` / **`LibraryBookRow`** can move here or stay imported from `features/library/` temporarily — prefer **move** `useLibraryBooks`, **`LibraryBookRow`** → `features/home/` and rename to **`HomeBookRow`** / **`useHomeBooks`** if file count stays small).
- Replace **`features/library/LibraryScreen.tsx`** with stub (title + “Coming in V2!”).
- Update **`app/index.tsx`** to render **`HomeScreen`**.
- Add **`app/(main)/bookmites-library.tsx`** (or move routes under `(main)` — see Step C).

### Step C — Expo Router `(main)` group + GlobalNav

- Add **`app/(main)/_layout.tsx`**: `flex: 1` column, **`Slot`**, **`GlobalNav`** pinned bottom.
- Move **`index.tsx`**, **`notebook.tsx`** under **`app/(main)/`**; add **`bookmites-library.tsx`**.
- Keep **`app/reader.tsx`** and **`app/data.tsx`** at stack root (sibling to `(main)`), **`headerShown: false`** unchanged.
- Implement **`components/layout/GlobalNav.tsx`**:
  - `usePathname()` for active tab.
  - Load last book via hook + `getLastOpenedBookId` + join **`books`** (or service) for `fileOnDevice`.
  - Buttons: **Last** (conditional), **Home** → `/`, **Library** → `/bookmites-library`, **Notebook** → `/notebook`.
  - Inactive/active colors from **`design/tokens`**.
  - Bottom padding: **`useSafeAreaInsets().bottom`**.

### Step D — Screen chrome updates

- **Home:** remove `navRow`; add **Data** button; set title **Home**.
- **Notebook:** remove Back button and header row gap tied only to Back.
- **Data:** no layout change required (already no GlobalNav).

### Step E — Wire navigation behavior

- Main tabs: **`router.replace(href)`** when switching between Home / Library / Notebook.
- Last: **`router.push({ pathname: '/reader', params: { bookId } })`**.
- Ensure opening a book from **Home list** still uses **push** to reader (same Back semantics).

### Step F — Verification

- Fresh install / no opens: nav shows **3** items, full width.
- Open smoke → back to Home: nav shows **4** items; **Last** reopens smoke.
- Remove file / `file_on_device = 0` edge (if easy to simulate): **Last** hidden again.
- Home → **Data** → back: no GlobalNav on data.
- Physical Android (or emulator): safe area not clipped by gesture bar.

**Ticket closes** after Step F passes and commit (per team workflow).

---

## Design philosophy

**Consistent**

- Small, scoped components (`GlobalNav`, stub `LibraryScreen`, layout group).
- Business logic for last-opened book in **`db/`** + **`services/reader`**, not in nav UI.
- Reuse **`Screen`**, **`AppText`**, **`Button`**, design tokens for stub styling.

**Inconsistent (accepted for this ticket)**

- Nav uses placeholder icons and minimal styling — intentional stub until a later design pass (per Nefko Q12).
- **`features/library/`** name now means “Bookmites Library” UI while **`services/library/`** still means on-device epub storage — documented here to avoid confusion until a future rename ticket.

---

## Implementation notes (optional follow-ups)

- After merge, consider a one-line pointer in **[Architecture](../01_PRD-and-Guidelines/3_Architecture-and-Dependencies.md)** for `(main)` + GlobalNav if the route tree change is non-obvious.
- **[Schema and paths](../01_PRD-and-Guidelines/4_Schema-and-Paths.md)**: document `last_opened_book_id` on `reader_global_settings` when migration lands.

--------------------------------------------------
## **Step 2: Create Settings Page:**
It is time to create a page for settings. 
This will be its own place in `03_App/mobile/src/features/<area>/`
The settings page will have to items:
- Reader Settings (which will open the Reader Settings Modal - which already exists)
- Data - which opens the data page (which already exists.)
The Settings button is a gear icon. It is in the upper-right of th "Home" screen opposite the "home" title. 
The existing "Data" and "Settings" buttons no longer display on home, they are now in settings. 

**Clarifications**

*Question 1:*
The ticket path says `components/features/settings`, but the repo convention is `03_App/mobile/src/features/<area>/` (not under `components/`). Should implementation live in **`features/settings/`** (with screen + route), matching Home and Notebook?

*Answer:*
I'm sorry, do: `03_App/mobile/src/features/<area>/`

*Question 2:*
Is **Settings** a new Expo Router screen (e.g. **`/settings`**) pushed onto the root stack like **`/data`**, or should it live inside **`(main)`** with **GlobalNav** still visible?

*Answer:*
Its own screen. The GlobalNav will not be visible. 

*Question 3:*
The gear control is specified on **Home** only. Should users reach Settings from **Library** or **Notebook** in this step, or is Home the only entry point for now?

*Answer:*
No, only the home page. 

*Question 4:*
On the Settings screen, should **Reader Settings** open the existing **`ReaderSettingsModal`** in place (no navigation), and **Data** **`router.push('/data')`** so Back on Data returns to Settings? Or should Data be embedded / replaced differently?

*Answer:*
The interaction model remains the same as now (for each of them), we're just changing the location of the buttons. 

*Question 5:*
What chrome should the Settings **page** have: title (**Settings**?), a **Back** control (and Back returns to Home), or only rely on system back / stack pop?

*Answer:*
Title and back button. (yes, back returns to home)

*Question 6:*
For the two Settings rows (**Reader Settings**, **Data**), is a simple list of existing **`Button`** components (secondary) fine for this stub, or do you want tappable rows (title + optional chevron) like book rows?

*Answer:*
Do a list of line-items, Title and text. 
- Data:
  - Title: Your Reading Data
  - Text: Data about your reading location, and more. 
- Reader Settings:
  - Title: Reader Settings
  - Text: Adjust the UI for your reading experience. 

*Question 7:*
For the Home gear: **`Ionicons` `settings-outline`** (or `cog`) in the header upper-right opposite the **Home** title — text label hidden, with accessibility label **Settings**? Any minimum touch target (e.g. 44pt) beyond default padding?

*Answer:*
cog

*Question 8:*
After this step, **Home** keeps **Add book** (and dev smoke) in the header but **no** text **Data** / **Settings** buttons — confirm? 
*Answer:* Yes, confirmed.

Should **ReaderSettingsModal** and font-tier state move entirely out of **`HomeScreen`** into **`SettingsScreen`** (Home only navigates to Settings or opens nothing reader-related)?

*Answer:*
Yes, entirely out of home and into settings. 

*Question 9:*
Is **Step 2** part of the same **008** commit / acceptance as Step 1 (global nav), or a follow-up commit you want called out separately in the ticket metadata?

*Answer:*
THis is part of the same ticket. 



--------------------------------------------------
## **Step 3: Home Cleanup**
- Remove the "Open Smoke Book" button. (COmpletely, we dont' need it anymore)
- Move "Add Book" to the bottom of the book list, and make it a secondary button (white with black text and outline)
- Put the book image in the list items on the left. If there is no book image, use a placeholder that is the same size as a book image but just a gray box. 




--------------------------------------------------



## Pull request (ticket 008)

### Title
**008: Global nav, Home/Library split, Settings, and shared BookList**

### Summary
Adds bottom **GlobalNav** on main tabs (Home, Bookmites Library stub, Notebook), splits the old library list into **Home** vs **Bookmites Library**, persists **Last** opened book for a conditional nav action, introduces **Settings** and reusable **`BookList` / `BookLI`** components, and polishes Home list layout (covers, Add book footer, flush to nav).

### Navigation & routing
- **`app/(main)/_layout`**: stacks page content + **`GlobalNav`** (safe-area bottom on the bar only).
- **`/`** → **`HomeScreen`** (`features/home/`).
- **`/bookmites-library`** → **`LibraryScreen`** stub (“Coming in V2!”).
- **`/notebook`** → **`NotebookScreen`** (Back removed; use GlobalNav).
- **`/settings`**, **`/data`**, **`/reader`**: root stack screens **without** GlobalNav.
- Main tabs use **`router.replace`**; **Last** and opening a book use **`router.push`** so Back returns to the prior screen.

### GlobalNav
- **`components/layout/GlobalNav.tsx`**: icons + labels; inactive grey / active black.
- **3** equal-width tabs when no valid last book; **4** when **`last_opened_book_id`** points at a book with **`file_on_device = 1`**.
- **Last** hidden when missing or invalid.

### Data & persistence
- Migration **`0005_last_opened_book`**: nullable **`last_opened_book_id`** on **`reader_global_settings`** (FK → `books`, RESTRICT).
- Set on reader session **ready** in **`useReaderBookSession`**; read via **`getValidLastOpenedBookId()`**.
- Documented in **`4_Schema-and-Paths.md`** and ticket **Architectural Decisions** below.

### Step 2 — Settings
- **`/settings`** → **`SettingsScreen`** (title + Back to Home).
- Line items: **Reader Settings** (existing modal), **Your Reading Data** → **`/data`**.
- Home: **cog** only (no text Data/Settings); reader font state lives on Settings.

### Step 3 — Home & book list
- Removed dev **Open smoke book**.
- **`components/BookLists/`**: **`BookList`**, **`BookLI`**, cover thumbnail + **`resolveBookCoverUri`**.
- **Add book** as secondary footer on **`BookList`**.
- **`Screen`**: **`safeAreaEdges`** + **`padBottom`** so list fills slot and meets **GlobalNav** (no double bottom inset).

### Dependencies / tooling
- **`@expo/vector-icons`** for nav and Home gear.
- First **`expo lint`** run added **`eslint.config.js`** and eslint devDeps (pre-existing lint rule noise elsewhere unchanged).

### Files worth reviewer attention
| Area | Paths |
|------|--------|
| Routes | `app/(main)/*`, `app/settings.tsx` |
| Nav | `components/layout/GlobalNav.tsx`, `useLastOpenedBook.ts` |
| Home | `features/home/HomeScreen.tsx`, `components/BookLists/*` |
| DB | `schema.ts`, `readerSettings.ts`, `0005_last_opened_book.sql` |
| Layout | `components/ui/Screen.tsx` |

### Test plan
- [ ] Fresh install / no reader opens: GlobalNav shows **Home · Library · Notebook** only (3 tabs).
- [ ] Open any book → Back: **Last** appears; tap reopens same book; Back returns to tab you left.
- [ ] Switch Home / Library / Notebook: no stacked duplicate routes; active tab styling correct.
- [ ] Home: cog → Settings → Reader Settings modal; Your Reading Data → `/data` → Back → Settings → Back → Home.
- [ ] Home list: covers or grey placeholder; **Add book** at bottom; list visually meets nav (no gap).
- [ ] Reader and Data: no GlobalNav.
- [ ] `cd 03_App/mobile && npm run typecheck && npm test`

### Out of scope (follow-ups)
- Bookmites Library catalog (V2), nav visual design pass, cover caching, renaming **`services/library/`** vs **`features/library/`**.

## Architectural Decisions

**Last-opened book lives on `reader_global_settings`**

For GlobalNav **Last**, we persist **`last_opened_book_id`** on the existing singleton row in **`reader_global_settings`** (same table as reader font tier), via migration **`0005`**. It is written when a reader session reaches **ready**, not inferred from **`reading_progress.updated_at`**.

**Why this shape (for now):** One global row, no new table, minimal migration surface for a stub nav feature. Font tier and last-opened are both app-wide reader UX state, though they are unrelated domains.

**Revisit later if:** we add more session/navigation prefs (e.g. last main tab, resume prompts, multiple profiles); **`reader_global_settings`** starts to mix unrelated concerns; or we want **`last_opened`** decoupled from reader display settings. Alternatives: a dedicated **`app_preferences`** / **`navigation_state`** table, or a small key-value table. Future devs — note objections or migrations here.