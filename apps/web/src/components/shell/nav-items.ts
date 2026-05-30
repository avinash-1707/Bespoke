import {
  LayoutDashboard,
  MessagesSquare,
  Package,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** When true, the item is active only on an exact path match (the Home tab). */
  exact?: boolean;
}

/** Primary dashboard navigation, rendered in the sidebar in this order. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Offerings", href: "/dashboard/offerings", icon: Package },
  { label: "Prospects", href: "/dashboard/prospects", icon: Users },
  { label: "Prompts", href: "/dashboard/prompts", icon: Sparkles },
  {
    label: "Conversations",
    href: "/dashboard/conversations",
    icon: MessagesSquare,
  },
];

/** Resolve whether a nav item is active for the current pathname. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
