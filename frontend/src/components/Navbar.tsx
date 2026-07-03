"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  variant?: "home" | "dashboard" | "post" | "auth" | "detail";
  locationText?: string;
}

export default function Navbar({ variant = "home", locationText }: Props) {
  return (
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-[var(--color-primary)]">VeedUndo</Link>
          {variant === "detail" && locationText && (
            <>
              <span className="text-sm text-[var(--color-text-dim)]">/</span>
              <span className="text-sm text-[var(--color-text-muted)] truncate">{locationText}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {variant === "home" && (
            <>
              <Link href="/dashboard" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hidden sm:block">My Listings</Link>
              <Link href="/post" className="press-effect rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)]">+ Post</Link>
            </>
          )}
          {variant === "detail" && (
            <Link href="/" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">Browse</Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
