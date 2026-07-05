"""Parse raw scraped listings into structured VeedUndo data using Groq."""

import json
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL, HOUSE_TYPE_MAP

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are a property listing parser. Extract structured data from raw scraped listings.

Return a JSON array of objects with these fields:
- title: string (clean property title)
- price: number (monthly rent in INR, or sale price — numeric only, no commas)
- listing_mode: "rent" or "sell"
- house_type: one of ["1bhk","2bhk","3bhk","4bhk","single_room","studio","villa","independent_house","apartment","pg_room","plot","farm_house","commercial"]
- bedrooms: number or null
- area_sqft: number or null (convert from sqft/sq m if needed)
- furnishing: "furnished" | "semi_furnished" | "unfurnished" | null
- description: string (cleaned description)
- location: string (area/locality, district)
- phone: string (10-digit Indian number) or null
- image_urls: array of valid image URLs (filter out empty/invalid)
- source_url: original listing URL or null

Rules:
- Infer listing_mode from keywords: "rent", "rental", "per month", "monthly" → rent; "sale", "sell", "lakh", "crore", "price" → sell
- Map BHK labels to house_type using this mapping: "1 bhk"→"1bhk", "2 bhk"→"2bhk", "3 bhk"→"3bhk", "studio"→"studio", "villa"→"villa", "independent house"→"independent_house", "apartment"/"flat"→"apartment", "pg"/"paying guest"→"pg_room", "plot"/"land"→"plot", "farm house"→"farm_house", "commercial"/"shop"→"commercial"
- If house_type cannot be determined, default to "apartment"
- Clean prices: "₹15,000" → 15000, "1.5 Lakh" → 150000, "25 Lac" → 250000, "1.2 Cr" → 12000000
- Filter out non-Kerala locations
- Return ONLY valid JSON array, no markdown code fences, no explanation"""


def parse_listings(raw_listings: list[dict]) -> list[dict]:
    """Parse raw scraped listings into structured VeedUndo format using Groq."""
    if not raw_listings:
        return []

    # Process in batches of 10 to stay within token limits
    batch_size = 10
    all_parsed = []

    for i in range(0, len(raw_listings), batch_size):
        batch = raw_listings[i:i + batch_size]
        batch_input = json.dumps(batch, ensure_ascii=False)

        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Parse these listings:\n{batch_input}"},
                ],
                temperature=0.1,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content.strip()
            # Groq sometimes wraps in {"listings": [...]}
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                # Try common wrapper keys
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

    # Post-process: normalize house_type
    for listing in all_parsed:
        raw_type = str(listing.get("house_type", "")).lower().strip()
        listing["house_type"] = HOUSE_TYPE_MAP.get(raw_type, "apartment")

        # Ensure required fields exist
        listing.setdefault("title", "")
        listing.setdefault("price", 0)
        listing.setdefault("listing_mode", "rent")
        listing.setdefault("bedrooms", None)
        listing.setdefault("area_sqft", None)
        listing.setdefault("furnishing", None)
        listing.setdefault("description", "")
        listing.setdefault("location", "")
        listing.setdefault("phone", None)
        listing.setdefault("image_urls", [])
        listing.setdefault("source_url", None)
        listing.setdefault("source", "unknown")

    print(f"  [parser] Parsed {len(all_parsed)} listings from {len(raw_listings)} raw")
    return all_parsed
