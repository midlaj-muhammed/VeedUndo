import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms of Service - VeedUndo",
  description: "VeedUndo terms of service. Rules for posting and using the platform.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] mb-8">
          Terms of <span style={{ fontFamily: "var(--font-serif)" }} className="italic font-normal text-[var(--color-primary)]">Service</span>
        </h1>
        <div className="space-y-6 text-[var(--color-text-muted)] leading-relaxed text-sm">
          <p><em>Last updated: July 2026</em></p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Acceptance</h2>
          <p>
            By using VeedUndo, you agree to these terms. If you don&apos;t agree, please don&apos;t use the platform.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Listing rules</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Only post properties you own or have authority to rent.</li>
            <li>Listings must include accurate information (rent, location, photos).</li>
            <li>No fake listings, spam, or duplicate postings.</li>
            <li>Listings expire after 7 days and can be renewed from your Dashboard.</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">User accounts</h2>
          <p>
            You are responsible for your account security. Don&apos;t share your password. One account per person.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Prohibited content</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Illegal or fraudulent listings.</li>
            <li>Discriminatory language or policies.</li>
            <li>Content that infringes on others&apos; rights.</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Liability</h2>
          <p>
            VeedUndo is a platform connecting owners and renters. We are not a party to any rental agreement. We don&apos;t verify listings and are not responsible for the accuracy of user-submitted content.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Account termination</h2>
          <p>
            We reserve the right to remove listings or suspend accounts that violate these terms.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Contact</h2>
          <p>
            Questions about these terms? Reach us at <a href="tel:9744140313" className="text-[var(--color-primary)] hover:underline">9744140313</a> or <a href="mailto:hello@veedundo.com" className="text-[var(--color-primary)] hover:underline">hello@veedundo.com</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
