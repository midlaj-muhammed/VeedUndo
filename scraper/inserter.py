"""Insert parsed listings into Supabase."""

from datetime import datetime, timezone
from config import SUPABASE_URL, SUPABASE_KEY

_supabase = None


def _get_client():
    global _supabase
    if _supabase is None:
        from supabase import create_client
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


def insert_listings(listings: list[dict]) -> int:
    """Insert listings into Supabase. Returns count of successful inserts.

    Maps parsed fields to the Supabase listings table schema.
    """
    if not listings:
        return 0

    client = _get_client()
    db = client.table("listings")
    inserted = 0

    for listing in listings:
        row = {
            "title": (listing.get("title") or "")[:200],
            "description": listing.get("description") or "",
            "price": listing.get("price") or 0,
            "house_type": listing.get("house_type") or "apartment",
            "listing_mode": listing.get("listing_mode") or "rent",
            "location": listing.get("location") or "",
            "area": listing.get("area") or "",
            "area_sqft": listing.get("area_sqft"),
            "bedrooms": listing.get("bedrooms"),
            "furnishing": listing.get("furnishing"),
            "phone": listing.get("phone"),
            "image_urls": listing.get("image_urls") or [],
            "url": listing.get("source_url") or "",
            "source": listing.get("source") or "scraped",
            "status": "active",
            "expires_at": (
                datetime.now(timezone.utc).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
            ).isoformat(),
        }

        try:
            db.insert(row).execute()
            inserted += 1
        except Exception as e:
            print(f"  [insert error] '{row['title'][:40]}': {e}")

    print(f"  [inserter] Inserted {inserted}/{len(listings)} listings")
    return inserted
