## Who is the reader?
The reader of this book is a very very junior software developer who hasn't coded anything in years. He is familiar with web code at a high level, and has spent a lot of time working with development teams as a designer and product owner. However, just developmetn skills and understanding of software is minimal. He understands a lot about html, but little native apps, including React Native. 

## Scope of this book
This book should be 50 - 80 pages in total. 



## Writing style of this book. 
This book...
- Is written in paragraphs, not bullet points. 
- It describes overarching frameworks, not just code
- It describes details with example code snippets, and explains what each part of the code snippets means. 
- It introduces "key vocabulary" in the beginning of each chapter that will be relevant to the chapter. 
- The end of each chapter has a "Common pitfalls and gotchas." section that covers relative tricky topics for the chapter. Things like: readers that strip your CSS, inconsistent font rendering, the mimetype file needing to be uncompressed and first in the ZIP, whitespace sensitivity in XHTML, and the gap between spec and reality.
- When writing a chapter, refer to the number of pages (listed below in the outline) for the chapter as a guide. If it can be explained in less pages, to not add more fluff to make it longer. If it takes more pages, it is ok to go over the suggested page count by up to 2-3 pages. 
- DO NOT explain the product vision or roadmap—the user knows that stuff (he wrote it). THis focuses on the tech stack, and why those tecnology decisions were made in service of the roadmap. 

This book is written in an objective, narrative, non-fiction style. It is not overly verbose, but it is thourough in its explanations. 

## What is this book about?
Read: [Bookmite Reader Overview](../../01_PRD-and-Guidelines/0_Bookmite-Reader.md)
It is an overview of the technologies that will be used in the Bookmites App. It gives an overview, then walks the stack - discussing the different components and what they do. It describes what things are (what is React Native, how is it different from React Web, etc... what role does it play...). It also discusses processes like "building" the app, why we have to use things like Android Studio / Expo, etc... (what are these things actually for?)

## **Each chapter is a markdown file**
Write each chapter as its own markdown file. The file name is:
`{part}.{chapter}_Chapter-Title`
so chapter 1 is:

`1.1_What -Bookmite-Reader-is-building`



--------------------------------------------------

## **Outline**

*Target length: ~65–70 pages of body text (50–80 total with room for front matter). Chapters are ordered so each builds on the last—from “what is this app” down to “install an APK on your phone.” When drafting, use the page counts as guides; each chapter opens with **Key vocabulary** and closes with **Common pitfalls and gotchas** (prose sections in the manuscript, not bullet lists).*

### Part I — The map (why this stack exists)

**1.1 — What Bookmite Reader is building (and what “the stack” means)** (~4 pages)  
Narrative: Phase 0.2 goals (read epub, library, progress, fonts, highlights), local-first and FOSS context, the difference between *product* docs and *this* book as a tour of machinery. Two-runtime mental model: most of what you write is JavaScript/TypeScript; reading is native under the hood.  
*Key vocabulary:* local-first, native vs JavaScript layer, APK.  
*Pitfalls:* treating mobile like a website; assuming the reader runs in a browser tab.

**1.2 — From React on the web to React Native** (~6 pages)  
What React is (components, props, state) using web intuition; what changes on a phone (no DOM, views, layout, navigation, touch). How Metro relates to the bundlers you might know from the web. Where HTML/CSS thinking still helps and where it misleads.  
*Key vocabulary:* component, JSX, bridge (high level), Metro, screen vs route.  
*Pitfalls:* expecting `<div>` and CSS like the browser; layout surprises; one JS thread and why the UI can stutter.

### Part II — Building and running the app

**2.1 — Expo: day-to-day development** (~7 pages)  
Expo as tooling on top of React Native; `expo start`, Fast Refresh, Expo modules. **Expo Go vs development build**—why Readium forces a custom dev client. Optional pointer to EAS for cloud builds. What you do daily (editor + terminal + device) vs what is occasional.  
*Key vocabulary:* Expo, managed workflow, dev client, config plugin, prebuild.  
*Pitfalls:* expecting every dependency to work in Expo Go; native rebuild vs JS reload.

**2.2 — Android builds: Gradle, APKs, and what Android Studio is for** (~7 pages)  
What an APK is; debug vs release; signing in plain language. Gradle as orchestrator (Kotlin/Java, assets, native libs like Readium). JDK 17. Why Android Studio is SDK/emergency room, not where you live. Sideloading to a physical device for real reading tests.  
*Key vocabulary:* APK, Gradle, `minSdkVersion`, `targetSdkVersion`, `compileSdkVersion`, keystore.  
*Pitfalls:* confusing min vs target SDK; storage/WebView myths when you are using Readium natively.

