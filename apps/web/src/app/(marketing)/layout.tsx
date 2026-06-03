import type { ReactNode } from "react";
import { LandingSmoothScroll } from "@/components/landing/landing-smooth-scroll";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";

/**
 * Marketing shell: the warm `--lp-*` atelier surface, window-level smooth
 * scrolling, and the shared nav + footer wrapped around every marketing page.
 * Isolated from the dark product (dashboard) and the auth split by its own
 * route group, so the palette and chrome never leak across.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--lp-bg)] font-body text-[var(--lp-text)] antialiased">
      <LandingSmoothScroll>
        <LandingNav />
        {children}
        <LandingFooter />
      </LandingSmoothScroll>
    </div>
  );
}
