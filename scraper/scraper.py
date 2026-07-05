"""Scrapes property listings from MagicBricks using Playwright.

Strategy: Fresh browser context per city to avoid rate-limiting cascade.
Uses different sort orders and property type paths to get unique listings.
"""

import time
import re
import random
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout
from config import REQUEST_DELAY, REQUEST_DELAY_SHORT, MAX_LISTINGS_PER_SOURCE, MAX_PAGES_PER_CITY

KERALA_CITIES = [
    {"name": "Kochi", "slug": "Kochi"},
    {"name": "Thiruvananthapuram", "slug": "Trivandrum"},
    {"name": "Kozhikode", "slug": "Kozhikode"},
    {"name": "Thrissur", "slug": "Thrissur"},
    {"name": "Kollam", "slug": "Kollam"},
    {"name": "Kannur", "slug": "Kannur"},
    {"name": "Kottayam", "slug": "Kottayam"},
    {"name": "Palakkad", "slug": "Palakkad"},
    {"name": "Malappuram", "slug": "Malappuram"},
    {"name": "Idukki", "slug": "Idukki"},
    {"name": "Wayanad", "slug": "Wayanad"},
    {"name": "Ernakulam", "slug": "Ernakulam"},
    {"name": "Pathanamthitta", "slug": "Pathanamthitta"},
    {"name": "Kasaragod", "slug": "Kasaragod"},
]

# Different scraping strategies per city to get unique listings.
# Each strategy uses different URL patterns, sort orders, or property types.
SCRAPING_STRATEGIES = [
    # Strategy 1: All residential (general)
    {"path": "residential-real-estate-{slug}", "label": "all-residential"},
    # Strategy 2: Rent only
    {"path": "residential-real-estate-for-rent-in-{slug}", "label": "rent"},
    # Strategy 3: Sale only
    {"path": "residential-real-estate-for-sale-in-{slug}", "label": "sale"},
    # Strategy 4: Apartments rent
    {"path": "apartments-for-rent-in-{slug}", "label": "apartments-rent"},
    # Strategy 5: Apartments sale
    {"path": "apartments-for-sale-in-{slug}", "label": "apartments-sale"},
    # Strategy 6: Independent houses rent
    {"path": "independent-house-for-rent-in-{slug}", "label": "indhouse-rent"},
    # Strategy 7: Independent houses sale
    {"path": "independent-house-for-sale-in-{slug}", "label": "indhouse-sale"},
    # Strategy 8: Villas rent
    {"path": "villas-for-rent-in-{slug}", "label": "villas-rent"},
    # Strategy 9: Villas sale
    {"path": "villas-for-sale-in-{slug}", "label": "villas-sale"},
    # Strategy 10: Plots sale
    {"path": "plots-for-sale-in-{slug}", "label": "plots-sale"},
    # Strategy 11: Commercial rent
    {"path": "commercial-for-rent-in-{slug}", "label": "commercial-rent"},
    # Strategy 12: Commercial sale
    {"path": "commercial-for-sale-in-{slug}", "label": "commercial-sale"},
]

_browser = None
_pw_instance = None


def _get_browser():
    global _browser, _pw_instance
    if _browser is None:
        _pw_instance = sync_playwright().start()
        _browser = _pw_instance.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ],
        )
    return _browser


def _close_browser():
    global _browser, _pw_instance
    if _browser:
        try:
            _browser.close()
        except Exception:
            pass
        _browser = None
    if _pw_instance:
        try:
            _pw_instance.stop()
        except Exception:
            pass
        _pw_instance = None


def _new_page():
    browser = _get_browser()
    context = browser.new_context(
        user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport={"width": 1920, "height": 1080},
        locale="en-US",
    )
    page = context.new_page()
    page.set_default_timeout(30000)
    return context, page


def _extract_phone(text: str) -> str | None:
    match = re.search(r'(?:\+91[-\s]?)?[6-9]\d{9}', text)
    return match.group(0).replace("+91", "").replace("-", "").replace(" ", "") if match else None


def _scroll_load(page, steps=5):
    for i in range(steps):
        page.evaluate(f"window.scrollTo(0, {(i + 1) * 600})")
        page.wait_for_timeout(600)


