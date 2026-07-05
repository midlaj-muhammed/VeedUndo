"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithLocation, District } from "@/lib/types";
import { getRecentlyViewed } from "@/lib/utils";
import BrowseFilters from "@/components/BrowseFilters";
import ListingCard, { ListingCardSkeleton } from "@/components/ListingCard";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [listings, setListings] = useState<ListingWithLocation[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recentListings, setRecentListings] = useState<ListingWithLocation[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ listingMode: "", propertyCategory: "", districtId: "", subDistrictId: "", rentRange: "", priceRange: "", houseType: "", posterType: "", search: "", sort: "" });
  const PAGE_SIZE = 20;

  useEffect(() => {
    supabase.from("districts").select("*").order("name").then(({ data }) => { if (data) setDistricts(data); });
    // Fetch recently viewed listings
    const recentIds = getRecentlyViewed();
    if (recentIds.length > 0) {
      supabase.from("listings").select("*, sub_districts!inner(*, districts!inner(*))").in("id", recentIds).eq("status", "active").then(({ data }) => {
        if (data) {
          const ordered = recentIds.map(id => data.find(l => l.id === id)).filter(Boolean) as ListingWithLocation[];
          setRecentListings(ordered);
        }
      });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    setHasMore(true);
    fetchListings(0);
  }, [filters]);

  async function fetchListings(offset: number) {
    const cutoffISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase.from("listings").select("*, sub_districts!inner(*, districts!inner(*))").or(`status.eq.active,and(status.eq.rented,rented_at.gte.${cutoffISO})`);
    if (filters.listingMode) query = query.eq("listing_mode", filters.listingMode);
    if (filters.propertyCategory) query = query.eq("property_category", filters.propertyCategory);
    if (filters.subDistrictId) query = query.eq("sub_district_id", filters.subDistrictId);
    else if (filters.districtId) query = query.eq("sub_districts.district_id", filters.districtId);
    if (filters.houseType) query = query.eq("house_type", filters.houseType);
    if (filters.posterType) query = query.eq("poster_type", filters.posterType);
    if (filters.rentRange) { const [min, max] = filters.rentRange.split("-").map(Number); query = query.gte("rent_max", min).lte("rent_min", max); }
    if (filters.priceRange) { const [min, max] = filters.priceRange.split("-").map(Number); query = query.gte("price", min).lte("price", max); }
    if (filters.search) {
      const tsQuery = filters.search.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(" & ");
      query = query.or(`description_tsv.fts.${tsQuery},description.ilike.%${filters.search}%`);
    }
    const sortCol = filters.sort === "price_asc" || filters.sort === "price_desc" ? "price" : "created_at";
    query = query.order(sortCol, { ascending: filters.sort === "price_asc", nullsFirst: filters.sort.startsWith("price") ? false : undefined });
    query = query.range(offset, offset + PAGE_SIZE - 1);
    const { data, error: err } = await query;
    if (err) { setError("Failed to load listings."); setListings([]); }
    else {
      const rows = (data as ListingWithLocation[]) || [];
      setListings(offset === 0 ? rows : (prev) => [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "VeedUndo",
            url: "https://veedundo.com",
            description: "Kerala's hyperlocal rental board. Find houses, apartments, and rooms for rent directly from owners.",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://veedundo.com/?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <Navbar />
      {/* Hero — Editorial Luxury, macro-whitespace */}
      <header className="hero-gradient">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-40">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[var(--color-primary)] mb-6">Kerala Rental Board</p>
            <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-bold text-[var(--color-text)] mb-6 leading-[0.9] tracking-[-0.03em]">
              Find your next
              <br />
              <span style={{ fontFamily: "var(--font-serif)" }} className="italic font-normal leading-[1.05] text-[var(--color-primary)]">home.</span>
            </h1>
            <p className="text-lg sm:text-xl text-[var(--color-text-muted)] max-w-lg mb-10 leading-relaxed">
              Browse houses, apartments, and rooms for rent across Kerala. Direct from owners.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/post" className="press-effect btn btn-primary text-[15px] px-7 py-3">
                Post a Listing
              </Link>
              <a href="#listings" className="press-effect btn btn-secondary text-[15px] px-7 py-3">
                Browse
              </a>
            </div>
          </div>
        </div>
      </header>

      <main id="listings" className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 sm:py-24">
        {/* Recently Viewed */}
        {recentListings.length > 0 && !filters.search && !filters.districtId && !filters.subDistrictId && !filters.rentRange && !filters.priceRange && !filters.houseType && !filters.posterType && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Recently Viewed</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recentListings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
          </div>
        )}
        <BrowseFilters districts={districts} filters={filters} onChange={setFilters} />
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
        ) : error ? (
          <div className="text-center py-16"><p className="text-[var(--color-destructive)] mb-2">{error}</p><button onClick={() => window.location.reload()} className="text-sm text-[var(--color-primary)] hover:underline min-h-[44px]">Try again</button></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
            <svg className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008V10.5zm0 3h.008v.008h-.008V13.5zm0 3h.008v.008h-.008V16.5z" /></svg>
            <p className="text-lg font-medium mb-1">No listings found</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Try different filters or be the first to post.</p>
            <Link href="/post" className="press-effect inline-block rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] min-h-[44px]">Post a Listing</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">{listings.length} listing{listings.length !== 1 ? "s" : ""} found</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => { setLoadingMore(true); fetchListings(listings.length); }}
                  disabled={loadingMore}
                  className="rounded-full border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50 min-h-[40px]"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
