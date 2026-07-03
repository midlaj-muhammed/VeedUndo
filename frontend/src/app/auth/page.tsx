"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

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
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sticky top-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[var(--color-primary)]">VeedUndo</Link>
          <ThemeToggle />
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center"><svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
              <h1 className="text-2xl font-bold mb-2 text-[var(--color-text)]">Check your email</h1>
              <p className="text-[var(--color-text-muted)] mb-6">We sent a sign-in link to <strong>{email}</strong></p>
              <button onClick={() => { setSent(false); setEmail(""); }} className="text-sm text-[var(--color-primary)] hover:underline min-h-[44px]">Use a different email</button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2 text-[var(--color-text)]">Sign in</h1>
              <p className="text-[var(--color-text-muted)] mb-6">We&apos;ll send you a magic link — no password needed.</p>
              {error && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div><label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Email address</label><input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 min-h-[44px]" /></div>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 cursor-pointer press-effect min-h-[44px]">
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
