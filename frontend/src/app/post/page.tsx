"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import PostForm from "@/components/PostForm";
import Navbar from "@/components/Navbar";

export default function PostListing() {
  const [session, setSession] = useState<Session | null>(null);
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
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 tracking-[-0.02em]">Post a House for Rent</h1>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        ) : session ? (
          <PostForm />
        ) : (
          <div className="text-center py-20 card-base rounded-2xl">
            <p className="text-lg mb-6 text-[var(--color-text)]">Sign in to post a listing</p>
            <Link
              href="/auth"
              className="btn btn-primary px-6 py-3"
            >
              Sign in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
