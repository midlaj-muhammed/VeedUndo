"""Scrapes property listings from Indian real estate sites using Playwright."""

import time
import re
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout
from config import REQUEST_DELAY, MAX_LISTINGS_PER_SOURCE

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
    {"name": " Kasaragod", "slug": "Kasaragod"},
]

MAX_PAGES_PER_CITY = 3

_browser = None
_pw_instance = None


def _get_browser():
    global _browser, _pw_instance
    if _browser is None:
        _pw_instance = sync_playwright().start()
        _browser = _pw_instance.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
    return _browser


def _close_browser():
    global _browser, _pw_instance
    if _browser:
        _browser.close()
        _browser = None
    if _pw_instance:
        _pw_instance.stop()
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

            img_url = ""
            img_el = card.query_selector("img")
            if img_el:
                img_url = img_el.get_attribute("src") or img_el.get_attribute("data-src") or ""

            # Build listing URL from title/area for "View on MagicBricks" link
            listing_url = f"https://www.magicbricks.com/property-for-sale-rent-in-{city_name.replace(' ', '-')}/residential-real-estate-{city_name.replace(' ', '-')}"

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


def scrape_magicbricks() -> list[dict]:
    raw_listings = []
    seen_titles = set()
    context, page = _new_page()

    try:
        for city in KERALA_CITIES:
            print(f"  [MagicBricks] {city['name']}...")
            city_listings = 0

            for pg in range(1, MAX_PAGES_PER_CITY + 1):
                url = f"https://www.magicbricks.com/property-for-sale-rent-in-{city['slug']}/residential-real-estate-{city['slug']}"
                if pg > 1:
                    url += f"?page={pg}"

                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=20000)
                    page.wait_for_timeout(2000)
                    _scroll_load(page, 8)

                    cards = _extract_cards(page, city["name"])
                    if not cards:
                        break  # No more listings on subsequent pages

                    for listing in cards:
                        dedup_key = f"{listing['title']}|{listing['location']}"
                        if dedup_key not in seen_titles:
                            seen_titles.add(dedup_key)
                            raw_listings.append(listing)
                            city_listings += 1

                    print(f"    Page {pg}: {len(cards)} cards")
                except PwTimeout:
                    print(f"    Page {pg}: timeout")
                    break
                except Exception as e:
                    print(f"    Page {pg}: {e}")
                    break

                time.sleep(REQUEST_DELAY)

            print(f"    Total: {city_listings} listings")
    finally:
        context.close()

    print(f"  [MagicBricks] Total: {len(raw_listings)} raw listings")
    return raw_listings


def scrape_99acres() -> list[dict]:
    raw_listings = []
    context, page = _new_page()

    try:
        for city in KERALA_CITIES:
            print(f"  [99acres] {city['name']}...")
            url = f"https://www.99acres.com/property-for-rent-in-{city['slug'].lower()}"
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(2000)
                _scroll_load(page, 5)

                cards = page.query_selector_all("[class*='tupleMaxInfo'], [class*='listing-card'], [class*='property-card']")

                count = 0
                for card in cards[:MAX_LISTINGS_PER_SOURCE // len(KERALA_CITIES)]:
                    try:
                        def _text_99(selectors):
                            for sel in selectors:
                                el = card.query_selector(sel)
                                if el:
                                    return el.inner_text().strip()
                            return ""

                        title = _text_99(["h2", "[class*='title']"])
                        price_text = _text_99(["[class*='price']"])
                        loc = _text_99(["[class*='loc']"])

                        img_url = ""
                        img_el = card.query_selector("img")
                        if img_el:
                            img_url = img_el.get_attribute("src") or ""

                        if title or price_text:
                            raw_listings.append({
                                "source": "99acres",
                                "title": title,
                                "price_text": price_text,
                                "area": "",
                                "description": title,
                                "location": loc or city["name"],
                                "phone": None,
                                "images": [img_url] if img_url else [],
                                "url": url,
                            })
                            count += 1
                    except Exception:
                        continue

                print(f"    Found {count} listings")
            except PwTimeout:
                print(f"    Timeout")
            except Exception as e:
                print(f"    Error: {e}")
            time.sleep(REQUEST_DELAY)
    finally:
        context.close()

    print(f"  [99acres] Total: {len(raw_listings)} raw listings")
    return raw_listings


def scrape_housing() -> list[dict]:
    raw_listings = []
    context, page = _new_page()

    try:
        for city in KERALA_CITIES:
            print(f"  [Housing.com] {city['name']}...")
            url = f"https://housing.com/property-for-rent/{city['slug'].lower()}"
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(2000)
                _scroll_load(page, 5)

                cards = page.query_selector_all("[class*='listing'], [class*='card'], article")

                count = 0
                for card in cards[:MAX_LISTINGS_PER_SOURCE // len(KERALA_CITIES)]:
                    try:
                        def _text_h(selectors):
                            for sel in selectors:
                                el = card.query_selector(sel)
                                if el:
                                    return el.inner_text().strip()
                            return ""

                        title = _text_h(["h2", "[class*='title']"])
                        price_text = _text_h(["[class*='price']"])
                        loc = _text_h(["[class*='loc']"])

                        img_url = ""
                        img_el = card.query_selector("img")
                        if img_el:
                            img_url = img_el.get_attribute("src") or ""

                        if title or price_text:
                            raw_listings.append({
                                "source": "housing",
                                "title": title,
                                "price_text": price_text,
                                "area": "",
                                "description": title,
                                "location": loc or city["name"],
                                "phone": None,
                                "images": [img_url] if img_url else [],
                                "url": "",
                            })
                            count += 1
                    except Exception:
                        continue

                print(f"    Found {count} listings")
            except PwTimeout:
                print(f"    Timeout")
            except Exception as e:
                print(f"    Error: {e}")
            time.sleep(REQUEST_DELAY)
    finally:
        context.close()

    print(f"  [Housing.com] Total: {len(raw_listings)} raw listings")
    return raw_listings


def scrape_all() -> list[dict]:
    all_listings = []
    for scraper_fn in [scrape_magicbricks, scrape_99acres, scrape_housing]:
        try:
            all_listings.extend(scraper_fn())
        except Exception as e:
            print(f"  [scraper error] {scraper_fn.__name__}: {e}")
        time.sleep(REQUEST_DELAY)
    _close_browser()
    return all_listings
