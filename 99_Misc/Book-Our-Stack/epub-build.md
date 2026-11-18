# Exporting this book to EPUB

Source chapters are the numbered `*.md` files (not `_Outline.md`, `epub-quality-checklist.md`, or this file).

## Prerequisites

- [Pandoc](https://pandoc.org/) 3.x
- Optional: [epubcheck](https://www.w3.org/publishing/epubcheck/) for validation
- `cover.jpg` at 1600×2560 (already in this folder)

Review [epub-quality-checklist.md](./epub-quality-checklist.md) before calling an export final.

## Build command

Run from this directory:

```bash
pandoc \
  --metadata-file=epub-metadata.yaml \
  --epub-cover-image=cover.jpg \
  --toc --toc-depth=2 \
  --split-level=2 \
  -o "The-Book-of-Our-Stack.epub" \
  1.1_What-Bookmite-Reader-is-building.md \
  1.2_From-React-on-the-web-to-React-Native.md \
  2.1_Expo-day-to-day-development.md \
  2.2_Android-builds-Gradle-APKs-and-Android-Studio.md \
  2.3_How-the-repo-is-organized.md \
  3.1_Epub-for-implementers.md \
  3.2_Readium-and-react-native-readium.md \
  3.3_The-reader-adapter.md \
  3.4_Locators-progress-and-highlights.md \
  4.1_Filesystem-and-the-library-data-model.md \
  4.2_SQLite-expo-sqlite-and-Drizzle.md \
  5.1_End-to-end-flows.md \
  5.2_What-we-are-not-building-yet.md \
  5.3_Glossary-and-further-reading.md
```

## Validate (optional)

```bash
epubcheck The-Book-of-Our-Stack.epub
```

## Version note

Record the export date in git or here when you ship a build readers should keep:

| Export | Date | Notes |
|--------|------|-------|
| `The-Book-of-Our-Stack.epub` | 2026-11-12 | Parts I–V, full manuscript |
| `The-Book-of-Our-Stack-Parts-I-III.epub` | (earlier) | Superseded by full export |
