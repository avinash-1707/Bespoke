import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { BrandPane } from "@/components/auth/brand-pane";

/**
 * Auth split shell on the warm landing palette. Desktop: ink brand pane +
 * form pane side by side. Mobile/tablet: the brand pane drops away and the
 * form pane fills the screen, with a compact wordmark up top.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-svh bg-[var(--lp-bg)] lg:grid-cols-[1.05fr_1fr]">
      <BrandPane />

      <div className="flex flex-col items-center justify-center px-5 py-10 sm:px-8 sm:py-12">
        <a
          href="/"
          className="mb-10 flex items-center gap-2.5 lg:hidden"
          aria-label="Bespoke home"
        >
          <BrandLogo className="bg-[var(--lp-text)] text-[var(--lp-accent)]" />
          <span className="font-display text-lg font-semibold tracking-tight text-[var(--lp-text)]">
            Bespoke
          </span>
        </a>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
