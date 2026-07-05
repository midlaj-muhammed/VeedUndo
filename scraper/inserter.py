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


# Map common city/area names to sub_district names in the database.
# Value can be a list of names to try in order.
_CITY_NAME_MAP = {
    "trivandrum": "thiruvananthapuram",
    "tvm": "thiruvananthapuram",
    "ernakulam": ["ernakulam", "kochi"],
    "calicut": "kozhikode",
    "cal": "kozhikode",
    "cochin": ["kochi", "ernakulam"],
    "kochi": ["kochi", "ernakulam"],
    "trichur": "thrissur",
    "tcr": "thrissur",
    "thrissur": "thrissur",
    "kollam": "kollam",
    "quilon": "kollam",
    "alleppey": "alappuzha",
    "alappuzha": "alappuzha",
    "munnar": "idukki",
    "kottem": "kottayam",
    "kottayam": "kottayam",
    "manjeri": "malappuram",
    "malappuram": "malappuram",
    "kanhangad": "kasaragod",
    "kasaragod": "kasaragod",
    "vatakara": "kozhikode",
    "vadakara": "kozhikode",
    "kunnamangalam": "kozhikode",
    "payyannur": "kannur",
    "kannur": "kannur",
    "palakkad": "palakkad",
    "palghat": "palakkad",
    "wayanad": "wayanad",
    "idukki": "idukki",
    "pathanamthitta": "pathanamthitta",
    "tripunithura": ["ernakulam", "kochi"],
    "kakkanad": ["ernakulam", "kochi"],
    "edappally": ["ernakulam", "kochi"],
    "alamcode": "thiruvananthapuram",
    "nemom": "thiruvananthapuram",
    "vattiyoorkavu": "thiruvananthapuram",
    "kazhakkoottam": "thiruvananthapuram",
    "attingal": "thiruvananthapuram",
    "neyyattinkara": "thiruvananthapuram",
    "paravur": "kollam",
    "kayamkulam": "alappuzha",
    "changanassery": "kottayam",
    "thuravoor": "alappuzha",
    "chavakkad": "thrissur",
    "guruvayur": "thrissur",
    "kodungallur": "thrissur",
    "irinjalakuda": "thrissur",
    "kunnamkulam": "thrissur",
    "pattambi": "palakkad",
    "shoranur": "palakkad",
    "ottpalam": "palakkad",
    "mananthavady": "wayanad",
    "sulthan bathery": "wayanad",
    "kalpetta": "wayanad",
    "tirur": "malappuram",
    "perinthalmanna": "malappuram",
    "nilambur": "malappuram",
    "koyilandy": "kozhikode",
    "kadirur": "kozhikode",
    "thalassery": "kannur",
    "mattannur": "kannur",
    "iritty": "kannur",
    "payyanur": "kannur",
    "pala": "kottayam",
    "vagamon": "idukki",
    "thodupuzha": "idukki",
    "kattappana": "idukki",
    "kumily": "idukki",
    "chengannur": "alappuzha",
    "mavelikara": "alappuzha",
    "cherthala": "alappuzha",
    "aroor": "alappuzha",
    "punalur": "kollam",
    "sasthamkotta": "kollam",
    "chengotta": "pathanamthitta",
    "ranni": "pathanamthitta",
    "aranmula": "pathanamthitta",
    "thiruvalla": "pathanamthitta",
}


def _match_sub_district(location_text: str) -> str | None:
    """Fuzzy match a parser location string to a sub_district UUID.

    Tries exact match, then city name mapping, then substring/word overlap.
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

    # City name mapping: try each word in the location against the map
    words = [w.strip().rstrip(",.") for w in clean.split()]
    for word in words:
        if word in _CITY_NAME_MAP:
            mapped = _CITY_NAME_MAP[word]
            # Handle list of candidates (try each in order)
            candidates = mapped if isinstance(mapped, list) else [mapped]
            for candidate in candidates:
                if candidate in lookup:
                    return lookup[candidate]

    # Also try comma-separated parts (e.g. "tripunithura, ernakulam")
    parts = [p.strip().rstrip(",.") for p in clean.split(",")]
    for part in parts:
        if part in _CITY_NAME_MAP:
            mapped = _CITY_NAME_MAP[part]
            candidates = mapped if isinstance(mapped, list) else [mapped]
            for candidate in candidates:
                if candidate in lookup:
                    return lookup[candidate]

    # Substring match
    for name, uid in lookup.items():
        if name in clean or clean in name:
            return uid

    # Word overlap
    clean_words = set(w for w in words if len(w) > 2)
    best_score = 0
    best_uid = None
    for name, uid in lookup.items():
        name_words = set(name.split())
        overlap = sum(1 for w in clean_words if w in name_words)
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
            "source_url": listing.get("url") or None,
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
            row["rent_min"] = 0
            row["rent_max"] = 0

        try:
            db.insert(row).execute()
            inserted += 1
        except Exception as e:
            desc = (listing.get("description") or "")[:40]
            print(f"  [insert error] '{desc}': {e}")

    print(f"  [inserter] Inserted {inserted}/{len(listings)} listings ({skipped} skipped - no location match)")
    return inserted
