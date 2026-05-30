"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar-content";

/**
 * Mobile-only header: a menu button that opens the sidebar as a left sheet, and
 * the brand mark linking to the landing page. Hidden on desktop, where the
 * fixed rail is always visible.
 */
export function MobileTopBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-3 border-b border-[var(--border-default)] bg-[var(--bg-base)] px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open navigation"
          className="rounded-md p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 border-[var(--border-default)] bg-[var(--bg-surface)] p-0"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex items-center gap-2">
        <BrandLogo size={24} />
        <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          Bespoke
        </span>
      </Link>
    </header>
  );
}
