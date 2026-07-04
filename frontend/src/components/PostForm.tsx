"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import type { District, SubDistrict, HouseType, PosterType } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";

const POSTER_TYPES: { value: PosterType; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "broker", label: "Broker" },
];

/* ── Custom Select ── */
function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        {label} {required && <span className="text-[var(--color-destructive)]">*</span>}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm text-left transition-all duration-200 min-h-[44px] ${
          disabled
            ? "opacity-40 cursor-not-allowed border-[var(--color-border)] bg-[var(--color-muted)]"
            : open
            ? "border-[var(--color-primary)] bg-[var(--color-surface)] shadow-[0_0_0_3px_rgba(234,88,12,0.08)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-dim)]"
        }`}
      >
        <span className={selected ? "text-[var(--color-text)]" : "text-[var(--color-text-dim)]"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-[var(--color-text-dim)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md max-h-60 overflow-y-auto"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors min-h-[40px] ${
                  value === opt.value
                    ? "bg-[var(--color-muted)] text-[var(--color-text)] font-medium"
                    : "text-[var(--color-text)] hover:bg-[var(--color-muted)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Segmented Control ── */
function SegmentedControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        {label} <span className="text-[var(--color-destructive)]">*</span>
      </label>
      <div className="relative flex rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="relative flex-1 py-2.5 text-sm font-medium text-center min-h-[40px] z-10 cursor-pointer transition-colors duration-150"
            style={{ color: value === opt.value ? "var(--color-text)" : "var(--color-text-dim)" }}
          >
            {value === opt.value && (
              <motion.div
                layoutId="poster-pill"
                className="absolute inset-0 rounded bg-[var(--color-surface)] border border-[var(--color-border)]"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PostForm() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [districtId, setDistrictId] = useState("");
  const [subDistrictId, setSubDistrictId] = useState("");
  const [rentMin, setRentMin] = useState("");
  const [rentMax, setRentMax] = useState("");
  const [houseType, setHouseType] = useState<HouseType>("1bhk");
  const [description, setDescription] = useState("");
  const [posterType, setPosterType] = useState<PosterType>("owner");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showDupWarning, setShowDupWarning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("districts").select("*").order("name").then(({ data }) => {
      if (data) setDistricts(data);
    });
  }, []);

  useEffect(() => {
    if (!districtId) {
      setSubDistricts([]);
      setSubDistrictId("");
      return;
    }
    supabase.from("sub_districts").select("*").eq("district_id", districtId).order("name").then(({ data }) => {
      if (data) setSubDistricts(data);
    });
    setSubDistrictId("");
  }, [districtId]);

  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []);
    const merged = [...images, ...newFiles].slice(0, 3);
    previews.forEach((src, i) => {
      if (i >= merged.length) URL.revokeObjectURL(src);
    });
    setImages(merged);
    setPreviews(merged.map((f) => URL.createObjectURL(f)));
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  }

  async function doSubmit(skipDupCheck = false) {
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Please sign in first."); return; }
    if (!districtId || !rentMin || !rentMax) { setError("Please fill in all required fields."); return; }
    if (!skipDupCheck && subDistrictId) {
      const dupRes = await fetch("/api/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub_district_id: subDistrictId,
          house_type: houseType,
          rent_min: parseInt(rentMin),
          rent_max: parseInt(rentMax),
        }),
      });
      const { matches } = await dupRes.json();
      if (matches?.length > 0) { setShowDupWarning(true); return; }
    }
    setSubmitting(true);
    try {
      const { compressImage } = await import("@/lib/compress");
      const compressed = await Promise.all(images.map(compressImage));
      const formData = new FormData();
      compressed.forEach((f) => formData.append("images", f));
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Image upload failed");
      const { urls } = await uploadRes.json();
      const { error: insertError } = await supabase.from("listings").insert({
        sub_district_id: subDistrictId || null,
        rent_min: parseInt(rentMin),
        rent_max: parseInt(rentMax),
        house_type: houseType,
        description: description || null,
        poster_type: posterType,
        poster_email: session.user.email,
        poster_phone: phone || null,
        poster_whatsapp: whatsapp || null,
        image_urls: urls,
        expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
      setShowDupWarning(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-24">
        <h2 className="text-3xl font-bold mb-3 text-[var(--color-text)] tracking-[-0.02em]">Listing posted!</h2>
        <p className="text-base text-[var(--color-text-muted)] mb-8 leading-relaxed">Your listing is live and visible to renters.</p>
        <Link href="/" className="btn btn-primary px-6 py-3">
          Browse listings
        </Link>
      </div>
    );
  }

  const rentOptions = Object.entries(HOUSE_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }));
  const districtOptions = districts.map((d) => ({ value: d.id, label: d.name }));
  const subDistrictOptions = subDistricts.map((s) => ({ value: s.id, label: s.name }));

  return (
    <>
      {/* Duplicate warning modal */}
      <AnimatePresence>
        {showDupWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-md w-full border border-[var(--color-border)] shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-2 text-[var(--color-text)]">Similar listing found</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">A similar listing already exists in this area. Is this a different house?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDupWarning(false)} className="flex-1 btn btn-secondary">Cancel</button>
                <button onClick={() => doSubmit(true)} className="flex-1 btn btn-primary">Yes, post anyway</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={(e) => { e.preventDefault(); doSubmit(false); }} className="flex flex-col gap-6">
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Section: Location */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-dim)]">Location</p>
          <CustomSelect
            label="District"
            value={districtId}
            onChange={setDistrictId}
            options={districtOptions}
            placeholder="Select district"
            required
          />
          <CustomSelect
            label="Sub-district"
            value={subDistrictId}
            onChange={setSubDistrictId}
            options={subDistrictOptions}
            placeholder={districtId ? "Select sub-district (optional)" : "Select district first"}
            disabled={!districtId}
          />
        </div>

        {/* Section: Property */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-dim)]">Property</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                Min rent (₹) <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="3000"
                value={rentMin}
                onChange={(e) => setRentMin(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                Max rent (₹) <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="8000"
                value={rentMax}
                onChange={(e) => setRentMax(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <CustomSelect
            label="House type"
            value={houseType}
            onChange={(v) => setHouseType(v as HouseType)}
            options={rentOptions}
            placeholder="Select type"
            required
          />
        </div>

        {/* Section: Posting as */}
        <div className="space-y-4">
          <SegmentedControl
            label="Posting as"
            value={posterType}
            onChange={(v) => setPosterType(v as PosterType)}
            options={POSTER_TYPES}
          />
        </div>

        {/* Section: Contact */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-dim)]">Contact (optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Phone</label>
              <input type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">WhatsApp</label>
              <input type="tel" placeholder="9876543210" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Section: Description */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Description</label>
          <textarea
            rows={3}
            placeholder="Furnished, parking available, near bus stop..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input resize-none"
          />
        </div>

        {/* Section: Photos */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Photos (up to 3)</label>
          <div className="flex gap-3 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24">
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] text-xs flex items-center justify-center shadow-lg"
                >
                  x
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-2xl text-[var(--color-text-dim)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all duration-200"
              >
                +
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
        </div>

        {/* Submit — premium pill CTA */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full btn btn-primary py-3 text-[15px]"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Posting...
            </span>
          ) : (
            "Post listing"
          )}
        </button>
      </form>
    </>
  );
}
