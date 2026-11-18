
# EPUB Quality Checklist

## Metadata and Packaging

- Yaml defines title, subtitle if used, author, language, publisher or imprint if applicable, publication date, and description.
- EPUB has a stable identifier, such as an ISBN, UUID, or other unique book ID.
- Cover works on both EPUB 2 and EPUB 3.
- Uses `cover.jpg` as the cover.
- Cover image displays correctly in Finder, Apple Books, Kindle Previewer, Calibre, and other target readers.
- Cover has appropriate dimensions, aspect ratio, and file size for ebook stores and common readers.
- EPUB file name is clean, human-readable, and versioned if needed.

## Validation

- EPUB passes `epubcheck` with no errors.
- Any `epubcheck` warnings are reviewed and either fixed or intentionally accepted.
- EPUB opens successfully in at least two independent readers, such as Apple Books and Calibre.
- EPUB is tested in Kindle Previewer if a Kindle version may be produced.

## Book Structure

- Chapter files appear in the correct reading order.
- Part chapters appear before the chapters they introduce.
- Appendices appear after the final chapter.
- Table of contents includes all parts, chapters, and appendices.
- Table of contents labels are clean and reader-facing, without raw filenames or underscores.
- Start location opens at the intended beginning of the book, not the cover or metadata page unless that is intentional.
- Front matter, body, and back matter are logically separated.

## Headings and Navigation

- Each file has exactly one top-level `#` heading.
- Heading levels are nested correctly and do not skip levels.
- Part chapters contain only the title and one summary paragraph.
- Internal navigation works from the table of contents.
- Any internal cross-references, if used, point to valid targets.
- No duplicate chapter titles create confusing navigation entries.

## Formatting and Typography

- Paragraph spacing is comfortable and consistent across readers.
- Lists render correctly and are not overused in chapter prose.
- Tables render legibly on narrow screens.
- Long tables, especially Appendix C, are checked on phone-sized screens.
- Code-style formatting, percent signs, formulas, and bond notation render correctly.
- Smart quotes, apostrophes, hyphens, en dashes, and minus signs render consistently.
- No accidental line numbers, editor artifacts, or Markdown source markers appear in the EPUB.
- No raw YAML, Pandoc metadata, or build notes appear in the reader-facing book.

## Images and Cover Assets

- Cover is included only once in the EPUB package unless the build intentionally includes both a cover page and metadata cover.
- Images, if any, have appropriate alt text.
- Images scale correctly on small and large screens.
- Image files are compressed enough to avoid unnecessary EPUB size.

## Links and References

- External links work and use `https` where possible.
- External links are not essential to understanding the book if the reader is offline.
- Reference shelf entries are formatted consistently.
- Any URLs are reader-friendly and not broken across lines in awkward ways.

## Accessibility

- EPUB includes language metadata.
- Heading structure supports screen-reader navigation.
- Cover image has useful alt text or appropriate cover semantics.
- Tables include clear column headers.
- Link text is descriptive enough to make sense out of context.
- Reading order is logical when navigated without visual layout.

## Content QA

- Spellcheck has been run on all chapters and appendices.
- Chapter titles match the outline and filenames.
- Terms are used consistently: yield to maturity, yield to call, yield to worst, tax-equivalent yield, coupon, price, and maturity.
- Tax explanations avoid implying personalized tax advice.
- Examples use internally consistent numbers.
- No personal names or private household details appear in the book text.
- No unfinished placeholders remain.
- No repeated boilerplate endings make chapters feel mechanically generated.

## Device Review

- Review on desktop reader.
- Review on phone-sized reader.
- Review on tablet-sized reader.
- Check dark mode if the target reader supports it.
- Check font resizing at small, default, and large sizes.
- Check page breaks around chapter openings, tables, and appendices.

## Final Export

- Final EPUB is saved in the intended output folder.
- Source Markdown files used for export are the current versions.
- Build command or export process is documented.
- Final EPUB version number or date is recorded.
- Final file opens after being copied or downloaded, not only in the original build location.

## Cover

Research findings and local check:

- Local `cover.jpg` is already `1600 x 2560`, JPEG, RGB. This matches Amazon KDP's commonly recommended ebook cover dimensions of `1600 x 2560` and the preferred RGB color space.
- Keep the cover as JPEG for maximum Kindle compatibility. Kindle accepts JPEG/TIFF for cover upload; EPUB readers generally accept JPEG/PNG, but JPEG is the safest common format.
- Do not use CMYK. Ebook cover art should be RGB.
- Keep the portrait aspect ratio close to `1:1.6` width-to-height. Current cover is exactly `1600:2560`.
- Embed the cover image inside the EPUB, not only beside it as a loose file.
- For EPUB 3, the OPF manifest item for the cover image should include `properties="cover-image"`.
- For EPUB 2 / older-reader compatibility, also include the older metadata declaration: `<meta name="cover" content="cover-image-id" />`, where `content` references the manifest item ID for the cover image.
- Include a dedicated cover XHTML page that displays the cover image.
- Put the cover XHTML page as the first item in the spine so readers that use the first spine item as the opening cover page display it correctly.
- In the cover XHTML page, use a clear `alt` attribute that includes the title text and a short image description.
- Make sure the cover image is declared only once as the unique package cover image. Duplicate cover declarations can confuse some readers.
- Make sure the OPF manifest path points to the actual embedded cover image location, such as `cover.jpg` or `images/cover.jpg`.
- Make sure the cover image file name in the EPUB package matches the OPF reference exactly, including case.
- Make sure core metadata is complete: title, author/creator, language, identifier, date, subject/category, description, and rights/license.
- Put Dublin Core metadata before custom metadata where the build tool allows it; some older e-readers, including reported PocketBook firmware cases, have been sensitive to metadata ordering.
- Run `epubcheck` after export. A valid EPUB does not guarantee thumbnails everywhere, but invalid packaging often causes cover failures.
- Test the finished EPUB in Apple Books, Calibre, Kindle Previewer, and the PocketBook device itself.
- If the cover does not appear after a fix, remove the old EPUB from the reader/library and re-import it. Apple Books, Calibre, Kindle apps, Finder, and e-readers may cache the old thumbnail.
- For Kindle publishing, remember that the store/marketing cover may be uploaded separately from the EPUB manuscript, but the EPUB should still contain the internal cover image for preview and reading-system display.
- For Finder icon display, the best EPUB-side control is still correct embedded cover metadata and a valid package. Finder/Quick Look behavior can vary by macOS version and cache state, so verify after copying the final EPUB to a fresh location.

Minimal OPF pattern to verify after export:

```xml
<metadata>
  <dc:title>Introduction to Purchasing Munis for Personal Portfolios</dc:title>
  <dc:creator>...</dc:creator>
  <dc:language>en</dc:language>
  <dc:identifier id="book-id">...</dc:identifier>
  <meta name="cover" content="cover-image" />
</metadata>

<manifest>
  <item id="cover-image" href="cover.jpg" media-type="image/jpeg" properties="cover-image" />
  <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml" />
</manifest>

<spine>
  <itemref idref="cover-page" />
  <!-- remaining reading order -->
</spine>
```