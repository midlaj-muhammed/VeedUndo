"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithLocation, District } from "@/lib/types";
import BrowseFilters from "@/components/BrowseFilters";
import ListingCard, { ListingCardSkeleton } from "@/components/ListingCard";

export default function Home() {
  const [listings, setListings] = useState<ListingWithLocation[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ districtId: "", subDistrictId: "", rentRange: "", houseType: "", posterType: "" });

  useEffect(() => {
    supabase.from("districts").select("*").order("name").then(({ data }) => { if (data) setDistricts(data); });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const cutoffISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase.from("listings").select("*, sub_districts!inner(*, districts!inner(*))").or(`status.eq.active,and(status.eq.rented,rented_at.gte.${cutoffISO})`).order("created_at", { ascending: false }).limit(50);
    if (filters.subDistrictId) query = query.eq("sub_district_id", filters.subDistrictId);
    else if (filters.districtId) query = query.eq("sub_districts.district_id", filters.districtId);
    if (filters.houseType) query = query.eq("house_type", filters.houseType);
    if (filters.posterType) query = query.eq("poster_type", filters.posterType);
    if (filters.rentRange) { const [min, max] = filters.rentRange.split("-").map(Number); query = query.gte("rent_max", min).lte("rent_min", max); }
    query.then(({ data, error: err }) => {
      if (err) { setError("Failed to load listings."); setListings([]); } else { setListings((data as ListingWithLocation[]) || []); }
      setLoading(false);
    });
  }, [filters]);

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Hero */}
      <header className="hero-gradient border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text)] mb-3">
            <span className="text-[var(--color-primary)]">VeedUndo</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-muted)] max-w-xl mx-auto mb-8">
            Kerala&apos;s hyperlocal rental board. Find houses for rent near you.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/post" className="press-effect rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] shadow-lg shadow-[var(--color-primary)]/20">+ Post a Listing</Link>
            <a href="#listings" className="press-effect rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary)]">Browse Listings</a>
          </div>
        </div>
      </header>

      <main id="listings" className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
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
            <Link href="/post" className="press-effect inline-block rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] min-h-[44px]">Post a Listing</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">{listings.length} listing{listings.length !== 1 ? "s" : ""} found</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
          </>
        )}
      </main>
    </div>
  );
}
