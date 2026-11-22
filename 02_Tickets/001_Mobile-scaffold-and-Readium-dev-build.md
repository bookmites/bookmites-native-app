---
Status: done
Tags: android setup, expo, metro, physical device
Version: kyle-readium-experiment
---

*NOTE: this was from an early version when Kyle was trying to do a build with Readium. We ended up pulling the plug on this in Ticket 007*

# Ticket 001 — Mobile foundation: dev stack + Readium smoke

**Status:** Planned  
**Phase:** 0.2 — Read a book  
**Created:** 2026-11-12  

## Metadata

| Field | Value |
|-------|--------|
| Commit | _(none yet)_ |
| Depends on | — |
| Unblocks | Reader adapter depth, SQLite schema, import + library list (002+) |

---

## Summary

Establish the **permanent** mobile dev stack and app skeleton under `03_App/mobile/`—no Expo Go, no throwaway spike app. Use Expo (managed workflow + **development build**), **Expo Router**, the agreed `src/` layout, and **react-native-readium**. Deliver minimal but real **Library** and **Reader** screens: empty library, dev control to open a **fixture epub**, Readium renders with back navigation.

Product flows (file import, SQLite, progress, highlights) land in later tickets. This ticket finishes when **both** an Android emulator and a **physical device** can run the dev client and pass the Readium smoke test.

**Why this first:** Native Readium + custom dev client is the riskiest integration. Toolchain and project shape should be done once; everything afterward builds on the same path (`expo run:android`, config plugins, `src/features` + `services/` adapter).

---

## Decisions (locked before implementation)

| Topic | Decision |
|-------|----------|
| **Test epub** | Team commits a small epub manually. Repo defines fixture layout (e.g. `03_App/mobile/assets/fixtures/epubs/smoke.epub` + short README on license). Optional stub for future library storage root in `services/` (e.g. `getLibraryEpubRoot()`); no picker in 001. |
| **Navigation** | **Expo Router** — thin `app/` routes delegate to `src/features/library` and `src/features/reader`. Real screens (empty library, reader with back), not lorem placeholders or throwaway navigators. |
| **Build path** | **Local** `expo run:android` only for 001 (Gradle on machine). No EAS in this ticket. |
| **Devices** | **Step D1:** emulator first (toolchain validation). **Step D2:** physical Android via USB before **closing** 001. Record both in implementation notes. |

---

## Goals (acceptance)

1. **Project at** `03_App/mobile/` — TypeScript, Expo SDK compatible with current `react-native-readium` (versions in **Implementation notes**).
2. **Layout** per [Architecture](../01_PRD-and-Guidelines/3_Architecture-and-Dependencies.md):
   - `app/` — Expo Router entry routes only
   - `src/components/ui/`, `src/features/library/`, `src/features/reader/`, `src/services/` (reader adapter), `src/db/` (stub only), `src/design/`
   - Fixture path under `assets/fixtures/epubs/` (or equivalent documented convention)
3. **Dev client** built and installed via `expo run:android` on **emulator** and **physical device** — not Expo Go.
4. **Library screen:** real empty state (“No books yet”) + dev-only control to open the smoke fixture (fixture id in route/query).
5. **Reader screen:** opens fixture epub through `services/` adapter; pagination works; back returns to library. **`features/reader/` does not import `react-native-readium`.**
6. **Readium smoke:** open fixture → several page turns → no crash on either target device class above.
7. **Document** JDK/Android Studio setup, Expo SDK, RN, Readium, config plugins in **Implementation notes**.

**Explicitly out of scope**

- Document picker / copy-on-import
- SQLite + Drizzle migrations
- Progress/locator persistence, highlights, dyslexic font
- Table of contents UI
- iOS build
- EAS cloud builds
- Polished reader chrome beyond back + readable pages

---

## Proposed steps

### Step 0 — Toolchain (human + machine; do before app code)

One-time local Android dev stack on macOS:

- **JDK 17** (Gradle / Android)
- **Android Studio** — SDK Platform, Build-Tools, Command-line Tools; accept licenses
- **AVD** (emulator) — create and launch one virtual device
- **Environment** — `ANDROID_HOME`, `platform-tools` on PATH (`adb devices` sees emulator)
- **Node** — LTS compatible with chosen Expo SDK

Record what was installed in **Implementation notes** (paths, versions, any fixes). No application repo changes required in Step 0 unless we add a short `03_App/mobile/docs/local-android-setup.md` during implementation.

### Step A — Scaffold

- Create Expo app at `03_App/mobile/` with **Expo Router**.
- Create `src/` tree; routes in `app/` import feature screens from `src/features/`.
- `src/design/` tokens + minimal `components/ui/` as needed.
- Fixture directory + README; slot for manually added `smoke.epub`.

### Step B — Native / Readium

- Add `react-native-readium`; JDK 17, desugaring, `compileSdk` per package + Expo docs.
- Persist native changes via **config plugins** / prebuild in repo — not one-off hand edits.
- Reader path: `services/` opens bundled fixture → `features/reader/` renders.

### Step C — Emulator smoke

- `expo run:android` → install dev client on AVD.
- Library → open smoke book → paginate; note versions and AVD profile.

