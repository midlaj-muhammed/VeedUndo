import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Newsreader, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Buy, Sell & Rent Properties in Kerala | VeedUndo",
    template: "%s | VeedUndo",
  },
  description:
    "Kerala's complete property marketplace. Buy, sell, or rent houses, apartments, plots, and commercial spaces directly from owners.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Buy, Sell & Rent Properties in Kerala | VeedUndo",
    description: "Kerala's complete property marketplace. Buy, sell, or rent houses, apartments, plots, and commercial spaces directly from owners.",
    url: "https://veedundo.com",
    siteName: "VeedUndo",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy, Sell & Rent Properties in Kerala | VeedUndo",
    description: "Kerala's complete property marketplace. Buy, sell, or rent houses, apartments, plots, and commercial spaces directly from owners.",
  },
  metadataBase: new URL("https://veedundo.com"),
};

// Script to set theme before paint (no flash)
const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('veedundo-theme');
      if (t === 'dark') document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", plusJakarta.variable, "font-sans", newsreader.variable, geistMono.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh flex flex-col font-sans bg-[var(--color-bg)] text-[var(--color-text)] pb-20 sm:pb-0">
        <ThemeProvider>
          {children}
          {/* Desktop footer */}
          <footer className="hidden sm:block border-t border-[var(--color-border)] bg-[var(--color-muted)] mt-auto">
            <div className="max-w-5xl mx-auto px-6 py-12">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
                <div className="col-span-2 sm:col-span-1">
                  <Logo size="large" />
                  <p className="text-sm text-[var(--color-text-muted)] mt-3 max-w-xs leading-relaxed">Kerala&apos;s complete property marketplace. Buy, sell, or rent your next home.</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-text-dim)] mb-3">Explore</h3>
                  <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                    <li><Link href="/" className="hover:text-[var(--color-text)] transition-colors">Browse Listings</Link></li>
                    <li><Link href="/post" className="hover:text-[var(--color-text)] transition-colors">Post a Listing</Link></li>
                    <li><Link href="/dashboard" className="hover:text-[var(--color-text)] transition-colors">My Listings</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-text-dim)] mb-3">Company</h3>
                  <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                    <li><Link href="/about" className="hover:text-[var(--color-text)] transition-colors">About</Link></li>
                    <li><Link href="/contact" className="hover:text-[var(--color-text)] transition-colors">Contact</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-text-dim)] mb-3">Legal</h3>
                  <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                    <li><Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="hover:text-[var(--color-text)] transition-colors">Terms of Service</Link></li>
                  </ul>
                </div>
              </div>
              <div className="pt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-dim)]">
                <span>&copy; {new Date().getFullYear()} VeedUndo</span>
                <span>Made for Kerala</span>
              </div>
            </div>
          </footer>
          {/* Mobile footer — minimal */}
          <footer className="sm:hidden border-t border-[var(--color-border)] bg-[var(--color-muted)] mt-auto safe-area-bottom">
            <div className="px-6 py-6">
              <div className="flex items-center gap-3 mb-3">
                <Logo />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                <Link href="/about" className="hover:text-[var(--color-text)] transition-colors">About</Link>
                <Link href="/contact" className="hover:text-[var(--color-text)] transition-colors">Contact</Link>
                <Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-[var(--color-text)] transition-colors">Terms</Link>
              </div>
              <p className="text-[10px] text-[var(--color-text-dim)] mt-3">&copy; {new Date().getFullYear()} VeedUndo</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
