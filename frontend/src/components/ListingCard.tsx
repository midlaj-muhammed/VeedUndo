import Link from "next/link";
import type { ListingWithLocality } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";
import { daysLeft, timeAgo } from "@/lib/utils";

export default function ListingCard({ listing }: { listing: ListingWithLocality }) {
  const days = daysLeft(listing.expires_at);
  const locality = listing.localities;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:shadow-md transition-shadow"
    >
      {listing.image_urls?.[0] && (
        <img
          src={listing.image_urls[0]}
          alt={`${HOUSE_TYPE_LABELS[listing.house_type]} in ${locality?.name}`}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {locality?.name}, {locality?.city}
            </p>
            <h3 className="text-lg font-bold">
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
          <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-xs font-medium">
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
