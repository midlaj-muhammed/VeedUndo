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
  title: "VeedUndo - Kerala Rental Board",
  description:
    "Kerala's hyperlocal rental status board. Find houses for rent near you, fast.",
  icons: {
    icon: "/favicon.svg",
  },
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
          <footer className="hidden sm:block border-t border-[var(--color-border)] bg-[var(--color-muted)] mt-auto">
            <div className="max-w-5xl mx-auto px-6 py-12">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
                <div className="flex flex-col gap-3">
                  <Logo size="large" />
                  <p className="text-sm text-[var(--color-text-muted)] max-w-xs leading-relaxed">Kerala&apos;s hyperlocal rental board.</p>
                </div>
                <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
                  <Link href="/" className="hover:text-[var(--color-text)] transition-colors duration-200">Browse</Link>
                  <Link href="/post" className="hover:text-[var(--color-text)] transition-colors duration-200">Post</Link>
                  <Link href="/dashboard" className="hover:text-[var(--color-text)] transition-colors duration-200">Dashboard</Link>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-xs text-[var(--color-text-dim)]">
                &copy; {new Date().getFullYear()} VeedUndo
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
