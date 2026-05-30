interface LandingLogoProps {
  className?: string;
}

/**
 * Bespoke monogram: a needle drawing a single stitch, nodding to tailoring:
 * every message cut for one person. Colors come from the landing tokens so
 * the mark restyles with the rest of the page.
 */
export function LandingLogo({ className }: LandingLogoProps) {
  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-md bg-[var(--lp-text)] ${className ?? ""}`}
      aria-hidden="true"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--lp-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20 L20 4" />
        <path d="M4 20 l4 -1 -3 -3 -1 4" fill="var(--lp-accent)" />
        <circle cx="18" cy="6" r="1.4" stroke="var(--lp-text-invert)" />
      </svg>
    </span>
  );
}
