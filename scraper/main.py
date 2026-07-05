"""Orchestrator: scrape → parse → dedup → insert."""

import sys
import time
from scraper import scrape_all
from parser import parse_listings
from dedup import dedup_listings
from inserter import insert_listings


def main():
    print("=" * 60)
    print("VeedUndo Scraper Pipeline")
    print("=" * 60)

    # Step 1: Scrape
    print("\n[1/4] Scraping property listings...")
    start = time.time()
    raw_listings = scrape_all()
    print(f"  Scraped {len(raw_listings)} raw listings in {time.time() - start:.1f}s")

    if not raw_listings:
        print("\nNo listings found. Exiting.")
        return

    # Step 2: Parse with Groq
    print("\n[2/4] Parsing with AI...")
    start = time.time()
    parsed_listings = parse_listings(raw_listings)
    print(f"  Parsed {len(parsed_listings)} listings in {time.time() - start:.1f}s")

    if not parsed_listings:
        print("\nNo valid listings after parsing. Exiting.")
        return

    # Step 3: Dedup
    print("\n[3/4] Checking for duplicates...")
    new_listings = dedup_listings(parsed_listings)

    if not new_listings:
        print("\nAll listings are duplicates. Nothing to insert.")
        return

    # Step 4: Insert
    print("\n[4/4] Inserting into Supabase...")
    start = time.time()
    count = insert_listings(new_listings)
    print(f"  Inserted in {time.time() - start:.1f}s")

    # Summary
    print("\n" + "=" * 60)
    print(f"Pipeline complete: {len(raw_listings)} scraped → "
          f"{len(parsed_listings)} parsed → {len(new_listings)} new → "
          f"{count} inserted")
    print("=" * 60)


if __name__ == "__main__":
    main()
