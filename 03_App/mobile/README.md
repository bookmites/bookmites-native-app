# Bookmite Reader (mobile)

Expo **development build** app for Android-first epub reading. Not compatible with stock Expo Go once native Readium is added (Step B).

## Layout

| Path | Role |
|------|------|
| `app/` | Expo Router routes only — delegate to `src/features` |
| `src/features/` | Library, reader screens |
| `src/components/ui/` | Shared presentational UI |
| `src/services/` | Adapters and non-UI logic |
| `src/db/` | SQLite / Drizzle (stub until ticket 003) |
| `src/design/` | Tokens (colors, spacing, typography) |

## Commands

From this directory:

```bash
npm install
npx expo run:android   # first run generates android/ and installs dev client
npm start              # Metro (after dev client is installed)
```

JDK **17** and `ANDROID_HOME` must be set in the shell — see [`../../00_AI-Infra/nefkos-setup.md`](../../00_AI-Infra/nefkos-setup.md).

## Ticket

Scaffold: [001 Mobile scaffold and Readium](../../02_Tickets/001_Mobile-scaffold-and-Readium-dev-build.md).