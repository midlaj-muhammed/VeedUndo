"""Scrapes property listings from Indian real estate sites using Playwright."""

import time
import re
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout
from config import REQUEST_DELAY, MAX_LISTINGS_PER_SOURCE

KERALA_CITIES = [
    {"name": "Kochi", "slug_mb": "Kochi", "slug_99": "kochi", "slug_housing": "kochi"},
    {"name": "Thiruvananthapuram", "slug_mb": "Trivandrum", "slug_99": "thiruvananthapuram", "slug_housing": "thiruvananthapuram"},
    {"name": "Kozhikode", "slug_mb": "Kozhikode", "slug_99": "kozhikode", "slug_housing": "kozhikode"},
    {"name": "Thrissur", "slug_mb": "Thrissur", "slug_99": "thrissur", "slug_housing": "thrissur"},
    {"name": "Kollam", "slug_mb": "Kollam", "slug_99": "kollam", "slug_housing": "kollam"},
]

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


def _scroll_load(page, steps=3):
    """Scroll down gradually to trigger lazy-loaded content."""
    for i in range(steps):
        page.evaluate(f"window.scrollTo(0, {(i + 1) * 800})")
        page.wait_for_timeout(800)


# ---------------------------------------------------------------------------
# MagicBricks — confirmed working selectors
# ---------------------------------------------------------------------------
def scrape_magicbricks() -> list[dict]:
    raw_listings = []
    context, page = _new_page()

    try:
        for city in KERALA_CITIES:
            print(f"  [MagicBricks] {city['name']}...")
            url = f"https://www.magicbricks.com/property-for-sale-rent-in-{city['slug_mb']}/residential-real-estate-{city['slug_mb']}"
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)
                _scroll_load(page)

                # Confirmed working selectors from testing
                cards = page.query_selector_all(
                    ".mb-home__owner-exclusive-prop__card, "
                    ".mb-home__owner-prop__card"
                )

                count = 0
                for card in cards[:MAX_LISTINGS_PER_SOURCE // len(KERALA_CITIES)]:
                    try:
                        def _text(sel):
                            el = card.query_selector(sel)
                            return el.inner_text().strip() if el else ""

                        type_text = _text("[class*='--type']")
                        price_text = _text("[class*='--price']")
                        loc_text = _text("[class*='--loc']")
                        status_text = _text("[class*='--status']")

                        img_url = ""
                        img_el = card.query_selector("img")
                        if img_el:
                            img_url = img_el.get_attribute("src") or img_el.get_attribute("data-src") or ""

                        if type_text or price_text:
                            raw_listings.append({
                                "source": "magicbricks",
                                "title": type_text,
                                "price_text": price_text,
                                "area": "",
                                "description": f"{type_text} in {loc_text}. {status_text}".strip(),
                                "location": loc_text or city["name"],
                                "phone": _extract_phone(type_text + " " + loc_text),
                                "images": [img_url] if img_url else [],
                                "url": "",
                            })
                            count += 1
                    except Exception:
                        continue

                print(f"    Found {count} listings")
            except PwTimeout:
                print(f"    Timeout loading {city['name']}")
            except Exception as e:
                print(f"    Error: {e}")
            time.sleep(REQUEST_DELAY)
    finally:
        context.close()

    print(f"  [MagicBricks] Total: {len(raw_listings)} raw listings")
    return raw_listings


# ---------------------------------------------------------------------------
# 99acres — Playwright
# ---------------------------------------------------------------------------
def scrape_99acres() -> list[dict]:
    raw_listings = []
    context, page = _new_page()

    try:
        for city in KERALA_CITIES:
            print(f"  [99acres] {city['name']}...")
            url = f"https://www.99acres.com/property-for-rent-in-{city['slug_99']}"
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)
                _scroll_load(page)

                # Try multiple selector patterns
                cards = page.query_selector_all(
                    "[class*='tupleMaxInfo'], [class*='nortp-listing'], [class*='listing-card']"
                )
                if not cards:
                    cards = page.query_selector_all("[class*='property-card']")

                count = 0
                for card in cards[:MAX_LISTINGS_PER_SOURCE // len(KERALA_CITIES)]:
                    try:
                        def _text_99(selectors):
                            for sel in selectors:
                                el = card.query_selector(sel)
                                if el:
                                    return el.inner_text().strip()
                            return ""

                        title = _text_99(["h2", "[class*='title']", ".headingOfProperty"])
                        price_text = _text_99(["[class*='price']", ".listStrongSpo"])
                        loc = _text_99(["[class*='loc']", ".locTxt"])

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
                                "phone": _extract_phone(title),
                                "images": [img_url] if img_url else [],
                                "url": "",
                            })
                            count += 1
                    except Exception:
                        continue

                print(f"    Found {count} listings")
            except PwTimeout:
                print(f"    Timeout loading {city['name']}")
            except Exception as e:
                print(f"    Error: {e}")
            time.sleep(REQUEST_DELAY)
    finally:
        context.close()

    print(f"  [99acres] Total: {len(raw_listings)} raw listings")
    return raw_listings


# ---------------------------------------------------------------------------
# Housing.com — Playwright
# ---------------------------------------------------------------------------
def scrape_housing() -> list[dict]:
    raw_listings = []
    context, page = _new_page()

    try:
        for city in KERALA_CITIES:
            print(f"  [Housing.com] {city['name']}...")
            url = f"https://housing.com/property-for-rent/{city['slug_housing']}"
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)
                _scroll_load(page)

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
                                "phone": _extract_phone(title),
                                "images": [img_url] if img_url else [],
                                "url": "",
                            })
                            count += 1
                    except Exception:
                        continue

                print(f"    Found {count} listings")
            except PwTimeout:
                print(f"    Timeout loading {city['name']}")
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
