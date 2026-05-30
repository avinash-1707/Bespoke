"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SidebarNav } from "./sidebar-nav";
import { ProfileMenu } from "./profile-menu";

interface SidebarContentProps {
  /** Forwarded to the nav so the mobile sheet closes on navigation. */
  onNavigate?: () => void;
}

/**
 * Inner sidebar composition shared by the fixed desktop rail and the mobile
 * sheet: brand mark (links back to the marketing landing), primary nav, and the
 * user/profile footer.
 */
export function SidebarContent({ onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-3 py-4"
      >
        <BrandLogo size={28} />
        <span className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
          Bespoke
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <div className="border-t border-[var(--border-default)] p-2">
        <ProfileMenu />
      </div>
    </div>
  );
}
