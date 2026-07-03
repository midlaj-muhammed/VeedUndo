"use client";

import type { Locality, HouseType, PosterType } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";

interface Filters {
  localityId: string;
  rentRange: string;
  houseType: string;
  posterType: string;
}

interface Props {
  localities: Locality[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

const RENT_RANGES = [
  { value: "", label: "Any Rent" },
  { value: "0-5000", label: "Under ₹5,000" },
  { value: "5000-10000", label: "₹5,000–₹10,000" },
  { value: "10000-20000", label: "₹10,000–₹20,000" },
  { value: "20000-999999", label: "Above ₹20,000" },
];

export default function BrowseFilters({ localities, filters, onChange }: Props) {
  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasFilters = filters.localityId || filters.rentRange || filters.houseType || filters.posterType;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.localityId}
          onChange={(e) => update("localityId", e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm cursor-pointer hover:border-[var(--color-primary-light)] focus:border-[var(--color-primary)]"
        >
          <option value="">All Localities</option>
          {localities.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        <select
          value={filters.rentRange}
          onChange={(e) => update("rentRange", e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm cursor-pointer hover:border-[var(--color-primary-light)] focus:border-[var(--color-primary)]"
        >
          {RENT_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <select
          value={filters.houseType}
          onChange={(e) => update("houseType", e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm cursor-pointer hover:border-[var(--color-primary-light)] focus:border-[var(--color-primary)]"
        >
          <option value="">Any Type</option>
          {Object.entries(HOUSE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filters.posterType}
          onChange={(e) => update("posterType", e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm cursor-pointer hover:border-[var(--color-primary-light)] focus:border-[var(--color-primary)]"
        >
          <option value="">Any Poster</option>
          <option value="owner">Owner</option>
          <option value="broker">Broker</option>
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={() => onChange({ localityId: "", rentRange: "", houseType: "", posterType: "" })}
          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
