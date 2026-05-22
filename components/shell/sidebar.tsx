"use client";

/* ============================================================================
   shell/sidebar.tsx — Persistent left navigation.

   Width: 240px, fixed. Background = canvas warm gray, separated from the
   white content area by a 1px hairline. Section labels in all-caps 11px
   tertiary gray with whitespace separation (no dividers).

   Active state is derived from the route via usePathname(). Only one
   item is active at a time. Hover = soft fill, active = darker fill +
   medium-weight label.

   To add a new dashboard:
     1. Append to NAV_GROUPS below in the right section, or create a new
        section.
     2. Make sure no group exceeds 6 items; if it does, split it. If a
        section has only one item, leave it ungrouped at the top.
     3. Order sections by frequency-of-use, not alphabetically.
   ========================================================================== */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Filter,
  Compass,
  Users,
  List,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  /** All-caps section label. null = no label (sits at the top, ungrouped). */
  heading: string | null;
  items: NavItem[];
};

const NAV_GROUPS: ReadonlyArray<NavGroup> = [
  // Ungrouped at the very top — the home / glance-first page.
  {
    heading: null,
    items: [{ href: "/", label: "Overview", icon: LayoutDashboard }],
  },
  // Acquisition cluster — how visitors find Helvi and move through the funnel.
  {
    heading: "Acquisition",
    items: [
      { href: "/funnel",  label: "Funnel",  icon: Filter },
      { href: "/sources", label: "Sources", icon: Compass },
    ],
  },
  // Audience cluster — who the leads are and the raw row-level view.
  {
    heading: "Audience",
    items: [
      { href: "/demographics", label: "Demographics", icon: Users },
      { href: "/leads",        label: "Leads",        icon: List },
    ],
  },
];

export function Sidebar() {
  return (
    <aside
      className={cn(
        "flex flex-col",
        "w-14 lg:w-60 shrink-0 h-screen sticky top-0",
        "bg-sidebar border-r border-border",
      )}
    >
      <nav className="flex-1 overflow-y-auto px-2 lg:px-3 py-3 lg:py-4 space-y-5">
        {NAV_GROUPS.map((group, gi) => (
          <NavSection key={gi} group={group} />
        ))}
      </nav>
      <div className="border-t border-border px-2 lg:px-3 py-3">
        <NavRow item={{ href: "/settings", label: "Settings", icon: Settings }} />
      </div>
    </aside>
  );
}

function NavSection({ group }: { group: NavGroup }) {
  return (
    <div className="space-y-0.5">
      {group.heading && (
        <h2 className="hidden lg:block px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-tertiary-foreground">
          {group.heading}
        </h2>
      )}
      {group.items.map((item) => (
        <NavRow key={item.href} item={item} />
      ))}
    </div>
  );
}

function NavRow({ item }: { item: NavItem }) {
  const pathname = usePathname();
  // Exact match for root; prefix match for sub-pages so /leads/[id] still
  // highlights "Leads". With only top-level routes today both are equivalent.
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center justify-center lg:justify-start gap-2.5 h-8 px-2 rounded-md",
        "transition-colors duration-100",
        isActive
          ? "bg-[#E4E5E7] text-foreground font-semibold before:absolute before:left-0 before:top-1.5 before:h-5 before:w-0.5 before:rounded-full before:bg-accent"
          : "text-foreground/85 hover:bg-[#EDEEEF] hover:text-foreground",
      )}
      title={item.label}
    >
      <Icon
        size={16}
        strokeWidth={1.6}
        className={cn(
          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden
      />
      <span className={cn("hidden lg:inline text-[14px]", isActive ? "font-semibold" : "font-medium")}>
        {item.label}
      </span>
    </Link>
  );
}
