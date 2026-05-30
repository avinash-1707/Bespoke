import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Comparison } from "@/components/landing/comparison";
import { CtaBand } from "@/components/landing/cta-band";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Bespoke | outreach, made to measure",
  description:
    "Bespoke writes outreach cut for one reader and keeps the whole conversation in one place, all the way to the reply.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--lp-bg)] font-body text-[var(--lp-text)] antialiased">
      <LandingNav />
      <main>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <FeatureGrid />
        <Comparison />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
