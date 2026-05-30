"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

interface SidebarNavProps {
  /** Called after a nav link is clicked — used to close the mobile sheet. */
  onNavigate?: () => void;
}

/**
 * Primary tab navigation. The active item is backed by a single shared-layout
 * pill (`layoutId`) that slides between items on route change — a subtle
 * orientation cue, not decoration. The slide collapses to an instant swap under
 * reduced motion via the layout-level MotionConfig.
 */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "text-[var(--accent-text)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-md bg-[var(--accent-subtle)]"
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              />
            ) : null}
            <Icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10 font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
