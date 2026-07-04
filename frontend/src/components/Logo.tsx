import Link from "next/link";

/* ── House Icon (geometric, minimal) ── */
function HouseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Roof — clean chevron */}
      <path
        d="M3 10.5L12 3l9 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Body — single-line walls + floor */}
      <path
        d="M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Door — subtle indent */}
      <path
        d="M9.5 21V14a1 1 0 011-1h3a1 1 0 011 1v7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Full Logo: Icon + Wordmark ── */
export function Logo({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "default" | "large";
}) {
  const iconSize = size === "large" ? "w-6 h-6" : "w-5 h-5";
  const textSize = size === "large" ? "text-lg" : "text-base";

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <HouseIcon className={iconSize} />
      <span
        className={`${textSize} font-bold text-[var(--color-text)] tracking-tight`}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        VeedUndo
      </span>
    </Link>
  );
}

/* ── Icon Only (for favicon, small spaces) ── */
export function LogoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return <HouseIcon className={className} />;
}

export default Logo;
