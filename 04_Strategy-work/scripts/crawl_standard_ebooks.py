#!/usr/bin/env python3
"""Crawl Standard Ebooks public browse pages into a catalog CSV."""

from __future__ import annotations

import csv
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

BASE = "https://standardebooks.org"
USER_AGENT = (
    "Bookmites catalog crawler (personal research; "
    "+https://github.com/kylebecker/note-vault)"
)
DELAY_SECONDS = 0.4
PER_PAGE = 48
SUBJECTS = [
    "adventure",
    "autobiography",
    "biography",
    "childrens",
    "comedy",
    "drama",
    "fantasy",
    "fiction",
    "horror",
    "memoir",
    "mystery",
    "nonfiction",
    "philosophy",
    "poetry",
    "satire",
    "science-fiction",
    "shorts",
    "spirituality",
    "travel",
]
SUBJECT_LABELS = {
    "adventure": "Adventure",
    "autobiography": "Autobiography",
    "biography": "Biography",
    "childrens": "Children’s",
    "comedy": "Comedy",
    "drama": "Drama",
    "fantasy": "Fantasy",
    "fiction": "Fiction",
    "horror": "Horror",
    "memoir": "Memoir",
    "mystery": "Mystery",
    "nonfiction": "Nonfiction",
    "philosophy": "Philosophy",
    "poetry": "Poetry",
    "satire": "Satire",
    "science-fiction": "Science Fiction",
    "shorts": "Shorts",
    "spirituality": "Spirituality",
    "travel": "Travel",
}

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "data" / "standard-ebooks-catalog.csv"


