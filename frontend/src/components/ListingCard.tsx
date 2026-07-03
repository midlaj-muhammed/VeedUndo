import Link from "next/link";
import type { ListingWithLocality } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";
import { daysLeft, timeAgo } from "@/lib/utils";

export function ListingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-6 w-32" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
        <div className="skeleton h-4 w-full" />
      </div>
    </div>
  );
}

export default function ListingCard({ listing }: { listing: ListingWithLocality }) {
  const days = daysLeft(listing.expires_at);
  const locality = listing.localities;
  const imgAlt = `${HOUSE_TYPE_LABELS[listing.house_type]} in ${locality?.name}`;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:shadow-lg hover:border-[var(--color-primary-light)] transition-all duration-200"
    >
      {listing.image_urls?.[0] ? (
        <img
          src={listing.image_urls[0]}
          alt={imgAlt}
          loading="lazy"
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-48 bg-[var(--color-muted)] flex items-center justify-center">
          <svg className="w-12 h-12 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008V10.5zm0 3h.008v.008h-.008V13.5zm0 3h.008v.008h-.008V16.5z" />
          </svg>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {locality?.name}, {locality?.city}
            </p>
            <h3 className="text-lg font-bold text-[var(--color-text)]">
              ₹{listing.rent_min.toLocaleString("en-IN")}–
              {listing.rent_max.toLocaleString("en-IN")}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              days > 3
                ? "bg-green-50 text-green-700"
                : days > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {days > 0 ? `${days}d left` : "Expired"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text)]">
            {HOUSE_TYPE_LABELS[listing.house_type]}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              listing.poster_type === "owner"
                ? "bg-blue-50 text-blue-700"
                : "bg-purple-50 text-purple-700"
            }`}
          >
            {listing.poster_type === "owner" ? "Owner" : "Broker"}
          </span>
        </div>

        {listing.description && (
          <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
            {listing.description}
          </p>
        )}

        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Posted {timeAgo(listing.created_at)}
        </p>
      </div>
    </Link>
  );
}
