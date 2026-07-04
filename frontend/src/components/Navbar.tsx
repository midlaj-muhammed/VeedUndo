"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import ThemeToggle from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

interface Props {
  variant?: "home" | "dashboard" | "post" | "auth" | "detail";
  locationText?: string;
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative px-3 py-2 text-sm font-medium rounded-lg min-h-[40px] flex items-center transition-colors duration-150 ${
        active
          ? "text-[var(--color-primary)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40"
      }`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="nav-indicator"
          className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-[var(--color-primary)]"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const isHome = pathname === "/";
  const isPost = pathname === "/post";
  const isDashboard = pathname === "/dashboard";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl min-w-[64px] min-h-[48px] justify-center transition-colors ${
            isHome ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={isHome ? 2.5 : 2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[11px] font-medium leading-none">Home</span>
        </Link>

        <Link
          href="/post"
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl min-w-[64px] min-h-[48px] justify-center transition-colors ${
            isPost ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-5 shadow-lg transition-colors ${
            isPost
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-primary)] text-white"
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-[11px] font-medium leading-none mt-0.5">Post</span>
        </Link>

        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl min-w-[64px] min-h-[48px] justify-center transition-colors ${
            isDashboard ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={isDashboard ? 2.5 : 2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span className="text-[11px] font-medium leading-none">My Ads</span>
        </Link>
      </div>
    </nav>
  );
}

export default function Navbar({ variant = "home", locationText }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isPost = pathname === "/post";
  const isDashboard = pathname === "/dashboard";
  const isDetail = pathname.startsWith("/listing/");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Top navbar — floating pill */}
      <nav className="sticky top-0 z-40 px-4 pt-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-12 px-4 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <Logo className="shrink-0" />
            {isDetail && locationText && (
              <>
                <span className="text-[var(--color-text-dim)] text-xs">/</span>
                <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[160px]">{locationText}</span>
              </>
            )}
          </div>

          {/* Center: Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/" active={isHome}>Browse</NavLink>
            <NavLink href="/post" active={isPost}>Post</NavLink>
            <NavLink href="/dashboard" active={isDashboard}>My Listings</NavLink>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden flex items-center justify-center w-10 h-10 min-h-[40px] text-[var(--color-text)]"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu — staggered reveal */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="sm:hidden max-w-5xl mx-auto mt-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden"
            >
              {[
                { href: "/", label: "Browse Listings", active: isHome },
                { href: "/post", label: "Post a Listing", active: isPost },
                { href: "/dashboard", label: "My Listings", active: isDashboard },
              ].map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${item.active ? "text-[var(--color-text)] bg-[var(--color-muted)]" : "text-[var(--color-text-muted)]"}`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile bottom nav */}
      <BottomNav pathname={pathname} />
    </>
  );
}
