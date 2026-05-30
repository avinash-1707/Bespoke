interface BrandLogoProps {
  /** Tile sizing + color classes. Tile bg sets the chip color; text color
   *  sets the mark color (mark strokes use currentColor). */
  className?: string;
  /** Tile edge length in px. The mark scales proportionally. Default 32. */
  size?: number;
}

/**
 * Bespoke brand mark: a tailor's needle pulling a single stitch — every
 * message cut to measure for one reader. Monochrome and token-agnostic:
 * the tile color comes from the parent's `bg-*` class and the mark color
 * from its `text-*` class, so the same mark restyles per surface (indigo
 * accent in the app, navy on the landing page). Mirrors `app/icon.svg`.
 */
export function BrandLogo({ className, size = 32 }: BrandLogoProps) {
  const inner = Math.round(size * 0.58);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md ${
        className ?? "bg-[var(--bg-surface-elevated)] text-[var(--accent-text)]"
      }`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* needle shaft / seam */}
        <path d="M5 19 L19 5" />
        {/* thread knot pulled through at the start of the stitch */}
        <path d="M5 19 l4.6 -1 -3.6 -3.6 -1 4.6" fill="currentColor" stroke="none" />
        {/* needle eye */}
        <circle cx="17.5" cy="6.5" r="1.5" />
      </svg>
    </span>
  );
}
