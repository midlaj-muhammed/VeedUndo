"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress";
import type { Locality, HouseType, PosterType } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";

const POSTER_TYPES: { value: PosterType; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "broker", label: "Broker" },
];

export default function PostForm() {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [localityId, setLocalityId] = useState("");
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
    supabase
      .from("localities")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setLocalities(data);
      });
  }, []);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    // Revoke old previews before creating new ones
    previews.forEach(URL.revokeObjectURL);
    const files = Array.from(e.target.files || []).slice(0, 3);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function doSubmit(skipDupCheck = false) {
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Please sign in first.");
      return;
    }

    if (!localityId || !rentMin || !rentMax) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!skipDupCheck && localityId && rentMin && rentMax) {
      const dupRes = await fetch("/api/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locality_id: localityId,
          house_type: houseType,
          rent_min: parseInt(rentMin),
          rent_max: parseInt(rentMax),
        }),
      });
      const { matches } = await dupRes.json();
      if (matches && matches.length > 0) {
        setShowDupWarning(true);
        return;
      }
    }

    setSubmitting(true);

    try {
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
        locality_id: localityId,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSubmit(false);
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Listing posted!</h2>
        <p className="text-[var(--color-text-muted)] mb-6">
          Your listing is live and visible to renters.
        </p>
        <Link
          href="/"
          className="rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <>
      {showDupWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Similar listing found</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              A similar listing already exists in this area. Is this a different house?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDupWarning(false)}
                className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => doSubmit(true)}
                className="flex-1 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white"
              >
                Yes, post anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Locality *</label>
          <select
            required value={localityId} onChange={(e) => setLocalityId(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm"
          >
            <option value="">Select locality</option>
            {localities.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Min rent (₹) *</label>
            <input
              type="number" required min={0} placeholder="3000"
              value={rentMin} onChange={(e) => setRentMin(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max rent (₹) *</label>
            <input
              type="number" required min={0} placeholder="8000"
              value={rentMax} onChange={(e) => setRentMax(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">House type *</label>
          <select
            required value={houseType} onChange={(e) => setHouseType(e.target.value as HouseType)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm"
          >
            {Object.entries(HOUSE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">I am posting as *</label>
          <div className="flex gap-3">
            {POSTER_TYPES.map((pt) => (
              <button
                key={pt.value} type="button" onClick={() => setPosterType(pt.value)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  posterType === pt.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Phone number</label>
            <input
              type="tel" placeholder="9876543210" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp number</label>
            <input
              type="tel" placeholder="9876543210" value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3} placeholder="Furnished, parking available, near bus stop..."
            value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Photos (up to 3)</label>
          <div className="flex gap-3 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24">
                <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button" onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                >
                  x
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button" onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-2xl text-[var(--color-text-muted)] hover:border-[var(--color-primary)] transition-colors"
              >
                +
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
        </div>

        <button
          type="submit" disabled={submitting}
          className="w-full rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post listing"}
        </button>
      </form>
    </>
  );
}
