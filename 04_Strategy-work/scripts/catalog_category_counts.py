#!/usr/bin/env python3
"""Print book counts per Standard Ebooks subject (and collection totals)."""

from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "standard-ebooks-catalog.csv"


def split_multi(value: str) -> list[str]:
    return [part for part in (item.strip() for item in value.split(";")) if part]


def main() -> None:
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8")))
    subjects = Counter()
    collections = Counter()
    in_a_collection = 0
    for row in rows:
        for subject in split_multi(row["subjects"]):
            subjects[subject] += 1
        colls = split_multi(row["collections"])
        if colls:
            in_a_collection += 1
        for collection in colls:
            collections[collection] += 1

    print(f"Total books: {len(rows)}")
    print(f"Books in a collection: {in_a_collection}")
    print(f"Distinct collections: {len(collections)}")
    print()
    print("Subjects")
    width = max(len(name) for name in subjects)
    for name, count in subjects.most_common():
        print(f"  {name:<{width}}  {count}")


if __name__ == "__main__":
    main()
