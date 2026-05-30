"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

/**
 * Window-level Lenis for the marketing pages, tuned for a slow, smooth editorial
 * glide (scrolling here is rare, so expressive motion is welcome). Wraps the
 * marketing content so descendants (e.g. the nav) can read the Lenis instance
 * via `useLenis` for smooth in-page anchor scrolling. Disabled under reduced
 * motion, where it renders children as-is (native scroll).
 */
export function LandingSmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        duration: 1.6,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      }}
    >
      {children}
    </ReactLenis>
  );
}
