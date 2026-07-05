"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import ListingCard, { ListingCardSkeleton } from "@/components/ListingCard";
import type { ListingWithLocation } from "@/lib/types";

export default function SavedPage() {
  const [listings, setListings] = useState<ListingWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: saves } = await supabase
        .from("saved_listings")
        .select("listing_id")
        .eq("user_id", user.id);

      if (!saves || saves.length === 0) { setListings([]); setLoading(false); return; }

      const ids = saves.map(s => s.listing_id);
      const { data } = await supabase
        .from("listings")
        .select("*, sub_districts(*, districts(*))")
        .in("id", ids);

      setListings((data as ListingWithLocation[]) || []);
      setLoading(false);
    })();
  }, [router]);

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 tracking-[-0.02em]">
          Saved listings
        </h1>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <ListingCardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 card-base rounded-2xl">
            <svg className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
            <p className="text-lg font-medium mb-1 text-[var(--color-text)]">No saved listings</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Tap the heart icon on any listing to save it here.</p>
            <a href="/" className="btn btn-primary px-6 py-3">Browse listings</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </main>
    </div>
  );
}
