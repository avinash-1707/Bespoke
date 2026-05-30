import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

export function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-bg-raised)] px-8 py-16 text-center sm:px-16 sm:py-20">
          <div
            className="lp-drift pointer-events-none absolute -bottom-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--lp-accent-tint)] blur-[80px]"
            aria-hidden="true"
          />
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-[var(--lp-text)] sm:text-5xl">
            Your next message is worth getting right.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-[var(--lp-text-soft)]">
            Set up your offer once. Write something they&apos;ll actually answer
            in the next five minutes.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-md bg-[var(--lp-accent)] px-6 py-3 text-sm font-medium text-[var(--lp-text-invert)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-md border border-[var(--lp-line-strong)] px-6 py-3 text-sm font-medium text-[var(--lp-text)] transition-colors duration-200 hover:bg-[var(--lp-bg)]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
