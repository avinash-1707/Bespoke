import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { GlobeBackdrop } from "./globe-backdrop";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Constrained stage: globe + glow + copy all align to the same
          max-w-6xl column the rest of the page uses. */}
      <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-36">
        {/* Rotating dot-globe, anchored to the column's right edge. */}
        <GlobeBackdrop />
        {/* Ambient glow warms the right side where the globe sits. */}
        <div
          className="lp-drift pointer-events-none absolute -top-32 right-0 z-0 h-136 w-136 rounded-full bg-(--lp-accent-tint) blur-[120px]"
          aria-hidden="true"
        />
        {/* Scrim: keep the page bg solid under the text column, fade to clear
            over the globe so copy never loses contrast. */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-linear-to-r from-(--lp-bg) via-(--lp-bg)/85 to-transparent"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-(--lp-line-strong) bg-(--lp-bg-raised) px-3.5 py-1.5 text-xs font-medium tracking-wide text-(--lp-text-soft)">
              <span
                className="h-1.5 w-1.5 rounded-full bg-(--lp-accent)"
                aria-hidden="true"
              />
              Outreach, made to measure
            </span>
          </Reveal>

          {/* Mixed-weight editorial headline: light label, heavy turn,
              oversized accent line in brand color. */}
          <Reveal delay={80}>
            <h1 className="mt-8 font-display tracking-tight text-(--lp-text)">
              <span className="block text-[clamp(1.5rem,4vw,2.5rem)] font-light text-(--lp-text-soft)">
                Every message,
              </span>
              <span className="mt-1 block text-[clamp(3rem,8vw,6rem)] font-semibold leading-[0.9]">
                cut for
              </span>
              <span className="mt-1 block text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] text-(--lp-accent)">
                one reader.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-8 max-w-md text-balance text-lg leading-relaxed text-(--lp-text-soft) sm:text-xl">
              Personalized outreach that sounds hand-written, and one place to
              carry the whole conversation through to the reply.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-10">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-md bg-(--lp-accent) px-6 py-3.5 text-base font-medium text-(--lp-text-invert) transition-transform duration-200 ease-out hover:-translate-y-0.5"
              >
                Write your first one
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
