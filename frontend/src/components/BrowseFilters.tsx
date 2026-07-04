"use client";

import { useState, useEffect } from "react";
import type { District, SubDistrict } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";
import { DropdownPortal, useDropdownPosition } from "@/components/DropdownPortal";

export interface Filters {
  districtId: string;
  subDistrictId: string;
  rentRange: string;
  houseType: string;
  posterType: string;
  search: string;
  sort: string;
}

interface Props {
  districts: District[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

const RENT_RANGES = [
  { value: "0-5000", label: "Under ₹5K" },
  { value: "5000-10000", label: "₹5K–10K" },
  { value: "10000-20000", label: "₹10K–20K" },
  { value: "20000-999999", label: "Above ₹20K" },
];

export default function BrowseFilters({ districts, filters, onChange }: Props) {
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const district = useDropdownPosition();
  const sub = useDropdownPosition();
  const rent = useDropdownPosition();
  const type = useDropdownPosition();
  const poster = useDropdownPosition();
  const sort = useDropdownPosition();
  const hooks = { district, sub, rent, type, poster, sort };

  function openDropdown(name: string) {
    const h = hooks[name as keyof typeof hooks];
    if (!h) return;
    // Close any other open dropdown first
    Object.entries(hooks).forEach(([k, hook]) => {
      if (k !== name) hook.close();
    });
    h.open();
    setActiveDropdown(name);
  }

  function closeAll() {
    Object.values(hooks).forEach(h => h.close());
    setActiveDropdown(null);
  }

  useEffect(() => {
    if (!filters.districtId) { setSubDistricts([]); return; }
    import("@/lib/supabase").then(({ supabase }) =>
      supabase.from("sub_districts").select("*").eq("district_id", filters.districtId).order("name").then(({ data }) => { if (data) setSubDistricts(data); })
    );
  }, [filters.districtId]);

  function update(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value };
    if (key === "districtId") next.subDistrictId = "";
    onChange(next);
    closeAll();
  }

  function clearAll() {
    onChange({ districtId: "", subDistrictId: "", rentRange: "", houseType: "", posterType: "", search: "", sort: "" });
    closeAll();
  }

  const activeCount = [filters.districtId, filters.subDistrictId, filters.rentRange, filters.houseType, filters.posterType, filters.search].filter(Boolean).length;

  const districtLabel = filters.districtId ? districts.find((d) => d.id === filters.districtId)?.name : null;
  const subLabel = filters.subDistrictId ? subDistricts.find((s) => s.id === filters.subDistrictId)?.name : null;
  const rentLabel = filters.rentRange ? RENT_RANGES.find((r) => r.value === filters.rentRange)?.label : null;
  const typeLabel = filters.houseType ? HOUSE_TYPE_LABELS[filters.houseType as keyof typeof HOUSE_TYPE_LABELS] : null;
  const posterLabel = filters.posterType === "owner" ? "Owner" : filters.posterType === "broker" ? "Broker" : null;

  const dropdownBase = "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto";

  return (
    <div className="mb-6">
      {/* Search + Sort row */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search listings..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 min-h-[40px]"
          />
          {filters.search && (
            <button onClick={() => onChange({ ...filters, search: "" })} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text)] w-10 h-10 flex items-center justify-center min-w-[44px] min-h-[44px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <button
          ref={sort.triggerRef}
          onClick={() => openDropdown("sort")}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary-light)] transition-colors min-h-[40px]"
          >
            <svg className="w-4 h-4 text-[var(--color-text-dim)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.6 7.6 3M21 7.6l-4.6 4.6m0-9.2v9.2M3 16.4l4.6 4.6M21 16.4l-4.6-4.6" />
            </svg>
            {filters.sort === "price_asc" ? "Price ↑" : filters.sort === "price_desc" ? "Price ↓" : "Newest"}
          </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* District chip */}
        <button
          ref={district.triggerRef}
          onClick={() => openDropdown("district")}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors min-h-[40px] ${
            filters.districtId
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary-light)]"
          }`}
        >
          {districtLabel || "District"}
          {filters.districtId && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Sub-district chip */}
        {filters.districtId && (
          <button
            ref={sub.triggerRef}
            onClick={() => openDropdown("sub")}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors min-h-[40px] ${
              filters.subDistrictId
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary-light)]"
            }`}
          >
            {subLabel || "Area"}
            {filters.subDistrictId && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        )}

        {/* Rent range chip */}
        <button
          ref={rent.triggerRef}
          onClick={() => openDropdown("rent")}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors min-h-[40px] ${
            filters.rentRange
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary-light)]"
          }`}
        >
          {rentLabel || "Rent"}
          {filters.rentRange && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* House type chip */}
        <button
          ref={type.triggerRef}
          onClick={() => openDropdown("type")}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors min-h-[40px] ${
            filters.houseType
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary-light)]"
          }`}
        >
          {typeLabel || "Type"}
          {filters.houseType && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Poster type chip */}
        <button
          ref={poster.triggerRef}
          onClick={() => openDropdown("poster")}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors min-h-[40px] ${
            filters.posterType
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary-light)]"
          }`}
        >
          {posterLabel || "Poster"}
          {filters.posterType && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

      </div>

      {/* Active filters row */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-xs text-[var(--color-text-dim)]">{activeCount} filter{activeCount > 1 ? "s" : ""} active</span>
          <button onClick={clearAll} className="text-xs font-medium text-[var(--color-destructive)] hover:underline min-h-[36px] flex items-center">
            Clear all
          </button>
        </div>
      )}

      {/* District dropdown via portal */}
      <DropdownPortal
        pos={district.pos}
        className={dropdownBase}
      >
        <button onClick={() => update("districtId", "")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] text-[var(--color-text-muted)]">All Districts</button>
        {districts.map((d) => (
          <button key={d.id} onClick={() => update("districtId", d.id)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.districtId === d.id ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>{d.name}</button>
        ))}
      </DropdownPortal>

      {/* Sub-district dropdown via portal */}
      <DropdownPortal
        pos={sub.pos}
        className={dropdownBase}
      >
        <button onClick={() => update("subDistrictId", "")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] text-[var(--color-text-muted)]">All Areas</button>
        {subDistricts.map((s) => (
          <button key={s.id} onClick={() => update("subDistrictId", s.id)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.subDistrictId === s.id ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>{s.name}</button>
        ))}
      </DropdownPortal>

      {/* Rent range dropdown via portal */}
      <DropdownPortal
        pos={rent.pos}
        className={dropdownBase}
      >
        <button onClick={() => update("rentRange", "")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] text-[var(--color-text-muted)]">Any Rent</button>
        {RENT_RANGES.map((r) => (
          <button key={r.value} onClick={() => update("rentRange", r.value)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.rentRange === r.value ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>{r.label}</button>
        ))}
      </DropdownPortal>

      {/* House type dropdown via portal */}
      <DropdownPortal
        pos={type.pos}
        className={dropdownBase}
      >
        <button onClick={() => update("houseType", "")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] text-[var(--color-text-muted)]">Any Type</button>
        {Object.entries(HOUSE_TYPE_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => update("houseType", k)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.houseType === k ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>{v}</button>
        ))}
      </DropdownPortal>

      {/* Poster type dropdown via portal */}
      <DropdownPortal
        pos={poster.pos}
        className={dropdownBase}
      >
        <button onClick={() => update("posterType", "")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] text-[var(--color-text-muted)]">Any Poster</button>
        <button onClick={() => update("posterType", "owner")} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.posterType === "owner" ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>Owner</button>
        <button onClick={() => update("posterType", "broker")} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.posterType === "broker" ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>Broker</button>
      </DropdownPortal>

      {/* Sort dropdown via portal */}
      <DropdownPortal
        pos={sort.pos}
        className={dropdownBase}
      >
        {[
          { value: "", label: "Newest" },
          { value: "price_asc", label: "Price: Low → High" },
          { value: "price_desc", label: "Price: High → Low" },
        ].map((s) => (
          <button key={s.value} onClick={() => { onChange({ ...filters, sort: s.value }); closeAll(); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.sort === s.value ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>{s.label}</button>
        ))}
      </DropdownPortal>

      {/* Click-away overlay to close dropdowns */}
      {activeDropdown && <div className="fixed inset-0 z-40" onClick={closeAll} />}
    </div>
  );
}
