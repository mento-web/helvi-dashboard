"use client";

/* ============================================================================
   ui/dashboard-actions.tsx — small interactive dashboard controls.

   These buttons intentionally do lightweight, concrete work:
     - period/customize controls focus the page's filters or data table
     - explore controls focus the card they belong to

   The target gets a short dashboard focus outline via globals.css.
   ========================================================================== */

import * as React from "react";
import { CalendarDays, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolbarAction = "period" | "customize";

function focusDashboardTarget(target: Element | null): boolean {
  if (!target) return false;

  const focusTarget = target as HTMLElement;
  focusTarget.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  focusTarget.setAttribute("data-dashboard-focus", "true");
  window.setTimeout(() => {
    focusTarget.removeAttribute("data-dashboard-focus");
  }, 1100);

  const firstFocusable = focusTarget.querySelector<HTMLElement>(
    "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
  );
  firstFocusable?.focus({ preventScroll: true });
  return true;
}

function pageTargetFor(action: ToolbarAction): Element | null {
  if (action === "period") {
    return (
      document.querySelector("[data-dashboard-filters] input[type='date']") ??
      document.querySelector("[data-dashboard-filters]") ??
      document.querySelector("[data-dashboard-card]")
    );
  }

  return (
    document.querySelector("[data-dashboard-filters]") ??
    document.querySelector("[data-dashboard-table]") ??
    document.querySelector("[data-dashboard-card]")
  );
}

function usePulse() {
  const [active, setActive] = React.useState(false);

  const pulse = React.useCallback(() => {
    setActive(true);
    window.setTimeout(() => setActive(false), 500);
  }, []);

  return [active, pulse] as const;
}

export function DashboardToolbarButton({
  action,
  label,
}: {
  action: ToolbarAction;
  label: string;
}) {
  const [active, pulse] = usePulse();
  const Icon = action === "period" ? CalendarDays : SlidersHorizontal;

  return (
    <button
      type="button"
      aria-label={action === "period" ? `Focus date controls for ${label}` : "Focus page controls"}
      title={action === "period" ? "Focus date controls" : "Focus page controls"}
      onClick={() => {
        focusDashboardTarget(pageTargetFor(action));
        pulse();
      }}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md bg-card px-2.5 text-[13px] font-medium text-foreground shadow-card",
        "transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45",
        active && "bg-secondary ring-2 ring-accent/25",
      )}
    >
      <Icon size={15} strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </button>
  );
}

export function DashboardExploreButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const [active, pulse] = usePulse();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={`Focus ${label}`}
      title={`Focus ${label}`}
      onClick={() => {
        const target = buttonRef.current?.closest("[data-dashboard-card]") ?? null;
        focusDashboardTarget(target);
        pulse();
      }}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground transition hover:bg-secondary hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45",
        active && "bg-secondary text-foreground ring-2 ring-accent/25",
        className,
      )}
    >
      <Search size={15} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
