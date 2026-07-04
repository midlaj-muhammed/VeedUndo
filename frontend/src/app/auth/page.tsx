"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setLoading(false); if (err) setError(err.message); else setSent(true);
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md card-base rounded-2xl p-8 sm:p-10">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500/10 flex items-center justify-center"><svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
              <h1 className="text-3xl font-bold mb-3 text-[var(--color-text)] tracking-[-0.02em]">Check your email</h1>
              <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">We sent a sign-in link to <strong>{email}</strong></p>
              <button onClick={() => { setSent(false); setEmail(""); }} className="text-sm text-[var(--color-primary)] hover:underline min-h-[44px]">Use a different email</button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-3 text-[var(--color-text)] tracking-[-0.02em]">Sign in to VeedUndo</h1>
              <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">We&apos;ll send you a magic link, no password needed.</p>
              {error && <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Email address</label>
                  <input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                </div>
                <button type="submit" disabled={loading} className="w-full btn btn-primary py-3">
                  {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending...</span> : "Send magic link"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
