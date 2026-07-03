"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (!error) setSent(true);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="max-w-md mx-auto">
          <Link href="/" className="text-lg font-bold text-[var(--color-primary)]">
            VeedUndo
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8">
          {sent ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-[var(--color-text-muted)]">
                We sent a sign-in link to <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">Sign in</h1>
              <p className="text-[var(--color-text-muted)] mb-6">
                We&apos;ll send you a magic link — no password needed.
              </p>
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send magic link"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
