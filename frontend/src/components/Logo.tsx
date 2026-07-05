import Link from "next/link";

/* ── Full Logo: Serif italic wordmark with accent dot ── */
export function Logo({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "default" | "large";
}) {
  const textSize = size === "large" ? "text-xl" : "text-[17px]";

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <span
        className={`${textSize} font-normal italic tracking-tight text-[var(--color-text)]`}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Veed<span className="font-semibold not-italic">Undo</span>
      </span>
      <span className="text-[var(--color-primary)] text-lg ml-0.5 -mt-2">.</span>
    </Link>
  );
}

/* ── Icon Only (for favicon, small spaces) ── */
export function LogoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 21V14a1 1 0 011-1h3a1 1 0 011 1v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default Logo;
