# `services/epub` — the in-house epub engine

Replaced Readium in [ticket 007](../../../../../02_Tickets/007_In-house-epub-reader.md). The core is the original Bookmites
implementation (Bookmites web demo), with fixes merged from its later `tools-domain` copy.
Bible-specific logic from that copy (verse selection, refs, footnotes, Bible TOC) is intentionally not included.

```
epub/
  core/                 Pure TypeScript. Safe in the app process, the WebView, and Jest.
    epub.ts             Epub: META-INF/container.xml → OPF → metadata, manifest, spine; text extraction by CFI
    location.ts         CFI ⇄ body-relative address helpers (spine step /6/N, body step /4)
    select/             CFI parser, CFISelector (DOM + xmldom), refcodes (sortable reading-order ints)
    display/            Browser-only: in-view ranges, SVG/rect highlights, scroll + column layout managers,
                        TextSelectionInteractionWord (custom selection; unused for now), annotations
    util/               listener, range algebra, string helpers
  injected/             The reader bundle that runs inside the WebView (esbuild → generated/readerBundle.ts)
    protocol.ts         App ⇄ WebView messages (shared types)
    reader.ts           In-document reader: layout, restore position, report location/selection, paint highlights
    main.ts             Idempotent boot (injected before content *and* after load)
  storage/              Extraction: unzip (fflate) into the cache dir, neutralise scripts, zip-slip guard
  readEpubMetadata.ts   Import-time metadata (via extraction)
```

**Addresses vs CFIs.** The WebView and `CFISelector` work in *body-relative addresses* (`[2, 4, 1, ':9']`).
Persisted data is always CFIs (`epubcfi(/6/6!/4/2/4/1:9)`); `core/location.ts` converts. Anything we add to a
document carries the `__bookmites-inject__` class and is skipped by CFI traversal, so it never shifts an address.

**Refcodes** (`select/refcode.ts`) encode spine index, text-node index and offset as one integer
(`1 SSS EEEE OOOOO`) for cheap sorting/filtering in SQL. Limits: ≤ 999 spine items, ≤ 9,999 non-empty text nodes
per spine document, ≤ 99,999 characters per text node — beyond that the code overflows into the next field.

**Working on the WebView side.** `npm run watch:reader`, then reopen the book. `webviewDebuggingEnabled` is on in
dev builds: Android → `chrome://inspect`, iOS → Safari Develop menu.
