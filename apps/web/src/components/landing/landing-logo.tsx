import { BrandLogo } from "@/components/brand-logo";

interface LandingLogoProps {
  className?: string;
}

/**
 * Landing-page skin of the shared {@link BrandLogo}: navy mark on a light paper
 * tile so it sits cleanly on the warm nav/footer surfaces. The mark itself
 * lives in one place — see `components/brand-logo.tsx`.
 */
export function LandingLogo({ className }: LandingLogoProps) {
  return (
    <BrandLogo
      className={`bg-[var(--lp-bg-raised)] text-[var(--lp-accent)] ${className ?? ""}`}
    />
  );
}
