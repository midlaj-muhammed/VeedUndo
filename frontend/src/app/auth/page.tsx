"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (err) setError(err.message);
      else setSuccess("Check your email to confirm your account.");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (err) setError(err.message);
      else window.location.href = "/dashboard";
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError("Enter your email first."); return; }
    setLoading(true); setError(""); setSuccess("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSuccess("Check your email for a password reset link.");
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md card-base rounded-2xl p-8 sm:p-10">
          <h1 className="text-3xl font-bold mb-3 text-[var(--color-text)] tracking-[-0.02em]">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[var(--color-text-muted)] mb-6 leading-relaxed">
            {mode === "signin" ? "Sign in to manage your listings." : "Sign up to start posting listings."}
          </p>

          {error && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
          {success && <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">{success}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Email</label>
              <input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Password</label>
              <input id="password" type="password" required minLength={6} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            </div>
            <button type="submit" disabled={loading} className="w-full btn btn-primary py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Loading...
                </span>
              ) : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "signin" && (
            <button onClick={handleForgotPassword} disabled={loading} className="mt-3 text-sm text-[var(--color-primary)] hover:underline min-h-[44px]">
              Forgot password?
            </button>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-text-muted)]">
            {mode === "signin" ? (
              <>Don&apos;t have an account?{" "}<button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} className="text-[var(--color-primary)] font-medium hover:underline">Sign up</button></>
            ) : (
              <>Already have an account?{" "}<button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }} className="text-[var(--color-primary)] font-medium hover:underline">Sign in</button></>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
