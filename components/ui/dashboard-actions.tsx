"use client";

/* ============================================================================
   ui/dashboard-actions.tsx — real dashboard toolbar controls.

   Calendar opens a date-range picker and writes from/to into the URL.
   Customize opens a page-provided slice panel. No scroll/focus pulse effects.
   ========================================================================== */

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultDateRange, type DashboardDateRange } from "@/lib/date-range";

function useAnchoredPopover(open: boolean, triggerRef: React.RefObject<HTMLButtonElement | null>) {
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const compute = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    };
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [open, triggerRef]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      triggerRef.current?.click();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") triggerRef.current?.click();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, triggerRef]);

  return { popoverRef, pos };
}

function updateSearchParams(
  pathname: string,
  searchParams: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const params = new URLSearchParams(searchParams.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function DashboardDateRangeButton({ range }: { range: DashboardDateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState(range.from);
  const [to, setTo] = React.useState(range.to);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const { popoverRef, pos } = useAnchoredPopover(open, triggerRef);

  const applyRange = (next: DashboardDateRange | { from: string; to: string; allTime?: boolean }) => {
    router.replace(
      updateSearchParams(pathname, searchParams, {
        from: next.allTime ? null : next.from,
        to: next.allTime ? null : next.to,
        range: next.allTime ? "all" : null,
      }),
      { scroll: false },
    );
    setOpen(false);
  };

  const applyPreset = (days: number) => applyRange(defaultDateRange(days));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open) {
            setFrom(range.from);
            setTo(range.to);
          }
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md bg-card px-2.5 text-[13px] font-medium text-foreground shadow-card",
          "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35",
          open && "bg-secondary",
        )}
      >
        <CalendarDays size={15} strokeWidth={1.75} aria-hidden />
        <span>{range.label}</span>
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="z-50 w-[300px] rounded-md border border-border bg-card p-3 text-foreground shadow-lg"
          >
            <div className="grid grid-cols-2 gap-1">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => applyPreset(days)}
                  className={cn(
                    "h-8 rounded-md px-2 text-left text-[13px] font-medium hover:bg-secondary",
                    !range.allTime && range.days === days && "bg-secondary text-foreground",
                  )}
                >
                  Last {days} days
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyRange({ from: "", to: "", allTime: true })}
                className={cn(
                  "h-8 rounded-md px-2 text-left text-[13px] font-medium hover:bg-secondary",
                  range.allTime && "bg-secondary text-foreground",
                )}
              >
                All time
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <label className="space-y-1 text-[12px] font-medium text-muted-foreground">
                <span>From</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <label className="space-y-1 text-[12px] font-medium text-muted-foreground">
                <span>To</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => applyRange({ from, to })}
              className="mt-3 h-8 w-full rounded-md bg-foreground px-2 text-[13px] font-medium text-card hover:opacity-90"
            >
              Apply range
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

export function DashboardCustomizeButton({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const { popoverRef, pos } = useAnchoredPopover(open, triggerRef);

  if (!children) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md bg-card px-2.5 text-[13px] font-medium text-foreground shadow-card",
          "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35",
          open && "bg-secondary",
        )}
      >
        <SlidersHorizontal size={15} strokeWidth={1.75} aria-hidden />
        <span>Customize</span>
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="z-50 w-[320px] rounded-md border border-border bg-card p-3 text-foreground shadow-lg"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

export function DashboardExploreButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Explore ${label}`}
      title={`Explore ${label}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35",
        className,
      )}
    >
      <Search size={15} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
