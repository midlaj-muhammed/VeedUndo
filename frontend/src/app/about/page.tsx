import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "About - VeedUndo",
  description: "Kerala's hyperlocal rental board. Find houses, apartments, and rooms for rent directly from owners.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] mb-8">
          About <span style={{ fontFamily: "var(--font-serif)" }} className="italic font-normal text-[var(--color-primary)]">VeedUndo</span>
        </h1>
        <div className="space-y-6 text-[var(--color-text-muted)] leading-relaxed">
          <p>
            VeedUndo is Kerala&apos;s hyperlocal rental board. We help people find houses, apartments, and rooms for rent directly from owners — no brokers, no runaround.
          </p>
          <p>
            Post a listing in under 2 minutes. Browse rentals near you. Contact owners directly on WhatsApp or phone. It&apos;s that simple.
          </p>
          <h2 className="text-2xl font-bold text-[var(--color-text)] pt-4">How it works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Post your listing</strong> — Add photos, set your rent, describe your place.</li>
            <li><strong>Get discovered</strong> — Renters in your area find your listing.</li>
            <li><strong>Connect directly</strong> — Chat on WhatsApp or call the owner.</li>
          </ol>
          <h2 className="text-2xl font-bold text-[var(--color-text)] pt-4">For owners</h2>
          <p>
            List your property for free. No hidden charges. Listings stay live for 7 days and can be renewed anytime. Mark as rented when you find a tenant.
          </p>
        </div>
      </main>
    </div>
  );
}
