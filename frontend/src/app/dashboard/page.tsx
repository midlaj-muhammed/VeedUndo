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
  const [feedback, setFeedback] = useState("");

  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (data.session?.user?.email) loadListings(data.session.user.email); else setLoading(false); }); }, []);

  async function loadListings(email: string) {
    const { data, error: err } = await supabase.from("listings").select("id, rent_min, rent_max, house_type, poster_type, status, expires_at, created_at, image_urls").eq("poster_email", email).order("created_at", { ascending: false });
    if (err) setError("Failed to load listings.");
    setListings((data as Listing[]) || []);
    setLoading(false);
  }

  function showFeedback(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(""), 3000); }

  async function renew(id: string) {
    if (!session) return;
    const res = await fetch("/api/renew", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ listing_id: id }) });
    if (res.ok) { showFeedback("Listing renewed!"); if (session.user?.email) loadListings(session.user.email); }
    else { const data = await res.json(); showFeedback(data.error || "Failed to renew"); }
  }
  async function confirmAvailable(id: string) {
    if (!session) return;
    const res = await fetch("/api/confirm", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ listing_id: id }) });
    if (res.ok) { showFeedback("Listing confirmed!"); if (session.user?.email) loadListings(session.user.email); }
    else { const data = await res.json(); showFeedback(data.error || "Failed to confirm"); }
  }
  async function markRented(id: string) {
    if (!session) return;
    const res = await fetch("/api/rented", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ listing_id: id }) });
    if (res.ok) { showFeedback("Marked as rented!"); if (session.user?.email) loadListings(session.user.email); }
    else { const data = await res.json(); showFeedback(data.error || "Failed to mark as rented"); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-dvh text-[var(--color-text-muted)]">Loading...</div>;
  if (!session) return <div className="flex flex-col min-h-dvh items-center justify-center gap-4 px-4"><p className="text-[var(--color-text)]">Sign in to view your listings.</p><Link href="/auth" className="text-[var(--color-primary)] underline min-h-[44px] flex items-center">Sign in</Link></div>;

  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-[var(--color-text)]">My Listings</h1>
        {error && <p className="text-[var(--color-destructive)] mb-4">{error}</p>}
        {feedback && <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">{feedback}</div>}
        {listings.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
            <svg className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-lg font-medium mb-1 text-[var(--color-text)]">No listings yet</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Post your first rental listing to get started.</p>
            <Link href="/post" className="press-effect inline-block rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] min-h-[44px]">Post a Listing</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map((l) => { const days = daysLeft(l.expires_at); return (
              <div key={l.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-start gap-4">
                  {l.image_urls?.[0] && <img src={l.image_urls[0]} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--color-text-muted)]">{HOUSE_TYPE_LABELS[l.house_type]} — ₹{l.rent_min.toLocaleString("en-IN")}–{l.rent_max.toLocaleString("en-IN")}</p>
                    <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${l.status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : l.status === "expired" ? "bg-gray-500/10 text-gray-600 dark:text-gray-400" : l.status === "flagged" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>{l.status}{l.status === "active" && ` — ${days}d left`}</span>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {l.status === "active" && <button onClick={() => renew(l.id)} className="press-effect rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-primary-light)] min-h-[44px]">Renew</button>}
                      {l.status === "flagged" && <button onClick={() => confirmAvailable(l.id)} className="press-effect rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white min-h-[44px]">Confirm</button>}
                      {(l.status === "active" || l.status === "expired") && <button onClick={() => markRented(l.id)} className="press-effect rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white min-h-[44px]">Rented</button>}
                    </div>
                  </div>
                </div>
              </div>
            ); })}
          </div>
        )}
      </main>
    </div>
  );
}
