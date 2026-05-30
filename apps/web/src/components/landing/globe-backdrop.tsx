"use client";

import dynamic from "next/dynamic";

// WebGL is client-only and heavy; load it lazily so it never blocks paint.
// The `ssr: false` dynamic import must live in a Client Component (Next 16).
const Globe = dynamic(() => import("./globe").then((m) => m.Globe), {
  ssr: false,
});

/**
 * Brand-tinted rotating dot-globe, anchored to the right so it never sits
 * under the headline. On mobile it drifts further off-canvas (text owns the
 * width); on large screens it reads as a globe beside the copy. Edge-masked
 * so it fades into the page rather than ending on a hard circle.
 */
export function GlobeBackdrop() {
  return (
    <div
      className="pointer-events-none absolute top-1/2 right-4 z-0 aspect-square w-[24rem] -translate-y-1/2 opacity-90 [mask-image:radial-gradient(circle_at_center,black_55%,transparent_72%)] sm:right-6 sm:w-[32rem] lg:right-8 lg:w-[42rem]"
      aria-hidden="true"
    >
      <Globe />
    </div>
  );
}
