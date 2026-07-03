import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "VeedUndo — Kerala Rental Board",
  description:
    "Kerala's hyperlocal rental status board. Find houses for rent near you, fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-dvh flex flex-col font-sans bg-[var(--color-bg)]">
        {children}
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
            <p>VeedUndo — Kerala&apos;s hyperlocal rental board</p>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Browse</Link>
              <Link href="/post" className="hover:text-[var(--color-primary)] transition-colors">Post</Link>
              <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">Dashboard</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
