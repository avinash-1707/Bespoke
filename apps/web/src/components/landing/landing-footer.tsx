import Link from "next/link";
import { LandingLogo } from "./landing-logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--lp-line)] bg-[var(--lp-bg-sunk)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2.5">
          <LandingLogo />
          <span className="font-display text-base font-semibold text-[var(--lp-text)]">
            Bespoke
          </span>
        </div>

        <nav className="flex items-center gap-6 text-sm text-[var(--lp-text-soft)]">
          <a href="#how-it-works" className="transition-colors duration-200 hover:text-[var(--lp-text)]">
            How it works
          </a>
          <a href="#craft" className="transition-colors duration-200 hover:text-[var(--lp-text)]">
            Craft
          </a>
          <Link href="/sign-in" className="transition-colors duration-200 hover:text-[var(--lp-text)]">
            Sign in
          </Link>
        </nav>

        <p className="text-xs text-[var(--lp-text-faint)]">
          © {new Date().getFullYear()} Bespoke. Made to measure.
        </p>
      </div>
    </footer>
  );
}
