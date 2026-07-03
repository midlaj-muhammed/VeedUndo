import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ListingWithLocation } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";
import { daysLeft, timeAgo } from "@/lib/utils";

export function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-6 w-32" />
        <div className="flex gap-2"><div className="skeleton h-6 w-16 rounded-full" /><div className="skeleton h-6 w-16 rounded-full" /></div>
        <div className="skeleton h-4 w-full" />
      </div>
    </div>
  );
}

export default memo(function ListingCard({ listing }: { listing: ListingWithLocation }) {
  const days = daysLeft(listing.expires_at);
  const isRented = listing.status === "rented";
  const subDistrict = listing.sub_districts;
  const district = subDistrict?.districts;
  const locationText = subDistrict ? (district ? `${subDistrict.name}, ${district.name}` : subDistrict.name) : district?.name || "";
  const imgAlt = `${HOUSE_TYPE_LABELS[listing.house_type]} in ${locationText}`;

  return (
    <Link href={`/listing/${listing.id}`} className={`group block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-all duration-200 press-effect ${isRented ? "opacity-70" : "hover:shadow-lg hover:shadow-[var(--color-primary)]/10 hover:border-[var(--color-primary-light)]"}`}>
      {listing.image_urls?.[0] ? (
        <div className="relative w-full h-48 overflow-hidden">
          <Image src={listing.image_urls[0]} alt={imgAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={`object-cover transition-transform duration-300 ${isRented ? "grayscale" : "group-hover:scale-105"}`} />
          {isRented && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-gray-800">Rented</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-48 bg-[var(--color-muted)] flex items-center justify-center">
          <svg className="w-12 h-12 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008V10.5zm0 3h.008v.008h-.008V13.5zm0 3h.008v.008h-.008V16.5z" /></svg>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)] truncate">{locationText}</p>
            <h3 className="text-lg font-bold text-[var(--color-text)]">₹{listing.rent_min.toLocaleString("en-IN")}–{listing.rent_max.toLocaleString("en-IN")}</h3>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${days > 3 ? "bg-green-500/10 text-green-600 dark:text-green-400" : days > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>{days > 0 ? `${days}d left` : "Expired"}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text)]">{HOUSE_TYPE_LABELS[listing.house_type]}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${listing.poster_type === "owner" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>{listing.poster_type === "owner" ? "Owner" : "Broker"}</span>
        </div>
        {listing.description && <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{listing.description}</p>}
        <p className="text-xs text-[var(--color-text-dim)] mt-2">Posted {timeAgo(listing.created_at)}</p>
      </div>
    </Link>
  );
});
