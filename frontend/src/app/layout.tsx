import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
          VeedUndo — Kerala&apos;s hyperlocal rental board
        </footer>
      </body>
    </html>
  );
}