def fetch(url: str, retries: int = 5) -> str:
    if "/honeypot" in url:
        raise RuntimeError(f"refusing to fetch honeypot URL: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return response.read().decode("utf-8")
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code in {429, 500, 502, 503, 504} and attempt < retries - 1:
                time.sleep(DELAY_SECONDS * (attempt + 2) * 2)
                continue
            raise
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
            if attempt < retries - 1:
                time.sleep(DELAY_SECONDS * (attempt + 2) * 2)
                continue
            raise
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def join_display(values: list[str] | set[str]) -> str:
    return "; ".join(sorted(values, key=str.casefold))


class BookListParser(HTMLParser):
    """Parse ebook list items and pagination page numbers."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.books: list[dict[str, str | list[str]]] = []
        self.page_numbers: set[int] = set()
        self._in_book = False
        self._book_path = ""
        self._in_author = False
        self._capture_name = False
        self._name_parts: list[str] = []
        self._title = ""
        self._authors: list[str] = []
        self._seen_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key: value or "" for key, value in attrs}
        if tag == "a":
            href = attr.get("href", "")
            parsed = urllib.parse.urlparse(href)
            query = urllib.parse.parse_qs(parsed.query)
            if "page" in query:
                try:
                    self.page_numbers.add(int(query["page"][0]))
                except ValueError:
                    pass
        if tag == "li" and "schema:Book" in attr.get("typeof", ""):
            self._in_book = True
            self._book_path = attr.get("about") or attr.get("resource") or ""
            self._title = ""
            self._authors = []
            self._seen_title = False
            self._in_author = False
            return
        if not self._in_book:
            return
        if tag == "p" and "author" in attr.get("class", "").split():
            self._in_author = True
        if tag == "span" and attr.get("property") == "schema:name":
            self._capture_name = True
            self._name_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "span" and self._capture_name:
            name = " ".join("".join(self._name_parts).split())
            self._capture_name = False
            self._name_parts = []
            if self._in_author:
                if name and name not in self._authors:
                    self._authors.append(name)
            elif not self._seen_title:
                self._title = name
                self._seen_title = True
        if tag == "p" and self._in_author:
            self._in_author = False
        if tag == "li" and self._in_book:
            if self._book_path.startswith("/ebooks/"):
                authors = list(self._authors)
                if not authors and self._book_path.startswith("/ebooks/anonymous/"):
                    authors = ["Anonymous"]
                self.books.append(
                    {
                        "path": self._book_path.split("?")[0],
                        "title": self._title,
                        "authors": authors,
                    }
                )
            self._in_book = False
            self._capture_name = False

    def handle_data(self, data: str) -> None:
        if self._capture_name:
            self._name_parts.append(data)


class CollectionIndexParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.collections: list[tuple[str, str]] = []
        self._capture = False
        self._path = ""
        self._parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key: value or "" for key, value in attrs}
        if tag == "a":
            href = urllib.parse.urlparse(attr.get("href", "")).path
            if href.startswith("/collections/") and href != "/collections/":
                self._capture = True
                self._path = href
                self._parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._capture:
            name = " ".join("".join(self._parts).split())
            if name and self._path:
                self.collections.append((self._path, name))
            self._capture = False

    def handle_data(self, data: str) -> None:
        if self._capture:
            self._parts.append(data)


def parse_books(html: str) -> tuple[list[dict[str, str | list[str]]], int]:
    parser = BookListParser()
    parser.feed(html)
    last_page = max(parser.page_numbers) if parser.page_numbers else 1
    return parser.books, last_page


def paginate(path: str) -> list[dict[str, str | list[str]]]:
    books: list[dict[str, str | list[str]]] = []
    page = 1
    last_page = 1
    while page <= last_page:
        query = urllib.parse.urlencode({"per-page": PER_PAGE, "page": page})
        url = f"{BASE}{path}?{query}"
        print(f"  fetch {url}", flush=True)
        html = fetch(url)
        time.sleep(DELAY_SECONDS)
        page_books, detected_last = parse_books(html)
        last_page = max(last_page, detected_last)
        books.extend(page_books)
        if not page_books:
            break
        page += 1
    return books


def main() -> int:
    print("Crawling all ebooks…", flush=True)
    catalog: dict[str, dict[str, object]] = {}
    for book in paginate("/ebooks"):
        path = str(book["path"])
        authors = book["authors"]
        catalog[path] = {
            "title": book["title"],
            "author": join_display(authors) if isinstance(authors, list) else "",
            "subjects": set(),
            "collections": set(),
            "url": f"{BASE}{path}",
        }
    available_paths = set(catalog)

    print(f"Found {len(catalog)} books. Crawling subjects…", flush=True)
    for slug in SUBJECTS:
        label = SUBJECT_LABELS[slug]
        for book in paginate(f"/subjects/{slug}"):
            path = str(book["path"])
            if path not in catalog:
                continue
            subjects = catalog[path]["subjects"]
            assert isinstance(subjects, set)
            subjects.add(label)

    print("Crawling collections index…", flush=True)
    print(f"  fetch {BASE}/collections", flush=True)
    index_html = fetch(f"{BASE}/collections")
    time.sleep(DELAY_SECONDS)
    index_parser = CollectionIndexParser()
    index_parser.feed(index_html)
    collections = list(dict.fromkeys(index_parser.collections))
    print(f"Found {len(collections)} collections.", flush=True)
    for path, name in collections:
        for book in paginate(path):
            book_path = str(book["path"])
            if book_path not in catalog:
                continue
            colls = catalog[book_path]["collections"]
            assert isinstance(colls, set)
            colls.add(name)

    rows = []
    for path, item in catalog.items():
        if path not in available_paths:
            continue
        subjects = item["subjects"]
        collections_for_book = item["collections"]
        assert isinstance(subjects, set)
        assert isinstance(collections_for_book, set)
        rows.append(
            {
                "title": item["title"],
                "author": item["author"],
                "subjects": join_display(subjects),
                "collections": join_display(collections_for_book),
                "url": item["url"],
            }
        )
    rows.sort(key=lambda row: (str(row["author"]).casefold(), str(row["title"]).casefold()))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["title", "author", "subjects", "collections", "url"],
        )
        writer.writeheader()
        writer.writerows(rows)

    tagged = sum(1 for row in rows if row["subjects"])
    in_collection = sum(1 for row in rows if row["collections"])
    print(f"Wrote {OUT_PATH}")
    print(f"Books: {len(rows)}")
    print(f"Books with subjects: {tagged}")
    print(f"Books in a collection: {in_collection}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
