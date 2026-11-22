# Bookmite Reader (mobile)

Expo **development build** app for Android-first epub reading. The reader is an in-house engine rendered in a `react-native-webview` ([ticket 007](../../02_Tickets/007_In-house-epub-reader.md)).

## Layout

| Path | Role |
|------|------|
| `app/` | Expo Router routes only — delegate to `src/features` |
| `src/features/` | Library, reader screens |
| `src/components/ui/` | Shared presentational UI |
| `src/services/` | Adapters and non-UI logic; `services/epub/` is the epub engine ([README](src/services/epub/README.md)) |
| `src/db/` | SQLite / Drizzle (`books`, `reading_progress`, `book_quotes`, `reader_global_settings`) |
| `src/design/` | Tokens (colors, spacing, typography) |

## Commands

From this directory:

```bash
npm install            # also builds the reader WebView bundle
npx expo run:android   # first run generates android/ and installs dev client
npm start              # Metro (after dev client is installed)
npm test               # Jest: epub engine (CFI, selector, refcodes, extraction rules)
npm run typecheck
npm run watch:reader   # rebuild the WebView bundle on change while working on services/epub/injected
```

The WebView bundle (`src/services/epub/injected/generated/`) is generated and gitignored; `npm install`, `npm start`, `npm run android|ios` and `npm run typecheck` rebuild it. Changes to `injected/` or `core/display/` need a bundle rebuild and a reader reopen (not Fast Refresh).

JDK **17** and `ANDROID_HOME` must be set in the shell — see [`../../00_AI-Infra/nefkos-setup.md`](../../00_AI-Infra/nefkos-setup.md).

## Tickets (mobile)

Baseline: [001](../../02_Tickets/001_Mobile-scaffold-and-Readium-dev-build.md) → [002](../../02_Tickets/002_Persistent-Location.md) progress → [003](../../02_Tickets/003_Books-table-v1.md) `books` schema → [004](../../02_Tickets/004_Copy-on-import-and-library-list.md) import + library list → [005](../../02_Tickets/005_Font-size.md) font size → [006](../../02_Tickets/006_Highlighting-Basics.md) BookQuotes → [007](../../02_Tickets/007_In-house-epub-reader.md) in-house reader (Readium removed). Schema/path rules: [Schema and paths](../../01_PRD-and-Guidelines/4_Schema-and-Paths.md).