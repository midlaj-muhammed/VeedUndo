"""Configuration for Kerala property scraper."""

import os

# Supabase
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Groq
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

# Kerala districts
KERALA_DISTRICTS = [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
    "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
    "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
]

# Scraping
REQUEST_DELAY = 6  # seconds between requests (MagicBricks rate-limits aggressively)
REQUEST_DELAY_SHORT = 3  # seconds for quick actions
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
MAX_LISTINGS_PER_SOURCE = 80
MAX_PAGES_PER_CITY = 3

# House type mapping (scraper label -> VeedUndo enum)
HOUSE_TYPE_MAP = {
    "1 bhk": "1bhk",
    "1bhk": "1bhk",
    "2 bhk": "2bhk",
    "2bhk": "2bhk",
    "3 bhk": "3bhk",
    "3bhk": "3bhk",
    "4 bhk": "4bhk",
    "4bhk": "4bhk",
    "1 rk": "single_room",
    "studio": "studio",
    "villa": "villa",
    "independent house": "independent_house",
    "independent villa": "independent_house",
    "apartment": "apartment",
    "flat": "apartment",
    "room": "single_room",
    "pg": "pg_room",
    "paying guest": "pg_room",
    "plot": "plot",
    "land": "plot",
    "farm house": "farm_house",
    "farmhouse": "farm_house",
    "commercial": "commercial",
    "shop": "commercial",
    "office": "commercial",
    "showroom": "commercial",
}
