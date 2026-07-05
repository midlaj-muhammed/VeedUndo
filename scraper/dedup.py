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

    Dedup strategy: match on source_url (unique per listing).
    Falls back to description+listing_mode if no source_url.
    Returns only new (non-duplicate) listings.
    """
    if not listings:
        return []

    client = _get_client()
    db = client.table("listings")

    new_listings = []
    seen_urls = set()

    for listing in listings:
        source_url = (listing.get("source_url") or "").strip()
        title = (listing.get("title") or "").strip()
        mode = listing.get("listing_mode", "rent")

        if not title and not source_url:
            continue

        # Skip if we've already seen this URL in the batch
        dedup_key = source_url or f"{title.lower()}|{mode}"
        if dedup_key in seen_urls:
            continue
        seen_urls.add(dedup_key)

        # Check database
        try:
            if source_url:
                result = (
                    db.select("id")
                    .eq("source_url", source_url)
                    .limit(1)
                    .execute()
                )
            else:
                # Fallback: match on description prefix + mode
                desc_prefix = (listing.get("description") or "")[:60]
                if not desc_prefix:
                    new_listings.append(listing)
                    continue
                result = (
                    db.select("id")
                    .ilike("description", f"{desc_prefix}%")
                    .eq("listing_mode", mode)
                    .limit(1)
                    .execute()
                )
            if result.data:
                print(f"  [dedup] Skipping duplicate: {title[:60] or source_url[:60]}")
                continue
        except Exception as e:
            print(f"  [dedup] DB check failed: {e}")
            # On DB error, include the listing anyway

        new_listings.append(listing)

    print(f"  [dedup] {len(new_listings)} new listings out of {len(listings)} total")
    return new_listings