### Step D — Physical device smoke

- USB debugging on phone; `adb devices` lists it.
- Same smoke on device; note model and Android version.

**Ticket closes** after Steps C and D pass.

---

## Suggested follow-up tickets

| # | Title (draft) | Notes |
|---|----------------|--------|
| 002 | Reader adapter surface + locator persistence | After Readium renders; debounced progress save |
| 003 | SQLite schema v1 + Drizzle migrations | Books table minimal |
| 004 | Import copy-on-import + library list | Picker + copy into app storage |

---

## Design philosophy

**Consistent with [Design Philosophy](../01_PRD-and-Guidelines/2_Design-Philosophy.md)**

- Modular layout from day one; thin routes; logic in features/services.
- Readium only in `services/`.
- Semantic design tokens; small files; real app under `03_App/`.
- Standard FOSS stack as already decided.

**Temporary debt (acceptable in 001)**

- Thin reader adapter (full verb surface in 002).
- Fixture epub only — import and `getLibraryEpubRoot()` usage come later.
- Library has no DB — empty state + dev action only; no fake book rows.
- Minimal reader chrome; evolved in later tickets.

---

## Implementation notes

_(Fill in during/after implementation.)_

**Toolchain (Step 0):**

- JDK:
- Android Studio / SDK:
- Emulator (AVD):

**Versions:**

- Expo SDK: 57.0.x
- React Native: 0.86.0
- react-native-readium: 5.3.0 (+ react-native-nitro-modules 0.37.2)

**Config plugins:**

- `expo-build-properties` — Android `compileSdk`/`targetSdk` **36** (Readium AAR requires ≥36), Kotlin **2.3.20**.
- Local config plugins — `plugins/withKotlinGradlePlugin.js` (SDK 57 classpath pin), `plugins/withReadiumDesugaring.js` (core library desugaring + `desugar_jdk_libs` **2.1.5**).
- `expo-asset` — bundled fixture resolution.
- `metro.config.js` — `epub` in `assetExts`.
- No shipped `react-native-readium` Expo plugin; native linking via autolink + prebuild.

**Smoke — emulator:**

- Result: **Pass** — dev client launches; Library → smoke fixture opens in Readium; multiple page turns complete without crash. Horizontal swipe pagination **works** but feels **poor** (laggy / awkward on AVD; not tuned in 001 — default `ReadiumView` only, no `preferences`).
- AVD / API level: _(add profile name + API level if not already in Step 0 notes above)_

**Smoke — physical device:**

- Result:
- Device model / Android version:

**Deviations from plan and why:**

- Earlier failure: corrupted partial NDK `27.0.12077973` after disk full — **remove that folder** if present; Expo uses NDK `27.1.12297006`.
- Expo SDK 57: `expo-build-properties` `kotlinVersion` alone is insufficient; added `withKotlinGradlePlugin.js` ([expo#49668](https://github.com/expo/expo/issues/49668)).

--------------------------------------------------

## What to do (runbook)

Work top to bottom. Check boxes as you go. **Do not start Step A (app code) until Step 0 passes the gate.**

### Step 0 — Machine setup (you)

**0.1 JDK 17 (not 11, not 25 for Android builds)**

- [x] Install [Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17) (keep other JDKs installed if you want).
- [x] Add to `~/.zshrc`:

  ```bash
  export JAVA_HOME=$(/usr/libexec/java_home -v 17)
  export PATH="$JAVA_HOME/bin:$PATH"
  ```

- [x] `source ~/.zshrc` → run `java -version` → must show **17**.

**0.2 Android Studio + SDK**

- [x] Install or open [Android Studio](https://developer.android.com/studio).
- [x] SDK Manager: install **Android SDK Platform** (e.g. API 34 or 35), **Build-Tools**, **Command-line Tools**.
- [x] Accept SDK licenses when prompted.

**0.3 Emulator**

- [x] Device Manager → create one **AVD** → boot it once.

**0.4 Shell environment**

- [x] Add to `~/.zshrc`:

  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
  ```

- [x] `source ~/.zshrc` → with emulator running: `adb devices` → lists the emulator.

**Gate (Step 0 done):** `java -version` = 17, `adb devices` = emulator visible. Then continue to Step A with Kakuna / Agent.

---

### Step A — Scaffold (Agent + ticket)

- [x] Create `03_App/mobile/` (Expo + TypeScript + Expo Router).
- [x] `src/` layout + thin `app/` routes (library, reader).
- [x] `assets/fixtures/epubs/` + README; add `smoke.epub` manually when ready.

### Step B — Readium (Agent + ticket)

- [x] Add `react-native-readium`, config plugins, Android native settings in repo.
- [x] Fixture open path via `services/` → `features/reader/`.

### Step C — Emulator smoke

- [x] `cd 03_App/mobile` → `npx expo run:android` → app on AVD.
- [x] Library → open smoke book → paginate → record in **Implementation notes**.

### Step D — Physical device smoke (required to close 001)

- [ ] Phone: Developer options → USB debugging; `adb devices` lists phone.
- [ ] Same smoke on device → record in **Implementation notes**.

---

**Where you are now:** 
Done:
The (very simple) smoke app runs both on the Mac emulator and on the physical device. 
