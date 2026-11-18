# Bookmite Reader (mobile)

Expo **development build** app for Android-first epub reading. Not compatible with stock Expo Go once native Readium is added (Step B).

## Layout

| Path | Role |
|------|------|
| `app/` | Expo Router routes only — delegate to `src/features` |
| `src/features/` | Library, reader screens |
| `src/components/ui/` | Shared presentational UI |
| `src/services/` | Adapters and non-UI logic |
| `src/db/` | SQLite / Drizzle (`books`, `reading_progress`) |
| `src/design/` | Tokens (colors, spacing, typography) |

## Commands

From this directory:

```bash
npm install
npx expo run:android   # first run generates android/ and installs dev client
npm start              # Metro (after dev client is installed)
```

JDK **17** and `ANDROID_HOME` must be set in the shell — see [`../../00_AI-Infra/nefkos-setup.md`](../../00_AI-Infra/nefkos-setup.md).

## Tickets (mobile)

Baseline: [001](../../02_Tickets/001_Mobile-scaffold-and-Readium-dev-build.md) → [002](../../02_Tickets/002_Persistent-Location.md) progress → [003](../../02_Tickets/003_Books-table-v1.md) `books` schema → [004](../../02_Tickets/004_Copy-on-import-and-library-list.md) import + library list. Schema/path rules: [Schema and paths](../../01_PRD-and-Guidelines/4_Schema-and-Paths.md).