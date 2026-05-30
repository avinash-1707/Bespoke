"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { useLenis } from "lenis/react";
import { LandingLogo } from "./landing-logo";

const NAV_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Craft", href: "#craft" },
  { label: "The difference", href: "#difference" },
];

const SCROLL_THRESHOLD = 24;

/**
 * Marketing nav. At the very top it is a transparent, borderless, full-width
 * bar over the hero; once the page scrolls it condenses into a floating,
 * centered capsule (paper tile, hairline border, soft shadow, pill radius) at a
 * narrower max width. The condense is a smooth, bounce-free spring on
 * non-transform reflow props (no child distortion); the bar also materializes
 * on load (fade + lift + de-blur). All motion is disabled under reduced motion.
 */
export function LandingNav() {
  const reducedMotion = useReducedMotion();
  const lenis = useLenis();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > SCROLL_THRESHOLD);
  });

  // Smooth in-page anchor scroll via Lenis, offset for the fixed nav. Falls
  // back to the browser's native jump when Lenis is absent (reduced motion).
  function handleAnchor(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!lenis) return;
    event.preventDefault();
    lenis.scrollTo(href, { offset: -96, duration: 1.2 });
  }

  const transition = reducedMotion
    ? { duration: 0 }
    : ({ type: "spring", bounce: 0, duration: 0.5 } as const);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4"
      initial={
        reducedMotion ? false : { opacity: 0, y: -12, filter: "blur(6px)" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: "spring", bounce: 0, duration: 0.6 }
      }
    >
      <motion.nav
        className="relative mx-auto flex h-18 w-full max-w-6xl items-center justify-between gap-4 border border-solid px-5 sm:px-8"
        initial={false}
        animate={{
          marginTop: scrolled ? 24 : 16,
          borderRadius: scrolled ? 6 : 0,
          backgroundColor: scrolled
            ? "rgba(250,247,240,0.72)"
            : "rgba(250,247,240,0)",
          borderColor: scrolled ? "var(--lp-line)" : "rgba(0,0,0,0)",
          backdropFilter: scrolled ? "blur(12px)" : "blur(0px)",
          boxShadow: scrolled
            ? "0 12px 32px -18px rgba(33,28,23,0.3)"
            : "0 0px 0px 0px rgba(33,28,23,0)",
        }}
        style={{
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "blur(0px)",
        }}
        transition={transition}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Bespoke home"
        >
          <LandingLogo />
          <span className="font-display text-lg font-semibold tracking-tight text-(--lp-text)">
            Bespoke
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleAnchor(event, link.href)}
              className="text-sm text-(--lp-text-soft) transition-colors duration-200 hover:text-(--lp-text)"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/sign-in"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-(--lp-text-soft) transition-colors duration-200 hover:text-(--lp-text) sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-md bg-(--lp-text) px-4 py-2 text-sm font-medium text-(--lp-text-invert) transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            Start free
          </Link>
        </div>
      </motion.nav>
    </motion.header>
  );
}