**2.3 — How the repo is organized (features, services, db)** (~5 pages)  
Walk `03_App/mobile/src/` structure: `features/` (library, reader), `components/ui/`, `services/`, `db/`, `design/`. Import rules in plain language. Why the reader adapter lives in `services/` and UI does not call Readium directly. Hooks beside screens.  
*Key vocabulary:* feature, service, adapter, hook, design tokens.  
*Pitfalls:* god folders; putting SQLite or Readium calls inside shared buttons.

### Part III — Epubs and the reader engine

**3.1 — Epub for implementers (not publishers)** (~7 pages)  
Epub as ZIP + OPF + XHTML/CSS; spine and navigation; reflow vs fixed layout (why we care about text-first). Practical chaos: `mimetype` first and uncompressed, charset and XHTML whitespace, broken books in the wild, spec vs Kindle-caliber reality. Why we copy imports into app storage instead of remembering paths.  
*Key vocabulary:* OPF, spine, NCX/nav, XHTML, reflowable, sandbox.  
*Pitfalls:* mimetype ordering; path-based imports on Android; CSS that works in Calibre but not in a strict reader.

**3.2 — Readium and `react-native-readium`** (~8 pages)  
What Readium is as an engine (parse, lay out, paginate, accessibility). Native navigator vs WebView + epub.js and why Bookmite chose Readium. Bridge concepts: publication ready, settings (font size, themes, dyslexic font path), callbacks and location changes. Nitro modules note at a high level. Expo integration friction (desugaring, pods) without a tutorial.  
*Key vocabulary:* Readium, publication, navigator, locator (first introduction), spine item `href`.  
*Pitfalls:* janky highlights if you store pixels; underestimating native build setup.

**3.3 — The reader adapter (`EpubSession` / `readerEngine`)** (~5 pages)  
Adapter pattern in product terms: stable verbs (open, TOC, goTo, observe position, highlight) hiding Readium’s wire format. Small example: feature calls service; service calls Readium. Future hook for “text around here” for AI—mention only.  
*Key vocabulary:* adapter, `goTo`, publication lifecycle, decoupling.  
*Pitfalls:* features importing `react-native-readium` directly; leaking locator parsing into every screen.

**3.4 — Locators, progress, and highlights** (~7 pages)  
Logical position vs scroll position; reflow when font or margin changes. Readium locator JSON in SQLite; CFI as concept inside locators, not a parallel system. Highlights at scale; optional text snippet column; spike acceptance story (resize font twice, highlight stays).  
*Key vocabulary:* locator JSON, CFI, progression, `href`, snippet, reflow.  
*Pitfalls:* page numbers; edition swaps (same title, different file); malformed epubs.

### Part IV — Data on the device

**4.1 — Filesystem and the library data model** (~5 pages)  
App-private storage; copy-on-import; book record vs user artifacts; `fileOnDevice` and “remove file, keep highlights.” Relationship to Android scoped storage and the document picker—without a legal lecture.  
*Key vocabulary:* book record, user artifact, `bookId`, `fileOnDevice`, content URI.  
*Pitfalls:* reference-only imports; deleting artifacts when only the file was meant to go.

**4.2 — SQLite, expo-sqlite, and Drizzle** (~7 pages)  
What SQLite is on a phone; why not “just JSON files.” Driver vs ORM; migrations from day one; storing locator JSON in `TEXT`. Debounced position saves. Why expo-sqlite over op-sqlite for now. Short example schema (books, positions, highlights) with explained snippets.  
*Key vocabulary:* SQLite, migration, schema, Drizzle, debounce, foreign key by `bookId`.  
*Pitfalls:* no migrations; synchronous heavy queries on the JS thread; duplicating book rows on re-import (dedupe TBD).

### Part V — Putting it together

**5.1 — End-to-end flows (stories, not a spec)** (~5 pages)  
Three walkthroughs in prose: (1) import epub → library row → file on disk; (2) open → read → background → resume with locator; (3) highlight → change dyslexic font → reopen. Tie every step to a chapter from this book.  
*Key vocabulary:* (recap only—short).  
*Pitfalls:* skipping on-device tests; trusting emulator alone for typography.

**5.2 — What we are not building yet (honest boundary)** (~3 pages)  
In-app AI/BYOK, companion files, cloud backup, Play Store polish, iOS parity, dedupe-by-hash. Enough context that readers do not hunt for missing chapters.  
*Key vocabulary:* BYOK, companion file, EAS (reprise).  
*Pitfalls:* bolting AI before locator/reader quality is solid.

**5.3 — Glossary and further reading** (~3 pages)  
Alphabetical glossary of all **Key vocabulary** terms across chapters; links to Expo, Readium, Drizzle, and react-native-readium docs for when the book ends.

---

*Page budget check:* Part I ~10 · Part II ~19 · Part III ~27 · Part IV ~12 · Part V ~11 ≈ **~69 pages** (adjust 3.1 or 3.2 if early drafts run short).

