"""Parse raw scraped listings into structured VeedUndo data using Groq.

Falls back to regex-based parsing if the Groq API is unavailable.
"""

import json
import re
from config import GROQ_MODEL, HOUSE_TYPE_MAP

try:
    from groq import Groq
    from config import GROQ_API_KEY
    _groq_client = Groq(api_key=GROQ_API_KEY)
except Exception as e:
    print(f"  [parser] Groq init failed ({e}), will use fallback parser")
    _groq_client = None

SYSTEM_PROMPT = """You are a property listing parser. Extract structured data from raw scraped listings.

Return a JSON array of objects with these fields:
- title: string (clean property title — for dedup reference only)
- listing_mode: "rent" or "sell"
- house_type: one of ["1bhk","2bhk","3bhk","4bhk","single_room","studio","villa","independent_house","apartment","pg_room","plot","farm_house","commercial"]
- bedrooms: number or null
- area_sqft: number or null (convert from sqft/sq m if needed)
- furnishing: "furnished" | "semi_furnished" | "unfurnished" | null
- description: string (cleaned description, max 500 chars)
- location: string (area/locality, district — must be a Kerala location)
- phone: string (10-digit Indian number) or null
- image_urls: array of valid image URLs (filter out empty/invalid)
- source_url: original listing URL or null

For pricing, use these fields based on listing_mode:
- If listing_mode is "rent":
  - rent_min: number (monthly rent lower bound in INR, numeric only, no commas)
  - rent_max: number (monthly rent upper bound in INR, or same as rent_min if single price)
  - price: null
- If listing_mode is "sell":
  - price: number (sale price in INR, numeric only, no commas)
  - rent_min: null
  - rent_max: null

Rules:
- Infer listing_mode from keywords: "rent", "rental", "per month", "monthly" → rent; "sale", "sell", "lakh", "crore", "price" → sell
- Map BHK labels to house_type using this mapping: "1 bhk"→"1bhk", "2 bhk"→"2bhk", "3 bhk"→"3bhk", "studio"→"studio", "villa"→"villa", "independent house"→"independent_house", "apartment"/"flat"→"apartment", "pg"/"paying guest"→"pg_room", "plot"/"land"→"plot", "farm house"→"farm_house", "commercial"/"shop"→"commercial"
- If house_type cannot be determined, default to "apartment"
- Clean prices: "₹15,000" → 15000, "1.5 Lakh" → 150000, "25 Lac" → 250000, "1.2 Cr" → 12000000
- For rent ranges like "15,000 - 20,000", set rent_min=15000, rent_max=20000
- For rent single price like "₹18,000/month", set rent_min=18000, rent_max=18000
- Filter out non-Kerala locations
- Return ONLY valid JSON array, no markdown code fences, no explanation"""


