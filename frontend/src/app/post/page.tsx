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
