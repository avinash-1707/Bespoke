"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { SidebarContent } from "@/components/shell/sidebar-content";
import { MobileTopBar } from "@/components/shell/mobile-top-bar";

/**
 * Signed-in product shell: a fixed left rail on desktop (collapses to a sheet on
 * mobile) plus a scrollable content column. `MotionConfig reducedMotion="user"`
 * makes every Motion animation in the dashboard honor the OS setting in one
 * place; `Toaster` is the single toast surface for the product (dark themed).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
        <aside className="hidden w-60 shrink-0 border-r border-[var(--border-default)] md:block">
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </div>

      <Toaster theme="dark" position="bottom-right" richColors />
    </MotionConfig>
  );
}
