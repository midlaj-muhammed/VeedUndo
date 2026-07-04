import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ListingWithLocation } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";
import { timeAgo, shareListing } from "@/lib/utils";

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

export default memo(function ListingCard({ listing }: { listing: ListingWithLocation }) {
  const isRented = listing.status === "rented";
  const subDistrict = listing.sub_districts;
  const district = subDistrict?.districts;
  const locationText = subDistrict ? (district ? `${subDistrict.name}, ${district.name}` : subDistrict.name) : district?.name || "";
  const imgAlt = `${HOUSE_TYPE_LABELS[listing.house_type]} in ${locationText}`;

  return (
    <Link href={`/listing/${listing.id}`} className={`card-base group block rounded-2xl overflow-hidden ${isRented ? "opacity-70" : ""}`}>
      <div className="relative w-full h-56 overflow-hidden">
        {listing.image_urls?.[0] ? (
          <Image src={listing.image_urls[0]} alt={imgAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={`object-cover transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isRented ? "grayscale" : "group-hover:scale-105"}`} />
        ) : (
          <div className="w-full h-full bg-[var(--color-muted)] flex items-center justify-center">
            <svg className="w-12 h-12 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008V10.5zm0 3h.008v.008h-.008V13.5zm0 3h.008v.008h-.008V16.5z" /></svg>
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
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
        {isRented && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-5 py-2 text-sm font-bold text-gray-800 tracking-wide">Rented</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xl font-bold text-[var(--color-text)] mb-1 tracking-[-0.02em]">
          ₹{listing.rent_min.toLocaleString("en-IN")}–{listing.rent_max.toLocaleString("en-IN")}/mo
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          {HOUSE_TYPE_LABELS[listing.house_type]} {locationText ? `· ${locationText}` : ""}
        </p>
        {listing.description && (
          <p className="text-sm text-[var(--color-text-dim)] line-clamp-2 mb-2 leading-relaxed">{listing.description}</p>
        )}
        <p className="text-xs text-[var(--color-text-dim)] tracking-wide">Posted {timeAgo(listing.created_at)}</p>
      </div>
    </Link>
  );
});
