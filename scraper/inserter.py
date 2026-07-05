"""Insert parsed listings into Supabase with correct schema mapping."""

from datetime import datetime, timedelta, timezone
from config import SUPABASE_URL, SUPABASE_KEY

_supabase = None
_sub_district_cache = None


def _get_client():
    global _supabase
    if _supabase is None:
        from supabase import create_client
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


def _load_sub_districts():
    """Load sub_districts table into a lookup map for location matching."""
    global _sub_district_cache
    if _sub_district_cache is not None:
        return _sub_district_cache

    client = _get_client()
    rows = []
    offset = 0
    while True:
        result = (
            client.table("sub_districts")
            .select("id, name, district_id")
            .range(offset, offset + 499)
            .execute()
        )
        if not result.data:
            break
        rows.extend(result.data)
        if len(result.data) < 500:
            break
        offset += 500

    # Build lookup: lowercase name -> uuid
    _sub_district_cache = {}
    for row in rows:
        key = (row["name"] or "").strip().lower()
        if key:
            _sub_district_cache[key] = row["id"]

    print(f"  [inserter] Loaded {len(_sub_district_cache)} sub-districts for matching")
    return _sub_district_cache


def _match_sub_district(location_text: str) -> str | None:
    """Fuzzy match a parser location string to a sub_district UUID.

    Tries exact match first, then substring, then word overlap.
    Returns UUID or None if no match.
    """
    if not location_text:
        return None

    lookup = _load_sub_districts()
    clean = location_text.strip().lower()

    # Remove "kerala", "india" suffixes
    for suffix in [", kerala", ", kerala, india", " kerala", ", india"]:
        if clean.endswith(suffix):
            clean = clean[: -len(suffix)].strip()

    # Exact match
    if clean in lookup:
        return lookup[clean]

    # Substring match: check if any sub_district name is contained in the location
    for name, uid in lookup.items():
        if name in clean or clean in name:
            return uid

    # Word overlap: split location into words, find best match
    words = [w.strip() for w in clean.replace(",", " ").split() if len(w.strip()) > 2]
    best_score = 0
    best_uid = None
    for name, uid in lookup.items():
        name_words = set(name.split())
        overlap = sum(1 for w in words if w in name_words)
        if overlap > best_score:
            best_score = overlap
            best_uid = uid

    return best_uid if best_score >= 1 else None


def insert_listings(listings: list[dict]) -> int:
    """Insert listings into Supabase. Returns count of successful inserts.

    Maps parsed fields to the actual Supabase listings table schema.
    """
    if not listings:
        return 0

    client = _get_client()
    db = client.table("listings")
    inserted = 0
    skipped = 0

    for listing in listings:
        # Match location text to sub_district UUID
        sub_district_id = _match_sub_district(listing.get("location", ""))
        if not sub_district_id:
            print(f"  [skip] No sub-district match for: {listing.get('location', '?')[:50]}")
            skipped += 1
            continue

        listing_mode = listing.get("listing_mode") or "rent"
        is_rent = listing_mode == "rent"

        # Price fields: rent uses rent_min/rent_max, sell uses price
        row = {
            "description": (listing.get("description") or "")[:2000],
            "house_type": listing.get("house_type") or "apartment",
            "listing_mode": listing_mode,
            "sub_district_id": sub_district_id,
            "property_category": "residential",
            "poster_type": "owner",
            "poster_email": "scraped@veedundo.com",
            "poster_phone": listing.get("phone"),
            "bedrooms": listing.get("bedrooms"),
            "furnishing": listing.get("furnishing"),
            "area_sqft": listing.get("area_sqft"),
            "image_urls": listing.get("image_urls") or [],
            "source": "scraped",
            "status": "active",
            "expires_at": (
                datetime.now(timezone.utc).replace(
                    hour=0, minute=0, second=0, microsecond=0
                ) + timedelta(days=10 if is_rent else 90)
            ).isoformat(),
        }

        if is_rent:
            rent = listing.get("rent_min") or listing.get("price") or 0
            row["rent_min"] = rent
            row["rent_max"] = listing.get("rent_max") or rent
            row["price"] = None
        else:
            row["price"] = listing.get("price") or 0
            row["rent_min"] = None
            row["rent_max"] = None

        try:
            db.insert(row).execute()
            inserted += 1
        except Exception as e:
            desc = (listing.get("description") or "")[:40]
            print(f"  [insert error] '{desc}': {e}")

    print(f"  [inserter] Inserted {inserted}/{len(listings)} listings ({skipped} skipped - no location match)")
    return inserted
