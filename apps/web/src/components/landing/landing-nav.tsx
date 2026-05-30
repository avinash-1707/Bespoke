import Link from "next/link";
import { LandingLogo } from "./landing-logo";

const NAV_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Craft", href: "#craft" },
  { label: "The difference", href: "#difference" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--lp-line)] bg-[var(--lp-bg)]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Bespoke home">
          <LandingLogo />
          <span className="font-display text-lg font-semibold tracking-tight text-[var(--lp-text)]">
            Bespoke
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--lp-text-soft)] transition-colors duration-200 hover:text-[var(--lp-text)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/sign-in"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--lp-text-soft)] transition-colors duration-200 hover:text-[var(--lp-text)] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-md bg-[var(--lp-text)] px-4 py-2 text-sm font-medium text-[var(--lp-text-invert)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
