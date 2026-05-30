import { BrandLogo } from "@/components/brand-logo";

interface LandingLogoProps {
  className?: string;
}

/**
 * Landing-page skin of the shared {@link BrandLogo}: navy mark on the warm
 * paper "ink" tile so the mark sits in the landing palette. The mark itself
 * lives in one place — see `components/brand-logo.tsx`.
 */
export function LandingLogo({ className }: LandingLogoProps) {
  return (
    <BrandLogo
      className={`bg-[var(--lp-text)] text-[var(--lp-accent)] ${className ?? ""}`}
    />
  );
}
