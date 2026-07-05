"""Check for duplicate listings before inserting into Supabase."""

from config import SUPABASE_URL, SUPABASE_KEY

_supabase = None


def _get_client():
    global _supabase
    if _supabase is None:
        from supabase import create_client
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


def dedup_listings(listings: list[dict]) -> list[dict]:
    """Remove listings that already exist in the database.

    Dedup strategy: match on title + location + listing_mode + price.
    Returns only new (non-duplicate) listings.
    """
    if not listings:
        return []

    client = _get_client()
    db = client.table("listings")

    new_listings = []
    seen_keys = set()

    for listing in listings:
        title = (listing.get("title") or "").strip()
        location = (listing.get("location") or "").strip()
        mode = listing.get("listing_mode", "rent")
        price = listing.get("price", 0)

        if not title:
            continue

        # Skip if already seen in this batch
        dedup_key = f"{title.lower()}|{location.lower()}|{mode}|{price}"
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        # Check database
        try:
            result = (
                db.select("id")
                .ilike("title", f"%{title[:50]}%")
                .eq("listing_mode", mode)
                .limit(1)
                .execute()
            )
            if result.data:
                print(f"  [dedup] Skipping duplicate: {title[:60]}")
                continue
        except Exception as e:
            print(f"  [dedup] DB check failed for '{title[:40]}': {e}")
            # On DB error, include the listing anyway — don't lose data

        new_listings.append(listing)

    print(f"  [dedup] {len(new_listings)} new listings out of {len(listings)} total")
    return new_listings
