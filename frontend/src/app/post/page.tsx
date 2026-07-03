"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PostForm from "@/components/PostForm";

export default function PostListing() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s)
    );
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--color-primary)]">
            VeedUndo
          </Link>
          <span className="text-sm text-[var(--color-text-muted)]">
            Post a listing
          </span>
          <div className="ml-auto flex items-center gap-3">
            {session && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {session.user.email}
              </span>
            )}
            {session && (
              <button
                onClick={handleSignOut}
                className="text-xs text-[var(--color-text-muted)] hover:text-red-600"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Post a House for Rent</h1>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        ) : session ? (
          <PostForm />
        ) : (
          <div className="text-center py-16 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
            <p className="text-lg mb-4">Sign in to post a listing</p>
            <Link
              href="/auth"
              className="inline-block rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
