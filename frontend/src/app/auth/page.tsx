"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"renter" | "agent">("renter");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role, whatsapp: role === "agent" ? whatsapp : "" },
      },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }

    // Email confirmation disabled — session created immediately
    if (data.session) {
      window.location.href = "/dashboard";
    } else {
      // Fallback: email confirmation might still be on
      window.location.href = "/dashboard";
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else window.location.href = "/dashboard";
  }

  async function handleForgotPassword() {
    if (!email) { setError("Enter your email first."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setError(""); // silent — don't reveal if email exists
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md card-base rounded-2xl p-8 sm:p-10">
          <h1 className="text-3xl font-bold mb-2 text-[var(--color-text)] tracking-[-0.02em]">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-[var(--color-text-muted)] mb-6 leading-relaxed">
            {mode === "signin" ? "Sign in to manage your listings." : "Join to save searches, shortlist homes, or list a property."}
          </p>

          {error && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

          {mode === "signup" ? (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Full name</label>
                <input id="name" type="text" required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Email</label>
                <input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Password</label>
                <input id="password" type="password" required minLength={6} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
              </div>

              {/* Role toggle */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">I am</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setRole("renter")} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px] ${role === "renter" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-text-dim)]"}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    I&apos;m renting
                  </button>
                  <button type="button" onClick={() => setRole("agent")} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px] ${role === "agent" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-text-dim)]"}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    I&apos;m an agent
                  </button>
                </div>
              </div>

              {/* WhatsApp — only for agents */}
              {role === "agent" && (
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">WhatsApp number</label>
                  <input id="whatsapp" type="tel" required pattern="[0-9]{10}" placeholder="Your 10-digit mobile" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input" />
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full btn btn-primary py-3">
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Email</label>
                <input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">Password</label>
                <input id="password" type="password" required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
              </div>
              <button type="submit" disabled={loading} className="w-full btn btn-primary py-3">
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          )}

          {mode === "signin" && (
            <button onClick={handleForgotPassword} disabled={loading} className="mt-3 text-sm text-[var(--color-primary)] hover:underline min-h-[44px]">
              Forgot password?
            </button>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-text-muted)]">
            {mode === "signin" ? (
              <>Don&apos;t have an account?{" "}<button onClick={() => { setMode("signup"); setError(""); }} className="text-[var(--color-primary)] font-medium hover:underline">Sign up</button></>
            ) : (
              <>Already have an account?{" "}<button onClick={() => { setMode("signin"); setError(""); }} className="text-[var(--color-primary)] font-medium hover:underline">Log in</button></>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
