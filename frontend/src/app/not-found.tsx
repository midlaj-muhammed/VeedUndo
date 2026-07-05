import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <p className="text-8xl font-bold text-[var(--color-primary)] mb-4">404</p>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">Page not found</h1>
          <p className="text-[var(--color-text-muted)] mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="btn btn-primary px-6 py-3">Back to home</Link>
        </div>
      </main>
    </div>
  );
}
