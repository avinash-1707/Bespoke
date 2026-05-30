import { BrandLogo } from "@/components/brand-logo";
import { Reveal } from "@/components/landing/reveal";

/**
 * The ink-panel half of the auth split layout (desktop only). Mirrors the
 * landing page's "atelier" world — deep ink ground, navy ambient glow, a
 * single gold hairline as a craft cue, and an editorial pull-quote. Pure
 * decoration: the form pane carries everything functional, so this is hidden
 * below `lg` rather than reflowed.
 */
export function BrandPane() {
  return (
    <aside className="relative hidden overflow-hidden bg-(--lp-ink-panel) lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Navy ambient glow, anchored low-left. Decorative, reduced-motion safe. */}
      <div
        className="lp-drift pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-(--lp-accent-tint) blur-[100px]"
        aria-hidden="true"
      />
      {/* Gold hairline running down the inner edge. */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-(--lp-gold)/40 to-transparent"
        aria-hidden="true"
      />

      <Reveal>
        <a
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Bespoke home"
        >
          <BrandLogo className="bg-(--lp-text-invert) text-(--lp-accent)" />
          <span className="font-display text-lg font-semibold tracking-tight text-(--lp-text-invert)">
            Bespoke
          </span>
        </a>
      </Reveal>

      <div className="relative max-w-md">
        <Reveal delay={120}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-(--lp-gold)">
            Made to measure
          </p>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-5 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-(--lp-text-invert) xl:text-4xl">
            Outreach cut for one reader, not stamped from a template.
          </p>
        </Reveal>
        <Reveal delay={280}>
          <p className="mt-5 text-sm leading-relaxed text-(--lp-text-invert-soft)">
            Sign in to keep every conversation, from the first line to the
            reply, in one place.
          </p>
        </Reveal>
      </div>

      <Reveal delay={360}>
        <p className="text-xs text-(--lp-text-invert-soft)/70">
          © {new Date().getFullYear()} Bespoke
        </p>
      </Reveal>
    </aside>
  );
}