def _extract_cards(page, city_name):
    """Extract listing data from MagicBricks cards on the current page."""
    listings = []
    cards = page.query_selector_all(
        ".mb-home__owner-exclusive-prop__card, .mb-home__owner-prop__card"
    )
    for card in cards:
        try:
            def _text(selectors):
                for sel in selectors:
                    el = card.query_selector(sel)
                    if el:
                        return el.inner_text().strip()
                return ""

            type_text = _text(["[class*='--type']", "[class*='type']"])
            price_text = _text(["[class*='--price']", "[class*='price']"])
            loc_text = _text(["[class*='--loc']", "[class*='loc']"])
            status_text = _text(["[class*='--status']", "[class*='status']"])
            size_text = _text(["[class*='--size']", "[class*='size']"])

            # Extract individual listing URL from card link
            listing_url = ""
            link_el = card.query_selector("a[href]")
            if link_el:
                href = link_el.get_attribute("href") or ""
                if href.startswith("/"):
                    listing_url = f"https://www.magicbricks.com{href}"
                elif href.startswith("http"):
                    listing_url = href

            # Fallback to city-level URL
            if not listing_url:
                listing_url = f"https://www.magicbricks.com/property-for-sale-rent-in-{city_name.replace(' ', '-')}/residential-real-estate-{city_name.replace(' ', '-')}"

            img_url = ""
            img_el = card.query_selector("img")
            if img_el:
                img_url = img_el.get_attribute("src") or img_el.get_attribute("data-src") or ""

            if type_text or price_text:
                desc_parts = [type_text]
                if size_text:
                    desc_parts.append(size_text)
                if loc_text:
                    desc_parts.append(f"in {loc_text}")
                if status_text:
                    desc_parts.append(f". {status_text}")
                listings.append({
                    "source": "magicbricks",
                    "title": type_text,
                    "price_text": price_text,
                    "area": size_text,
                    "description": " ".join(desc_parts),
                    "location": loc_text or city_name,
                    "phone": None,
                    "images": [img_url] if img_url else [],
                    "url": listing_url,
                })
        except Exception:
            continue
    return listings


def _scrape_city(pw, city, seen_urls):
    """Scrape a single city with a fresh browser context.

    Returns list of new (unique) raw listings.
    """
    city_listings = []

    # Fresh browser context per city to avoid rate-limiting cascade
    browser = pw.chromium.launch(
        headless=True,
        args=[
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security",
        ],
    )

    try:
        for strategy in SCRAPING_STRATEGIES:
            if len(city_listings) >= MAX_LISTINGS_PER_SOURCE:
                break

            path = strategy["path"].format(slug=city["slug"])

            for pg in range(1, MAX_PAGES_PER_CITY + 1):
                url = f"https://www.magicbricks.com/property-for-sale-rent-in-{city['slug']}/{path}"
                if pg > 1:
                    url += f"?page={pg}"

                # Fresh context for each page load
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1920, "height": 1080},
                    locale="en-US",
                )
                page = context.new_page()
                page.set_default_timeout(30000)

                try:
                    # Retry logic with exponential backoff
                    for attempt in range(3):
                        try:
                            page.goto(url, wait_until="domcontentloaded", timeout=20000)
                            break
                        except PwTimeout:
                            if attempt < 2:
                                wait = REQUEST_DELAY * (attempt + 1)
                                print(f"      timeout, retrying in {wait}s...")
                                page.wait_for_timeout(wait * 1000)
                            else:
                                raise
                        except Exception as e:
                            if attempt < 2:
                                wait = REQUEST_DELAY * (attempt + 1)
                                print(f"      error ({e.__class__.__name__}), retrying in {wait}s...")
                                page.wait_for_timeout(wait * 1000)
                            else:
                                raise

                    page.wait_for_timeout(2000)
                    _scroll_load(page, 8)

                    cards = _extract_cards(page, city["name"])
                    if not cards:
                        context.close()
                        break  # No more listings on subsequent pages

                    new_count = 0
                    for listing in cards:
                        # Use individual listing URL for dedup
                        dedup_key = listing["url"]
                        if dedup_key not in seen_urls:
                            seen_urls.add(dedup_key)
                            city_listings.append(listing)
                            new_count += 1

                    print(f"    {strategy['label']} p{pg}: +{new_count} ({len(cards)} cards)")
                    if new_count == 0:
                        context.close()
                        break  # All duplicates on this page

                except PwTimeout:
                    print(f"    {strategy['label']} p{pg}: timeout (skipped)")
                except Exception as e:
                    print(f"    {strategy['label']} p{pg}: {e.__class__.__name__}")
                finally:
                    try:
                        context.close()
                    except Exception:
                        pass

                # Delay between requests with some jitter
                time.sleep(REQUEST_DELAY + random.uniform(0, 2))

    finally:
        try:
            browser.close()
        except Exception:
            pass

    print(f"    Total: {len(city_listings)} new listings")
    return city_listings


def scrape_magicbricks() -> list[dict]:
    raw_listings = []
    seen_urls = set()

    try:
        with sync_playwright() as pw:
            for city in KERALA_CITIES:
                print(f"  [MagicBricks] {city['name']}...")
                city_listings = _scrape_city(pw, city, seen_urls)
                raw_listings.extend(city_listings)
                # Extra delay between cities
                time.sleep(REQUEST_DELAY + random.uniform(0, 3))
    except Exception as e:
        print(f"  [scraper error] {e}")

    print(f"  [MagicBricks] Total: {len(raw_listings)} raw listings")
    return raw_listings


def scrape_all() -> list[dict]:
    all_listings = []
    try:
        all_listings.extend(scrape_magicbricks())
    except Exception as e:
        print(f"  [scraper error] scrape_magicbricks: {e}")
    _close_browser()
    return all_listings
