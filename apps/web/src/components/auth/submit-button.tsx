"use client";

import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface SubmitButtonProps {
  pending: boolean;
  /** Label shown while pending for reduced-motion users (no animated loader). */
  pendingLabel: string;
  children: ReactNode;
}

/**
 * Primary auth action. While the request is pending it shows the provided
 * "l13" dot loader (functional feedback during async work). Reduced-motion
 * users get a plain text label instead so nothing freezes mid-animation.
 * The label is kept mounted but hidden so the button never changes height.
 */
export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: SubmitButtonProps) {
  const reduce = useReducedMotion();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-md bg-(--lp-accent) px-6 text-sm font-medium text-(--lp-text-invert) transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-(--lp-accent-deep) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--lp-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--lp-bg-raised) disabled:translate-y-0 disabled:cursor-progress"
    >
      <span className={pending ? "invisible" : "visible"} aria-hidden={pending}>
        {children}
      </span>
      {pending ? (
        <span className="absolute inset-0 flex items-center justify-center">
          {reduce ? (
            <span className="text-sm font-medium">{pendingLabel}</span>
          ) : (
            <span
              className="auth-loader"
              role="status"
              aria-label={pendingLabel}
            />
          )}
        </span>
      ) : null}
    </button>
  );
}
