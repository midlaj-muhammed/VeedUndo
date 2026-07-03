"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithLocality } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";
import { daysLeft } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<ListingWithLocality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => {
    supabase.from("listings").select("*, localities(*)").eq("id", id).single()
      .then(({ data, error: err }) => {
        if (err) setError("Failed to load listing.");
        else setListing(data as ListingWithLocality);
        setLoading(false);
      });
  }, [id]);

  async function handleFlag() {
    setFlagging(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Please sign in to flag."); setFlagging(false); return; }
    const { error: flagError } = await supabase.from("listing_flags").insert({ listing_id: id as string, flagger_email: session.user.email });
    if (!flagError) setFlagged(true);
    setFlagging(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-dvh">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"><div className="max-w-3xl mx-auto flex items-center justify-between"><Link href="/" className="text-lg font-bold text-[var(--color-primary)]">VeedUndo</Link><ThemeToggle /></div></div>
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
          <div className="skeleton h-64 sm:h-80 w-full rounded-2xl" /><div className="skeleton h-8 w-48" /><div className="skeleton h-4 w-32" /><div className="skeleton h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-4">
        <p className="text-lg font-medium text-[var(--color-text)]">{error || "Listing not found"}</p>
        <Link href="/" className="text-[var(--color-primary)] hover:underline">Back to browse</Link>
      </div>
    );
  }

  const days = daysLeft(listing.expires_at);
  const locality = listing.localities;
  const imgAlt = `${HOUSE_TYPE_LABELS[listing.house_type]} in ${locality?.name}`;

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--color-primary)]">VeedUndo</Link>
          <span className="text-sm text-[var(--color-text-dim)]">/</span>
          <span className="text-sm text-[var(--color-text-muted)] truncate">{locality?.name}</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {listing.image_urls?.length > 0 && (
          <div className="mb-6">
            <img src={listing.image_urls[selectedImg]} alt={imgAlt} className="w-full h-64 sm:h-80 object-cover rounded-2xl" />
            {listing.image_urls.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {listing.image_urls.map((url, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)} className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${i === selectedImg ? "border-[var(--color-primary)]" : "border-transparent hover:border-[var(--color-border)]"}`}>
                    <img src={url} alt={imgAlt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{locality?.name}, {locality?.city}</p>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">₹{listing.rent_min.toLocaleString("en-IN")}–{listing.rent_max.toLocaleString("en-IN")}<span className="text-base font-normal text-[var(--color-text-muted)]"> /month</span></h1>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${days > 3 ? "bg-green-500/10 text-green-600 dark:text-green-400" : days > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>{days > 0 ? `${days}d left` : "Expired"}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-sm font-medium text-[var(--color-text)]">{HOUSE_TYPE_LABELS[listing.house_type]}</span>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${listing.poster_type === "owner" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>{listing.poster_type === "owner" ? "Owner" : "Broker"}</span>
        </div>
        {listing.description && <p className="text-[var(--color-text)] mb-6 whitespace-pre-wrap leading-relaxed">{listing.description}</p>}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-6">
          <h2 className="font-bold mb-4 text-lg text-[var(--color-text)]">Contact</h2>
          {listing.poster_whatsapp && (
            <a href={`https://wa.me/91${listing.poster_whatsapp.replace(/^0/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] px-5 py-3 text-sm font-medium text-white hover:bg-[#1da851] transition-colors mb-3 cursor-pointer press-effect">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat on WhatsApp
            </a>
          )}
          {listing.poster_phone && (
            <a href={`tel:${listing.poster_phone}`} className="flex items-center justify-center gap-2 w-full rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors mb-2 cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              {listing.poster_phone}
            </a>
          )}
          <p className="text-sm text-[var(--color-text-muted)] text-center">{listing.poster_email}</p>
        </div>
        <div className="text-center">
          {flagged ? <p className="text-sm text-[var(--color-text-muted)]">Thanks for reporting.</p> : (
            <button onClick={handleFlag} disabled={flagging} className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-destructive)] underline disabled:opacity-50 cursor-pointer">
              {flagging ? "Reporting..." : "No longer available?"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
