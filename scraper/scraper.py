"""Scrapes property listing pages from Indian real estate sites."""

import time
import requests
from bs4 import BeautifulSoup
from config import USER_AGENT, REQUEST_DELAY, MAX_LISTINGS_PER_SOURCE


def _get(url: str) -> BeautifulSoup | None:
    """Fetch a URL and return parsed HTML."""
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        print(f"  [fetch error] {url}: {e}")
        return None


def _extract_phone(text: str) -> str | None:
    """Extract Indian phone number from text."""
    import re
    match = re.search(r'(?:\+91[-\s]?)?[6-9]\d{9}', text)
    return match.group(0).replace("+91", "").replace("-", "").replace(" ", "") if match else None


def scrape_magicbricks(location: str = "kerala") -> list[dict]:
    """Scrape rental listings from MagicBricks."""
    print(f"[MagicBricks] Scraping {location}...")
    raw_listings = []
    url = f"https://www.magicbricks.com/property-for-rent/residential-real-estate?city={location}"
    soup = _get(url)
    if not soup:
        return raw_listings

    cards = soup.select(".mb-srp__card") or soup.select("[data-aid='srp-card']")
    for card in cards[:MAX_LISTINGS_PER_SOURCE]:
        try:
            title_el = card.select_one(".mb-srp__card__title") or card.select_one("h2")
            title = title_el.get_text(strip=True) if title_el else ""

            price_el = card.select_one(".mb-srp__card__price") or card.select_one("[data-aid='srp-card-price']")
            price_text = price_el.get_text(strip=True) if price_el else ""

            area_el = card.select_one(".mb-srp__card__area") or card.select_one("[data-aid='srp-card-area']")
            area = area_el.get_text(strip=True) if area_el else ""

            desc_el = card.select_one(".mb-srp__card__desc")
            desc = desc_el.get_text(strip=True) if desc_el else ""

            loc_el = card.select_one(".mb-srp__card__loc") or card.select_one("[data-aid='srp-card-loc']")
            loc = loc_el.get_text(strip=True) if loc_el else ""

            phone_el = card.select_one("[data-aid='srp-card-phone']")
            phone = phone_el.get_text(strip=True) if phone_el else None

            img_el = card.select_one("img")
            img_url = img_el.get("src", "") if img_el else ""

            raw_listings.append({
                "source": "magicbricks",
                "title": title,
                "price_text": price_text,
                "area": area,
                "description": desc,
                "location": loc,
                "phone": phone or _extract_phone(title + " " + desc),
                "images": [img_url] if img_url else [],
                "url": "",
            })
        except Exception:
            continue

    print(f"  [MagicBricks] Found {len(raw_listings)} raw listings")
    return raw_listings


def scrape_99acres(location: str = "kerala") -> list[dict]:
    """Scrape rental listings from 99acres."""
    print(f"[99acres] Scraping {location}...")
    raw_listings = []
    url = f"https://www.99acres.com/property-for-rent-in-{location}"
    soup = _get(url)
    if not soup:
        return raw_listings

    cards = soup.select(".tupleMaxInfo") or soup.select(".nortp-listing")
    for card in cards[:MAX_LISTINGS_PER_SOURCE]:
        try:
            title_el = card.select_one(".headingOfProperty") or card.select_one("h2")
            title = title_el.get_text(strip=True) if title_el else ""

            price_el = card.select_one(".listStrongSpo") or card.select_one("[class*='price']")
            price_text = price_el.get_text(strip=True) if price_el else ""

            desc_el = card.select_one(".listing-txt") or card.select_one("[class*='desc']")
            desc = desc_el.get_text(strip=True) if desc_el else ""

            loc_el = card.select_one(".locTxt") or card.select_one("[class*='loc']")
            loc = loc_el.get_text(strip=True) if loc_el else ""

            img_el = card.select_one("img")
            img_url = img_el.get("src", "") if img_el else ""

            link_el = card.select_one("a[href]")
            listing_url = link_el["href"] if link_el and link_el.has_attr("href") else ""

            raw_listings.append({
                "source": "99acres",
                "title": title,
                "price_text": price_text,
                "area": "",
                "description": desc,
                "location": loc,
                "phone": _extract_phone(title + " " + desc),
                "images": [img_url] if img_url else [],
                "url": listing_url,
            })
        except Exception:
            continue

    print(f"  [99acres] Found {len(raw_listings)} raw listings")
    return raw_listings


def scrape_housing(location: str = "kerala") -> list[dict]:
    """Scrape rental listings from Housing.com."""
    print(f"[Housing.com] Scraping {location}...")
    raw_listings = []
    url = f"https://housing.com/property-for-rent?city={location}"
    soup = _get(url)
    if not soup:
        return raw_listings

    cards = soup.select("[class*='listing']") or soup.select("article")
    for card in cards[:MAX_LISTINGS_PER_SOURCE]:
        try:
            title_el = card.select_one("h2") or card.select_one("[class*='title']")
            title = title_el.get_text(strip=True) if title_el else ""

            price_el = card.select_one("[class*='price']")
            price_text = price_el.get_text(strip=True) if price_el else ""

            desc_el = card.select_one("[class*='desc']")
            desc = desc_el.get_text(strip=True) if desc_el else ""

            loc_el = card.select_one("[class*='loc']")
            loc = loc_el.get_text(strip=True) if loc_el else ""

            img_el = card.select_one("img")
            img_url = img_el.get("src", "") if img_el else ""

            raw_listings.append({
                "source": "housing",
                "title": title,
                "price_text": price_text,
                "area": "",
                "description": desc,
                "location": loc,
                "phone": _extract_phone(title + " " + desc),
                "images": [img_url] if img_url else [],
                "url": "",
            })
        except Exception:
            continue

    print(f"  [Housing.com] Found {len(raw_listings)} raw listings")
    return raw_listings


def scrape_all() -> list[dict]:
    """Run all scrapers and return combined raw listings."""
    all_listings = []
    for scraper_fn in [scrape_magicbricks, scrape_99acres, scrape_housing]:
        try:
            all_listings.extend(scraper_fn())
        except Exception as e:
            print(f"  [scraper error] {scraper_fn.__name__}: {e}")
        time.sleep(REQUEST_DELAY)
    return all_listings
