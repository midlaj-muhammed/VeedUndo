"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { HOUSE_TYPE_LABELS, LISTING_MODE_LABELS, FURNISHING_LABELS } from "@/lib/types";
import { daysLeft } from "@/lib/utils";
import type { Session } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "motion/react";

export default function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rent_min: "", rent_max: "", price: "", house_type: "", description: "", poster_phone: "", poster_whatsapp: "", bedrooms: "", furnishing: "unfurnished", area_sqft: "" });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (data.session?.user?.email) loadListings(data.session.user.email); else setLoading(false); }); }, []);

  async function loadListings(email: string) {
    const { data, error: err } = await supabase.from("listings").select("id, rent_min, rent_max, price, house_type, poster_type, status, listing_mode, property_category, bedrooms, furnishing, area_sqft, plot_area_acres, road_frontage_ft, zoning, built_up_sqft, floor_number, parking, expires_at, created_at, image_urls").eq("poster_email", email).order("created_at", { ascending: false });
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

  function startEdit(l: Listing) {
    setEditingId(l.id);
    setEditForm({ rent_min: String(l.rent_min), rent_max: String(l.rent_max), price: String(l.price || ""), house_type: l.house_type, description: l.description || "", poster_phone: l.poster_phone || "", poster_whatsapp: l.poster_whatsapp || "", bedrooms: String(l.bedrooms || ""), furnishing: l.furnishing || "unfurnished", area_sqft: String(l.area_sqft || "") });
  }

  async function saveEdit() {
    if (!session || !editingId) return;
    setSaving(true);
    const res = await fetch("/api/edit", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ listing_id: editingId, ...editForm, rent_min: Number(editForm.rent_min), rent_max: Number(editForm.rent_max), price: editForm.price ? Number(editForm.price) : null, bedrooms: editForm.bedrooms ? Number(editForm.bedrooms) : null, furnishing: editForm.furnishing, area_sqft: editForm.area_sqft ? Number(editForm.area_sqft) : null }) });
    setSaving(false);
    if (res.ok) { showFeedback("Listing updated!"); setEditingId(null); if (session.user?.email) loadListings(session.user.email); }
    else { const data = await res.json(); showFeedback(data.error || "Failed to update"); }
  }

  async function deleteListing(id: string) {
    if (!session || !confirm("Delete this listing? This cannot be undone.")) return;
    const res = await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ listing_id: id }) });
    if (res.ok) { showFeedback("Listing deleted."); if (session.user?.email) loadListings(session.user.email); }
    else { const data = await res.json(); showFeedback(data.error || "Failed to delete"); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-dvh text-[var(--color-text-muted)]">Loading...</div>;
  if (!session) return <div className="flex flex-col min-h-dvh items-center justify-center gap-4 px-4"><p className="text-[var(--color-text)]">Sign in to view your listings.</p><Link href="/auth" className="text-[var(--color-primary)] underline min-h-[44px] flex items-center">Sign in</Link></div>;

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-[var(--color-text)] tracking-[-0.02em]">My Listings</h1>
        {/* Status filter tabs */}
        {listings.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {[
              { full: "All", short: "All" },
              { full: "Active", short: "Live" },
              { full: "Expired", short: "Exp" },
              { full: "Flagged", short: "Flag" },
              { full: "Rented", short: "Rented" },
              { full: "Sold", short: "Sold" },
            ].map(({ full, short }) => {
              const count = full === "All" ? listings.length : listings.filter(l => l.status === full.toLowerCase()).length;
              return (
                <button
                  key={full}
                  onClick={() => setStatusFilter(full)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all min-h-[40px] ${
                    statusFilter === full
                      ? "text-white"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)]"
                  }`}
                >
                  {statusFilter === full && (
                    <motion.div
                      layoutId="dashboard-tab"
                      className="absolute inset-0 rounded-full bg-[var(--color-primary)]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    <span className="hidden sm:inline">{full} ({count})</span>
                    <span className="sm:hidden">{short} ({count})</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {error && <p className="text-[var(--color-destructive)] mb-4">{error}</p>}
        {feedback && <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">{feedback}</div>}
        {listings.length === 0 ? (
          <div className="text-center py-20 card-base rounded-2xl">
            <svg className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-lg font-medium mb-1 text-[var(--color-text)]">No listings yet</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Post your first rental listing to get started.</p>
            <Link href="/post" className="press-effect btn btn-primary px-6 py-3">Post a Listing</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
            {listings.filter(l => statusFilter === "All" || l.status === statusFilter.toLowerCase()).map((l) => { const days = daysLeft(l.expires_at); return (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="card-base rounded-2xl p-4"
              >
                <div className="flex items-start gap-4">
                  {l.image_urls?.[0] && <img src={l.image_urls[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">{HOUSE_TYPE_LABELS[l.house_type as keyof typeof HOUSE_TYPE_LABELS] || l.house_type} <span className={`ml-1 text-xs font-medium rounded-full px-2 py-0.5 ${l.listing_mode === "sell" ? "bg-green-500/10 text-green-600" : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"}`}>{LISTING_MODE_LABELS[l.listing_mode || "rent"]}</span></p>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">
                      {l.listing_mode === "sell" && l.price ? `₹${l.price.toLocaleString("en-IN")}` : `₹${l.rent_min.toLocaleString("en-IN")}–${l.rent_max.toLocaleString("en-IN")}/mo`}
                      {l.bedrooms ? ` · ${l.bedrooms} Bed` : ""}
                      {l.area_sqft ? ` · ${l.area_sqft} sqft` : ""}
                    </p>
                    <span className={`badge ${l.status === "active" ? "badge-active" : l.status === "expired" ? "badge-expired" : l.status === "flagged" ? "badge-flagged" : l.status === "sold" ? "badge-sold" : "badge-rented"}`}>{l.status}{l.status === "active" && ` · ${days}d left`}</span>
                    <div className="flex gap-2 flex-wrap mt-3">
                      {l.status === "active" && <button onClick={() => renew(l.id)} className="btn btn-sm btn-secondary press-effect">Renew</button>}
                      {l.status === "flagged" && <button onClick={() => confirmAvailable(l.id)} className="btn btn-sm btn-primary press-effect">Confirm</button>}
                      {(l.status === "active" || l.status === "expired") && l.listing_mode !== "sell" && <button onClick={() => markRented(l.id)} className="btn btn-sm btn-primary press-effect">Rented</button>}
                      {(l.status === "active" || l.status === "expired") && l.listing_mode === "sell" && <button onClick={() => markRented(l.id)} className="btn btn-sm btn-primary press-effect">Sold</button>}
                      <button onClick={() => startEdit(l)} className="btn btn-sm btn-secondary press-effect">Edit</button>
                      <button onClick={() => deleteListing(l.id)} className="btn btn-sm btn-destructive press-effect">Delete</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ); })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Edit Modal — premium treatment */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setEditingId(null)} role="dialog" aria-modal="true" aria-label="Edit listing">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-5">Edit Listing</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Min rent</label>
                  <input type="number" value={editForm.rent_min} onChange={(e) => setEditForm({ ...editForm, rent_min: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Max rent</label>
                  <input type="number" value={editForm.rent_max} onChange={(e) => setEditForm({ ...editForm, rent_max: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="input resize-none" placeholder="Optional description update" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Bedrooms</label>
                  <input type="number" min={0} value={editForm.bedrooms} onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value })} className="input" placeholder="e.g. 3" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Area (sqft)</label>
                  <input type="number" min={0} value={editForm.area_sqft} onChange={(e) => setEditForm({ ...editForm, area_sqft: e.target.value })} className="input" placeholder="e.g. 1200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Furnishing</label>
                  <select value={editForm.furnishing} onChange={(e) => setEditForm({ ...editForm, furnishing: e.target.value })} className="input">
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi_furnished">Semi-Furnished</option>
                    <option value="furnished">Furnished</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Phone</label>
                  <input type="tel" value={editForm.poster_phone} onChange={(e) => setEditForm({ ...editForm, poster_phone: e.target.value })} className="input" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">WhatsApp</label>
                  <input type="tel" value={editForm.poster_whatsapp} onChange={(e) => setEditForm({ ...editForm, poster_whatsapp: e.target.value })} className="input" placeholder="Optional" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingId(null)} className="flex-1 btn btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 btn btn-primary">{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
