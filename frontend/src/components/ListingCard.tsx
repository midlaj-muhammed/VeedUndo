"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ListingWithLocation } from "@/lib/types";
import { HOUSE_TYPE_LABELS, LISTING_MODE_LABELS, FURNISHING_LABELS } from "@/lib/types";
import { timeAgo, shareListing } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export function ListingCardSkeleton() {
  return (
    <div className="card-base group block rounded-2xl overflow-hidden">
      <div className="skeleton h-56 w-full" />
      <div className="p-4">
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-4 w-40 mb-2" />
        <div className="skeleton h-3.5 w-full mb-1.5" />
        <div className="skeleton h-3.5 w-3/4" />
      </div>
    </div>
  );
}

function SaveButton({ listingId }: { listingId: string }) {
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      setUserId(uid);
      supabase.from("saved_listings").select("id").eq("user_id", uid).eq("listing_id", listingId).single().then(({ data }) => {
        if (data) setSaved(true);
      });
    });
  }, [listingId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) { window.location.href = "/auth"; return; }
    if (saved) {
      await supabase.from("saved_listings").delete().eq("user_id", userId).eq("listing_id", listingId);
      setSaved(false);
    } else {
      await supabase.from("saved_listings").insert({ user_id: userId, listing_id: listingId });
      setSaved(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-sm"
      aria-label={saved ? "Unsave listing" : "Save listing"}
    >
      <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ color: saved ? "#ef4444" : "#6b7280" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}

export default memo(function ListingCard({ listing }: { listing: ListingWithLocation }) {
  const isRented = listing.status === "rented";
  const isSold = listing.status === "sold";
  const isUnavailable = isRented || isSold;
  const isSell = listing.listing_mode === "sell";
  const subDistrict = listing.sub_districts;
  const district = subDistrict?.districts;
  const locationText = subDistrict ? (district ? `${subDistrict.name}, ${district.name}` : subDistrict.name) : district?.name || "";
  const imgAlt = `${HOUSE_TYPE_LABELS[listing.house_type]} in ${locationText}`;

  return (
    <Link href={`/listing/${listing.id}`} className={`card-base group block rounded-2xl overflow-hidden ${isUnavailable ? "opacity-70" : ""}`}>
      <div className="relative w-full h-56 overflow-hidden">
        {listing.image_urls?.[0] ? (
          <Image src={listing.image_urls[0]} alt={imgAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={`object-cover transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isUnavailable ? "grayscale" : "group-hover:scale-105"}`} />
        ) : (
          <div className="w-full h-full bg-[var(--color-muted)] flex items-center justify-center">
            <svg className="w-12 h-12 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008V10.5zm0 3h.008v.008h-.008V13.5zm0 3h.008v.008h-.008V16.5z" /></svg>
          </div>
        )}
        {/* Mode badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-md ${isSell ? "bg-green-500/90 text-white" : "bg-[var(--color-primary)]/90 text-white"}`}>
            {LISTING_MODE_LABELS[listing.listing_mode || "rent"]}
          </span>
          {listing.source === "scraped" && (
            <span className="w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-amber-500/90 text-white backdrop-blur-md">
              Scraped
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <SaveButton listingId={listing.id} />
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-sm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); shareListing(listing); }}
            aria-label="Share listing"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </button>
        </div>
        {isUnavailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-5 py-2 text-sm font-bold text-gray-800 tracking-wide">{isSold ? "Sold" : "Rented"}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xl font-bold text-[var(--color-text)] mb-1 tracking-[-0.02em]">
          {isSell && listing.price
            ? `₹${listing.price.toLocaleString("en-IN")}`
            : `₹${listing.rent_min.toLocaleString("en-IN")}–${listing.rent_max.toLocaleString("en-IN")}/mo`}
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          {HOUSE_TYPE_LABELS[listing.house_type as keyof typeof HOUSE_TYPE_LABELS] || listing.house_type}
          {listing.bedrooms ? ` · ${listing.bedrooms} Bed` : ""}
          {listing.area_sqft ? ` · ${listing.area_sqft} sqft` : ""}
          {locationText ? ` · ${locationText}` : ""}
        </p>
        {listing.verified_owner && (
          <div className="flex items-center gap-1 mb-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span className="text-xs font-medium text-green-600">Verified Owner</span>
          </div>
        )}
        {listing.description && (
          <p className="text-sm text-[var(--color-text-dim)] line-clamp-2 mb-2 leading-relaxed">{listing.description}</p>
        )}
        {listing.source === "scraped" && listing.source_url && (
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View on MagicBricks
          </a>
        )}
        <p className="text-xs text-[var(--color-text-dim)] tracking-wide">Posted {timeAgo(listing.created_at)}</p>
      </div>
    </Link>
  );
});
