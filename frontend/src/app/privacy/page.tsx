import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy - VeedUndo",
  description: "VeedUndo privacy policy. How we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] mb-8">
          Privacy <span style={{ fontFamily: "var(--font-serif)" }} className="italic font-normal text-[var(--color-primary)]">Policy</span>
        </h1>
        <div className="space-y-6 text-[var(--color-text-muted)] leading-relaxed text-sm">
          <p><em>Last updated: July 2026</em></p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Information we collect</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Account info:</strong> Email address and password when you create an account.</li>
            <li><strong>Listing data:</strong> Photos, descriptions, rent, location, and contact details you submit.</li>
            <li><strong>Usage data:</strong> Pages visited, interactions, and device type (collected automatically).</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">How we use your information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To display your listings to renters.</li>
            <li>To authenticate your account.</li>
            <li>To improve VeedUndo&apos;s features and performance.</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Data storage</h2>
          <p>
            Your data is stored securely on Supabase (hosted on AWS). Photos are stored in Supabase Storage. We do not sell or share your personal data with third parties.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Listing visibility</h2>
          <p>
            Listings you post are publicly visible on the Browse page. Rented listings are automatically hidden after 7 days. You can delete your listings anytime from the Dashboard.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Cookies</h2>
          <p>
            VeedUndo uses only essential cookies for authentication and theme preference. We do not use tracking or advertising cookies.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Your rights</h2>
          <p>
            You can request deletion of your account and all associated data by contacting us at <a href="mailto:hello@veedundo.com" className="text-[var(--color-primary)] hover:underline">hello@veedundo.com</a>.
          </p>

          <h2 className="text-xl font-bold text-[var(--color-text)] pt-2">Contact</h2>
          <p>
            For privacy-related questions, reach us at <a href="tel:9744140313" className="text-[var(--color-primary)] hover:underline">9744140313</a> or <a href="mailto:hello@veedundo.com" className="text-[var(--color-primary)] hover:underline">hello@veedundo.com</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
