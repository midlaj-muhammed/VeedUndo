"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";
import { daysLeft } from "@/lib/utils";

export default function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.email) {
        loadListings(data.session.user.email);
      } else {
        setLoading(false);
      }
    });
  }, []);

  async function loadListings(email: string) {
    const { data, error: err } = await supabase
      .from("listings")
      .select("id, locality_id, rent_min, rent_max, house_type, poster_type, status, expires_at, created_at")
      .eq("poster_email", email)
      .order("created_at", { ascending: false });
    if (err) {
      setError("Failed to load listings.");
    }
    setListings((data as Listing[]) || []);
    setLoading(false);
  }

  async function renew(listingId: string) {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) return;
    const res = await fetch("/api/renew", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });
    if (res.ok && s.user?.email) loadListings(s.user.email);
  }

  async function confirmAvailable(listingId: string) {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) return;
    const res = await fetch("/api/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });
    if (res.ok && s.user?.email) loadListings(s.user.email);
  }

  async function markRented(listingId: string) {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) return;
    const { error: err } = await supabase
      .from("listings")
      .update({ status: "rented" })
      .eq("id", listingId)
      .eq("poster_email", s.user.email);
    if (!err && s.user?.email) loadListings(s.user.email);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[var(--color-text-muted)]">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4">
        <p>Sign in to view your listings.</p>
        <Link href="/auth" className="text-[var(--color-primary)] underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[var(--color-primary)]">
            VeedUndo
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-muted)]">{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="text-xs text-[var(--color-text-muted)] hover:text-red-600">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Listings</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {listings.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">You haven&apos;t posted any listings yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map((l) => {
              const days = daysLeft(l.expires_at);
              return (
                <div
                  key={l.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {HOUSE_TYPE_LABELS[l.house_type]} — ₹{l.rent_min.toLocaleString("en-IN")}–{l.rent_max.toLocaleString("en-IN")}
                      </p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.status === "active"
                          ? "bg-green-50 text-green-700"
                          : l.status === "expired"
                          ? "bg-gray-100 text-gray-600"
                          : l.status === "flagged"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {l.status}
                        {l.status === "active" && ` — ${days}d left`}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {l.status === "active" && (
                        <button
                          onClick={() => renew(l.id)}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-bg)]"
                        >
                          Renew 10 days
                        </button>
                      )}
                      {l.status === "flagged" && (
                        <button
                          onClick={() => confirmAvailable(l.id)}
                          className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Still available
                        </button>
                      )}
                      {(l.status === "active" || l.status === "expired") && (
                        <button
                          onClick={() => markRented(l.id)}
                          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Mark rented
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
