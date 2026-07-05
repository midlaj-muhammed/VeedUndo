"use client";

import { useState, useEffect } from "react";
import type { District, SubDistrict, ListingMode, PropertyCategory } from "@/lib/types";
import { HOUSE_TYPE_LABELS, PROPERTY_CATEGORY_LABELS, CATEGORY_HOUSE_TYPES } from "@/lib/types";
import { DropdownPortal, useDropdownPosition } from "@/components/DropdownPortal";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";

export interface Filters {
  listingMode: string;
  propertyCategory: string;
  districtId: string;
  subDistrictId: string;
  rentRange: string;
  priceRange: string;
  houseType: string;
  posterType: string;
  source: string;
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

const PRICE_RANGES = [
  { value: "0-1000000", label: "Under ₹10L" },
  { value: "1000000-2500000", label: "₹10L–25L" },
  { value: "2500000-5000000", label: "₹25L–50L" },
  { value: "5000000-10000000", label: "₹50L–1Cr" },
  { value: "10000000-25000000", label: "₹1Cr–2.5Cr" },
  { value: "25000000-999999999", label: "₹2.5Cr+" },
];

export default function BrowseFilters({ districts, filters, onChange }: Props) {
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const district = useDropdownPosition();
  const sub = useDropdownPosition();
  const rent = useDropdownPosition();
  const price = useDropdownPosition();
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

  async function handleNearMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const county = data.address?.county || data.address?.state_district || "";
          const match = districts.find(d => county.toLowerCase().includes(d.name.toLowerCase()));
          if (match) {
            onChange({ ...filters, districtId: match.id, subDistrictId: "" });
          }
        } catch {}
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  }

  function clearAll() {
    onChange({ listingMode: filters.listingMode, propertyCategory: filters.propertyCategory, districtId: "", subDistrictId: "", rentRange: "", priceRange: "", houseType: "", posterType: "", source: "", search: "", sort: "" });
    closeAll();
  }

  const activeCount = [filters.districtId, filters.subDistrictId, filters.rentRange, filters.priceRange, filters.houseType, filters.posterType, filters.source, filters.search].filter(Boolean).length;

  async function saveSearch() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Please sign in to save searches."); return; }
    const label = prompt("Name this search:");
    if (!label) return;
    await supabase.from("saved_searches").insert({ user_id: session.user.id, label, filters });
    alert("Search saved!");
  }

  const districtLabel = filters.districtId ? districts.find((d) => d.id === filters.districtId)?.name : null;
  const subLabel = filters.subDistrictId ? subDistricts.find((s) => s.id === filters.subDistrictId)?.name : null;
  const rentLabel = filters.rentRange ? RENT_RANGES.find((r) => r.value === filters.rentRange)?.label : null;
  const priceLabel = filters.priceRange ? PRICE_RANGES.find((r) => r.value === filters.priceRange)?.label : null;
  const typeLabel = filters.houseType ? HOUSE_TYPE_LABELS[filters.houseType as keyof typeof HOUSE_TYPE_LABELS] : null;
  const posterLabel = filters.posterType === "owner" ? "Owner" : filters.posterType === "broker" ? "Broker" : null;

  const dropdownBase = "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto";

  return (
    <div className="mb-6">
      {/* Listing mode tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-[var(--color-muted)] rounded-full w-fit">
        {[
          { value: "", label: "All" },
          { value: "rent", label: "For Rent" },
          { value: "sell", label: "For Sale" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              const next = { ...filters, listingMode: value, propertyCategory: "", houseType: "" };
              onChange(next);
              closeAll();
            }}
            className={`relative px-5 py-2 text-sm font-medium rounded-full transition-colors min-h-[36px] ${
              filters.listingMode === value
                ? "text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {filters.listingMode === value && (
              <motion.div
                layoutId="listing-mode-tab"
                className="absolute inset-0 rounded-full bg-[var(--color-primary)]"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Property category chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["residential", "commercial", "land"] as PropertyCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              const next = { ...filters, propertyCategory: filters.propertyCategory === cat ? "" : cat, houseType: "" };
              onChange(next);
              closeAll();
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[36px] ${
              filters.propertyCategory === cat
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "bg-[var(--color-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]"
            }`}
          >
            {PROPERTY_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

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
          <button
            onClick={handleNearMe}
            disabled={locating}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-primary)]/20 transition-colors min-h-[32px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            {locating ? "Locating..." : "Near me"}
          </button>
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

        {/* Price range chip — sell mode only */}
        {filters.listingMode === "sell" && (
          <button
            ref={price.triggerRef}
            onClick={() => openDropdown("price")}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors min-h-[40px] ${
              filters.priceRange
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary-light)]"
            }`}
          >
            {priceLabel || "Price"}
            {filters.priceRange && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        )}

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

        {/* Source filter chip */}
        <div className="flex gap-1 shrink-0">
          {[
            { value: "", label: "All" },
            { value: "user", label: "Posted" },
            { value: "scraped", label: "Scraped" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update("source", value)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px] ${
                (filters.source || "") === value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary-light)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

      </div>

      {/* Active filters row */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-xs text-[var(--color-text-dim)]">{activeCount} filter{activeCount > 1 ? "s" : ""} active</span>
          <div className="flex items-center gap-3">
            <button onClick={saveSearch} className="text-xs font-medium text-[var(--color-primary)] hover:underline min-h-[36px] flex items-center">
              Save search
            </button>
            <button onClick={clearAll} className="text-xs font-medium text-[var(--color-destructive)] hover:underline min-h-[36px] flex items-center">
              Clear all
            </button>
          </div>
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

      {/* Price range dropdown via portal */}
      <DropdownPortal
        pos={price.pos}
        className={dropdownBase}
      >
        <button onClick={() => update("priceRange", "")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] text-[var(--color-text-muted)]">Any Price</button>
        {PRICE_RANGES.map((r) => (
          <button key={r.value} onClick={() => update("priceRange", r.value)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.priceRange === r.value ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>{r.label}</button>
        ))}
      </DropdownPortal>

      {/* House type dropdown via portal */}
      <DropdownPortal
        pos={type.pos}
        className={dropdownBase}
      >
        <button onClick={() => update("houseType", "")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] text-[var(--color-text-muted)]">Any Type</button>
        {(filters.propertyCategory
          ? CATEGORY_HOUSE_TYPES[filters.propertyCategory as PropertyCategory] || []
          : filters.listingMode === "sell"
            ? Object.keys(HOUSE_TYPE_LABELS) as (keyof typeof HOUSE_TYPE_LABELS)[]
            : Object.keys(HOUSE_TYPE_LABELS) as (keyof typeof HOUSE_TYPE_LABELS)[]
        ).map((k) => (
          <button key={k} onClick={() => update("houseType", k)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-muted)] ${filters.houseType === k ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text)]"}`}>{HOUSE_TYPE_LABELS[k]}</button>
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
