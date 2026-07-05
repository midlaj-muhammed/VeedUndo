"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ListingWithLocation } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";
import { timeAgo, shareListing } from "@/lib/utils";
import ImageLightbox from "@/components/ImageLightbox";
import Navbar from "@/components/Navbar";
import { motion } from "motion/react";

export default function ListingDetailClient({ initialListing }: { initialListing: ListingWithLocation | null }) {
  const [listing, setListing] = useState<ListingWithLocation | null>(initialListing);
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!listing) return (<div className="flex flex-col min-h-dvh"><Navbar /><div className="flex-1 flex flex-col items-center justify-center gap-4 px-4"><p className="text-lg font-medium text-[var(--color-text)]">Listing not found</p><Link href="/" className="text-[var(--color-primary)] hover:underline min-h-[44px] flex items-center">Back to browse</Link></div></div>);

  const isRented = listing.status === "rented";
  const subDistrict = listing.sub_districts;
  const district = subDistrict?.districts;
  const locationText = subDistrict ? (district ? `${subDistrict.name}, ${district.name}` : subDistrict.name) : district?.name || "";
  const imgAlt = `${HOUSE_TYPE_LABELS[listing.house_type]} in ${locationText}`;

  async function handleFlag() {
    setFlagging(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Please sign in to flag."); setFlagging(false); return; }
    const { error: flagError } = await supabase.from("listing_flags").insert({ listing_id: listing!.id, flagger_email: session.user.email });
    if (!flagError) setFlagged(true);
    setFlagging(false);
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar variant="detail" locationText={locationText} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12">
        {listing.image_urls?.length > 0 && (
          <div className="mb-6">
            <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
              <Image src={listing.image_urls[selectedImg]} alt={imgAlt} fill sizes="(max-width: 768px) 100vw, 768px" className={`object-cover ${isRented ? "grayscale" : ""}`} />
              {isRented && (<div className="absolute inset-0 bg-black/30 flex items-center justify-center"><span className="rounded-full bg-white/90 px-5 py-2 text-sm font-bold text-gray-800">Rented</span></div>)}
            </div>
            {listing.image_urls.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                {listing.image_urls.map((url, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)} aria-label={`View image ${i + 1}`} className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer min-w-[44px] min-h-[44px] ${i === selectedImg ? "border-[var(--color-primary)]" : "border-transparent hover:border-[var(--color-border)]"}`}>
                    <Image src={url} alt={imgAlt} width={64} height={64} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }} className="mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text)] mb-2 tracking-[-0.03em]">
            ₹{listing.rent_min.toLocaleString("en-IN")}–{listing.rent_max.toLocaleString("en-IN")}<span className="text-xl font-normal text-[var(--color-text-muted)]"> /mo</span>
          </h1>
          <p className="text-base text-[var(--color-text-muted)]">{HOUSE_TYPE_LABELS[listing.house_type]} {locationText ? `· ${locationText}` : ""}</p>
        </motion.div>
        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-[var(--color-text-dim)]">
          <span className={`badge ${listing.poster_type === "owner" ? "badge-active" : "badge-flagged"}`}>{listing.poster_type === "owner" ? "Owner" : "Broker"}</span>
          <span className="text-xs tracking-wide">Posted {timeAgo(listing.created_at)}</span>
        </div>
        {isRented && (<div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-4 flex items-center gap-3"><svg className="w-6 h-6 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><div><p className="font-semibold text-green-600 dark:text-green-400">This listing has been rented</p><p className="text-sm text-[var(--color-text-muted)]">The poster has marked this property as no longer available.</p></div></div>)}
        {listing.description && (<div className="mb-6"><h2 className="font-semibold text-[var(--color-text)] mb-2">Description</h2><p className="text-[var(--color-text-dim)] whitespace-pre-wrap leading-relaxed">{listing.description}</p></div>)}
        {!isRented && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }} className="card-base rounded-2xl p-6 mb-8">
            <h2 className="font-semibold text-[var(--color-text)] mb-4 text-lg">Contact</h2>
            <div className="space-y-3">
              {listing.poster_whatsapp && (<a href={`https://wa.me/91${listing.poster_whatsapp.replace(/^0/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1da851] transition-all duration-300 cursor-pointer press-effect min-h-[44px] shadow-sm hover:shadow-md"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Chat on WhatsApp</a>)}
              {listing.poster_phone && (<a href={`tel:${listing.poster_phone}`} className="flex items-center justify-center gap-2 w-full btn btn-secondary"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>{listing.poster_phone}</a>)}
              <button onClick={() => shareListing(listing)} className="flex items-center justify-center gap-2 w-full btn btn-secondary"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>Share this listing</button>
              <p className="text-sm text-[var(--color-text-muted)] text-center pt-1">{listing.poster_email}</p>
            </div>
          </motion.div>
        )}
        {!isRented && (<div className="text-center pb-4">{flagged ? (<p className="text-sm text-[var(--color-text-muted)]">Thanks for reporting.</p>) : (<button onClick={handleFlag} disabled={flagging} className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-destructive)] underline disabled:opacity-50 cursor-pointer min-h-[44px]">{flagging ? "Reporting..." : "No longer available?"}</button>)}</div>)}
      </main>
      {lightboxOpen && listing.image_urls?.length > 0 && (<ImageLightbox images={listing.image_urls} alt={imgAlt} initialIndex={selectedImg} onClose={() => setLightboxOpen(false)} />)}
    </div>
  );
}
