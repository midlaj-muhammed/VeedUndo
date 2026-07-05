"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);

      const { count } = await supabase
        .from("saved_listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setSavedCount(count || 0);
    })();
  }, [router]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    if (newPassword !== confirmPassword) { setPwErr("Passwords don't match."); return; }
    if (newPassword.length < 6) { setPwErr("Password must be at least 6 characters."); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) setPwErr(error.message);
    else { setPwMsg("Password updated."); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!user) return <div className="flex flex-col min-h-dvh"><Navbar /><main className="flex-1" /></div>;

  const name = user.user_metadata?.full_name || "User";
  const email = user.email;
  const role = user.user_metadata?.role || "renter";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 tracking-[-0.02em]">My account</h1>

        {/* Profile card */}
        <div className="card-base rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--color-text)]">{name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{email}</p>
              <span className={`badge mt-1 ${role === "agent" ? "badge-flagged" : "badge-active"}`}>
                {role === "agent" ? "Agent" : "Renter"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a href="/saved" className="card-base rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Saved listings</p>
              <p className="text-xs text-[var(--color-text-muted)]">{savedCount} shortlisted</p>
            </div>
          </a>
          <a href="/" className="card-base rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Browse rentals</p>
              <p className="text-xs text-[var(--color-text-muted)]">Find your next place</p>
            </div>
          </a>
        </div>

        {/* Change password */}
        <div className="card-base rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Change password</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-5">For your security, changing your password signs out your other devices.</p>
          {pwErr && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{pwErr}</div>}
          {pwMsg && <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">{pwMsg}</div>}
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">New password</label>
              <input type="password" required minLength={6} placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Confirm new password</label>
              <input type="password" required placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" />
            </div>
            <button type="submit" disabled={pwLoading} className="self-start btn btn-primary px-6 py-3">
              {pwLoading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>

        {/* Logout */}
        <button onClick={handleSignOut} className="btn btn-secondary px-6 py-3">
          Log out
        </button>
      </main>
    </div>
  );
}
