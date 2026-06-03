const PHRASES: ReadonlyArray<string> = [
  "Founders doing their own outreach",
  "Account executives",
  "Agency new-business leads",
  "Solo consultants",
  "Recruiters who hate templates",
  "Anyone who sells with words",
];

/**
 * Quiet, continuously scrolling band of who Bespoke is for. The track is
 * duplicated so the marquee loops seamlessly; motion is paused entirely
 * under reduced-motion (see globals.css).
 */
export function TrustStrip() {
  return (
    <section className="border-y border-[var(--lp-line)] bg-[var(--lp-bg-sunk)] py-5">
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="lp-marquee flex shrink-0 items-center gap-10 pr-10">
          {[...PHRASES, ...PHRASES].map((phrase, index) => (
            <span
              key={index}
              className="flex items-center gap-10 whitespace-nowrap text-sm font-medium text-[var(--lp-text-soft)]"
            >
              {phrase}
              <span
                className="h-1 w-1 rounded-full bg-[var(--lp-accent)]"
                aria-hidden="true"
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
