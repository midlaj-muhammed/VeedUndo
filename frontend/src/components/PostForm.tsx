"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { District, SubDistrict, HouseType, PosterType } from "@/lib/types";
import { HOUSE_TYPE_LABELS } from "@/lib/types";

const POSTER_TYPES: { value: PosterType; label: string }[] = [{ value: "owner", label: "Owner" }, { value: "broker", label: "Broker" }];

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

  useEffect(() => { supabase.from("districts").select("*").order("name").then(({ data }) => { if (data) setDistricts(data); }); }, []);
  useEffect(() => { if (!districtId) { setSubDistricts([]); setSubDistrictId(""); return; } supabase.from("sub_districts").select("*").eq("district_id", districtId).order("name").then(({ data }) => { if (data) setSubDistricts(data); }); setSubDistrictId(""); }, [districtId]);
  useEffect(() => { return () => previews.forEach(URL.revokeObjectURL); }, [previews]);

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []);
    const merged = [...images, ...newFiles].slice(0, 3);
    previews.forEach((src, i) => { if (i >= merged.length) URL.revokeObjectURL(src); });
    setImages(merged);
    setPreviews(merged.map((f) => URL.createObjectURL(f)));
    if (fileRef.current) fileRef.current.value = "";
  }
  function removeImage(idx: number) { URL.revokeObjectURL(previews[idx]); setImages((p) => p.filter((_, i) => i !== idx)); setPreviews((p) => p.filter((_, i) => i !== idx)); }

  async function doSubmit(skipDupCheck = false) {
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Please sign in first."); return; }
    if (!districtId || !rentMin || !rentMax) { setError("Please fill in all required fields."); return; }
    if (!skipDupCheck && subDistrictId) {
      const dupRes = await fetch("/api/duplicates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sub_district_id: subDistrictId, house_type: houseType, rent_min: parseInt(rentMin), rent_max: parseInt(rentMax) }) });
      const { matches } = await dupRes.json();
      if (matches?.length > 0) { setShowDupWarning(true); return; }
    }
    setSubmitting(true);
    try {
      const { compressImage } = await import("@/lib/compress");
      const compressed = await Promise.all(images.map(compressImage));
      const formData = new FormData(); compressed.forEach((f) => formData.append("images", f));
      const uploadRes = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: formData });
      if (!uploadRes.ok) throw new Error("Image upload failed");
      const { urls } = await uploadRes.json();
      const { error: insertError } = await supabase.from("listings").insert({ sub_district_id: subDistrictId || null, rent_min: parseInt(rentMin), rent_max: parseInt(rentMax), house_type: houseType, description: description || null, poster_type: posterType, poster_email: session.user.email, poster_phone: phone || null, poster_whatsapp: whatsapp || null, image_urls: urls, expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() });
      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err: any) { setError(err.message || "Something went wrong"); } finally { setSubmitting(false); setShowDupWarning(false); }
  }

  if (success) return (<div className="text-center py-16"><h2 className="text-2xl font-bold mb-2 text-[var(--color-text)]">Listing posted!</h2><p className="text-[var(--color-text-muted)] mb-6">Your listing is live and visible to renters.</p><Link href="/" className="rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] min-h-[44px] inline-flex items-center">Browse listings</Link></div>);

  const inputClass = "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 min-h-[44px]";

  return (
    <>
      {showDupWarning && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-md w-full border border-[var(--color-border)]"><h3 className="text-lg font-bold mb-2 text-[var(--color-text)]">Similar listing found</h3><p className="text-sm text-[var(--color-text-muted)] mb-4">A similar listing already exists in this area. Is this a different house?</p><div className="flex gap-3"><button onClick={() => setShowDupWarning(false)} className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text)] min-h-[44px]">Cancel</button><button onClick={() => doSubmit(true)} className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white min-h-[44px]">Yes, post anyway</button></div></div></div>)}
      <form onSubmit={(e) => { e.preventDefault(); doSubmit(false); }} className="flex flex-col gap-5">
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
        <div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">District *</label><select required value={districtId} onChange={(e) => setDistrictId(e.target.value)} className={inputClass}><option value="">Select district</option>{districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Sub-district</label><select value={subDistrictId} onChange={(e) => setSubDistrictId(e.target.value)} className={inputClass} disabled={!districtId}><option value="">{districtId ? "Select sub-district (optional)" : "Select district first"}</option>{subDistricts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Min rent (₹) *</label><input type="number" required min={0} placeholder="3000" value={rentMin} onChange={(e) => setRentMin(e.target.value)} className={inputClass} /></div><div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Max rent (₹) *</label><input type="number" required min={0} placeholder="8000" value={rentMax} onChange={(e) => setRentMax(e.target.value)} className={inputClass} /></div></div>
        <div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">House type *</label><select required value={houseType} onChange={(e) => setHouseType(e.target.value as HouseType)} className={inputClass}>{Object.entries(HOUSE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">I am posting as *</label><div className="flex gap-3">{POSTER_TYPES.map((pt) => (<button key={pt.value} type="button" onClick={() => setPosterType(pt.value)} className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${posterType === pt.value ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"}`}>{pt.label}</button>))}</div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Phone number</label><input type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></div><div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">WhatsApp number</label><input type="tel" placeholder="9876543210" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} /></div></div>
        <div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Description</label><textarea rows={3} placeholder="Furnished, parking available, near bus stop..." value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass + " resize-none"} /></div>
        <div><label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Photos (up to 3)</label><div className="flex gap-3 flex-wrap">{previews.map((src, i) => (<div key={i} className="relative w-24 h-24"><img src={src} alt="" className="w-full h-full object-cover rounded-xl" /><button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white text-xs flex items-center justify-center min-w-[28px] min-h-[28px]">x</button></div>))}{images.length < 3 && <button type="button" onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-2xl text-[var(--color-text-dim)] hover:border-[var(--color-primary)] min-h-[44px]">+</button>}</div><input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" /></div>
        <button type="submit" disabled={submitting} className="w-full rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 cursor-pointer press-effect min-h-[44px]">{submitting ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Posting...</span> : "Post listing"}</button>
      </form>
    </>
  );
}