def _fallback_parse(raw_listings: list[dict]) -> list[dict]:
    """Regex-based fallback parser when Groq is unavailable."""
    parsed = []
    for raw in raw_listings:
        title = raw.get("title", "")
        desc = raw.get("description", "")
        price_text = raw.get("price_text", "")
        area = raw.get("area", "")
        loc = raw.get("location", "")
        url = raw.get("url", "")
        images = raw.get("images", [])

        # Detect listing mode
        combined = f"{title} {desc} {price_text}".lower()
        if any(w in combined for w in ["lakh", "lac", "cr", "crore", "sale", "sell"]):
            listing_mode = "sell"
        else:
            listing_mode = "rent"

        # Detect house type
        house_type = "apartment"
        for key, val in HOUSE_TYPE_MAP.items():
            if key in combined:
                house_type = val
                break

        # Extract bedrooms
        bedrooms = None
        m = re.search(r"(\d)\s*(?:bhk|bed|bedroom)", combined)
        if m:
            bedrooms = int(m.group(1))

        # Extract area
        area_sqft = None
        if area:
            m = re.search(r"(\d+)", area)
            if m:
                area_sqft = int(m.group(1))
        if not area_sqft:
            m = re.search(r"(\d+)\s*(?:sq\.?\s*ft|sqft)", combined)
            if m:
                area_sqft = int(m.group(1))

        # Parse price
        rent_min = rent_max = None
        price = None
        # Remove ₹ and commas for parsing
        price_clean = price_text.replace("₹", "").replace(",", "").strip()
        # Extract numeric values
        nums = re.findall(r"[\d.]+", price_clean)
        numbers = []
        for n in nums:
            try:
                numbers.append(float(n))
            except ValueError:
                pass

        # Check for lakh/crore multipliers
        multiplier = 1
        if "cr" in combined or "crore" in combined:
            multiplier = 10000000
        elif "lakh" in combined or "lac" in combined:
            multiplier = 100000

        if listing_mode == "sell" and numbers:
            price = int(numbers[0] * multiplier)
        elif numbers:
            rent_min = int(numbers[0] * multiplier)
            rent_max = int(numbers[1] * multiplier) if len(numbers) > 1 else rent_min

        # Filter images
        valid_images = [img for img in images if img and img.startswith("http")]

        parsed.append({
            "title": title,
            "listing_mode": listing_mode,
            "house_type": house_type,
            "bedrooms": bedrooms,
            "area_sqft": area_sqft,
            "furnishing": None,
            "description": desc[:500] if desc else title[:500],
            "location": loc,
            "phone": raw.get("phone"),
            "image_urls": valid_images,
            "source_url": url or None,
            "rent_min": rent_min,
            "rent_max": rent_max,
            "price": price,
            "source": "scraped",
        })

    print(f"  [parser-fallback] Parsed {len(parsed)} listings from {len(raw_listings)} raw")
    return parsed


def parse_listings(raw_listings: list[dict]) -> list[dict]:
    """Parse raw scraped listings into structured VeedUndo format using Groq.

    Falls back to regex parsing if Groq fails.
    """
    if not raw_listings:
        return []

    # Try Groq first
    if _groq_client:
        try:
            return _parse_with_groq(raw_listings)
        except Exception as e:
            print(f"  [parser] Groq failed ({e}), falling back to regex parser")

    # Fallback to regex
    return _fallback_parse(raw_listings)


def _parse_with_groq(raw_listings: list[dict]) -> list[dict]:
    """Parse using Groq API."""
    batch_size = 10
    all_parsed = []

    for i in range(0, len(raw_listings), batch_size):
        batch = raw_listings[i:i + batch_size]
        batch_input = json.dumps(batch, ensure_ascii=False)

        try:
            response = _groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Parse these listings:\n{batch_input}"},
                ],
                temperature=0.1,
                max_tokens=4096,
            )

            content = response.choices[0].message.content.strip()
            # Remove markdown code fences if present
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)

            parsed = json.loads(content)
            if isinstance(parsed, dict):
                for key in ["listings", "results", "data", "properties"]:
                    if key in parsed and isinstance(parsed[key], list):
                        parsed = parsed[key]
                        break
                else:
                    parsed = list(parsed.values()) if parsed else []

            if isinstance(parsed, list):
                all_parsed.extend(parsed)

        except Exception as e:
            print(f"  [parse error] batch {i // batch_size}: {e}")
            continue

    # Post-process
    for listing in all_parsed:
        raw_type = str(listing.get("house_type", "")).lower().strip()
        listing["house_type"] = HOUSE_TYPE_MAP.get(raw_type, "apartment")

        listing.setdefault("title", "")
        listing.setdefault("listing_mode", "rent")
        listing.setdefault("bedrooms", None)
        listing.setdefault("area_sqft", None)
        listing.setdefault("furnishing", None)
        listing.setdefault("description", "")
        listing.setdefault("location", "")
        listing.setdefault("phone", None)
        listing.setdefault("image_urls", [])
        listing.setdefault("source_url", None)
        listing.setdefault("source", "scraped")

        mode = listing.get("listing_mode", "rent")
        if mode == "rent":
            listing.setdefault("rent_min", listing.get("price"))
            listing.setdefault("rent_max", listing.get("price"))
            listing["price"] = None
        else:
            listing.setdefault("price", 0)
            listing["rent_min"] = None
            listing["rent_max"] = None

    print(f"  [parser-groq] Parsed {len(all_parsed)} listings from {len(raw_listings)} raw")
    return all_parsed
