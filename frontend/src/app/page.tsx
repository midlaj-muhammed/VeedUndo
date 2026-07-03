"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithLocality, Locality } from "@/lib/types";
import BrowseFilters from "@/components/BrowseFilters";
import ListingCard from "@/components/ListingCard";

export default function Home() {
  const [listings, setListings] = useState<ListingWithLocality[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    localityId: "",
    rentRange: "",
    houseType: "",
    posterType: "",
  });

  useEffect(() => {
    supabase
      .from("localities")
      .select("*")
      .order("name")
      .then(({ data, error: err }) => {
        if (data) setLocalities(data);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    let query = supabase
      .from("listings")
      .select("*, localities(*)")
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (filters.localityId) {
      query = query.eq("locality_id", filters.localityId);
    }
    if (filters.houseType) {
      query = query.eq("house_type", filters.houseType);
    }
    if (filters.posterType) {
      query = query.eq("poster_type", filters.posterType);
    }
    if (filters.rentRange) {
      const [min, max] = filters.rentRange.split("-").map(Number);
      query = query.gte("rent_max", min).lte("rent_min", max);
    }

    query.then(({ data, error: err }) => {
      if (err) {
        setError("Failed to load listings.");
        setListings([]);
      } else {
        setListings((data as ListingWithLocality[]) || []);
      }
      setLoading(false);
    });
  }, [filters]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[var(--color-primary)]">
            VeedUndo
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            >
              My Listings
            </Link>
            <Link
              href="/post"
              className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              + Post Listing
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">Available Houses</h2>
        <p className="text-[var(--color-text-muted)] mb-8">
          Browse rentals near you in Kerala.
        </p>

        <BrowseFilters
          localities={localities}
          filters={filters}
          onChange={setFilters}
        />

        {loading ? (
          <div className="text-center py-16 text-[var(--color-text-muted)]">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-text-muted)]">
            <p className="text-lg mb-2">No listings found</p>
            <p className="text-sm">
              Try different filters or{" "}
              <Link
                href="/post"
                className="text-[var(--color-primary)] underline"
              >
                post a listing
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
