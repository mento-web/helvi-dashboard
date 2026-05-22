"use client";

/* ============================================================================
   funnel/funnel-filters.tsx — Filter bar above the /funnel page.

   State lives in URL search params, not React state. Every change is
   pushed via router.replace() so the URL is shareable and the server
   page re-runs its query with the new params. The component is "dumb"
   in that sense: it reads the active filters from the URL via
   useSearchParams(), renders chips, and writes back on user action.

   Layout (top to bottom):
     · Date row     — two <input type="date"> + 7/30/90-day presets + reset
     · Traffic row  — multi-selects for UTM source/medium/campaign, device,
                      landing page (always known per visitor)
     · Demo row     — multi-selects for gender, eligibility, BMI band, with
                      an inline note that these restrict the cohort to
                      visitors who reached lead_created

   Each multi-select is a portalled checkbox popover (same pattern as the
   /leads column dropdowns) so it can escape any parent overflow.
   ========================================================================== */

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FUNNEL_FILTER_KEYS,
  type FunnelFilterKey,
  type FunnelFilterOptions,
  type FunnelFilters as FunnelFiltersState,
  defaultFunnelFilters,
} from "@/lib/funnel-filters-shared";
import { cn } from "@/lib/utils";

const KEY_LABEL: Record<FunnelFilterKey, string> = {
  utm_source:   "Source",
  utm_medium:   "Medium",
  utm_campaign: "Campaign",
  landing_page: "Landing page",
  device_type:  "Device",
  gender:       "Gender",
  eligibility:  "Eligibility",
  bmi_bucket:   "BMI band",
};

const TRAFFIC_KEYS: FunnelFilterKey[] = [
  "utm_source", "utm_medium", "utm_campaign", "device_type", "landing_page",
];
const DEMO_KEYS: FunnelFilterKey[] = [
  "gender", "eligibility", "bmi_bucket",
];

export function FunnelFilters({
  filters,
  options,
}: {
  filters: FunnelFiltersState;
  options: FunnelFilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  /* ── apply: write zero or more URL params at once, then router.replace ── */
  const apply = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const setDateRange = (days: number) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const since = new Date(today);
    since.setUTCDate(since.getUTCDate() - days);
    apply({
      from: since.toISOString().slice(0, 10),
      to:   tomorrow.toISOString().slice(0, 10),
    });
  };

  const setDate = (key: "from" | "to", value: string) => {
    if (!value) return; // ignore date field clears mid-edit
    apply({ [key]: value });
  };

  const setMulti = (key: FunnelFilterKey, values: string[]) =>
    apply({ [key]: values.length > 0 ? values.join(",") : null });

  const resetAll = () => {
    const d = defaultFunnelFilters();
    const params = new URLSearchParams();
    params.set("from", d.from);
    params.set("to", d.to);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const defaults = defaultFunnelFilters();
  const dateChanged = filters.from !== defaults.from || filters.to !== defaults.to;
  const anyFilterActive = FUNNEL_FILTER_KEYS.some(
    (k) => (filters[k]?.length ?? 0) > 0,
  );
  const demographicActive = DEMO_KEYS.some(
    (k) => (filters[k]?.length ?? 0) > 0,
  );
  const showReset = dateChanged || anyFilterActive;
  const activePreset = presetFor(filters.from, filters.to);

  return (
    <div
      data-dashboard-filters
      className={cn(
        "rounded-[10px] bg-card p-4 shadow-card flex flex-col gap-3",
        isPending && "opacity-80",
      )}
    >
      {/* ── Row 1 · date range + presets + reset ────────────────────── */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-[12px] font-medium text-muted-foreground w-20 shrink-0">
          Date
        </span>
        <DateField value={filters.from} onChange={(v) => setDate("from", v)} />
        <span className="text-muted-foreground text-sm">→</span>
        <DateField value={filters.to} onChange={(v) => setDate("to", v)} />
        <div className="ml-2 flex items-center gap-1">
          <PresetChip active={activePreset === 7} onClick={() => setDateRange(7)}>7d</PresetChip>
          <PresetChip active={activePreset === 30} onClick={() => setDateRange(30)}>30d</PresetChip>
          <PresetChip active={activePreset === 90} onClick={() => setDateRange(90)}>90d</PresetChip>
        </div>
        {showReset && (
          <button
            type="button"
            onClick={resetAll}
            className="ml-auto h-8 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Row 2 · traffic dimensions ──────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-[12px] font-medium text-muted-foreground w-20 shrink-0">
          Traffic
        </span>
        {TRAFFIC_KEYS.map((k) => (
          <MultiSelect
            key={k}
            label={KEY_LABEL[k]}
            options={options[k]}
            selected={filters[k] ?? []}
            onChange={(vals) => setMulti(k, vals)}
          />
        ))}
      </div>

      {/* ── Row 3 · demographics ───────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-[12px] font-medium text-muted-foreground w-20 shrink-0">
          Demo
        </span>
        {DEMO_KEYS.map((k) => (
          <MultiSelect
            key={k}
            label={KEY_LABEL[k]}
            options={options[k]}
            selected={filters[k] ?? []}
            onChange={(vals) => setMulti(k, vals)}
            demographic
          />
        ))}
        {demographicActive && (
          <span className="text-[12px] text-muted-foreground ml-1">
            Demographic filters apply after survey start.
          </span>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {isPending ? "Updating funnel filters" : "Funnel filters ready"}
      </span>
    </div>
  );
}

/* ── DateField — plain native date input, monospaced ─────────────────── */
function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
    />
  );
}

/* ── PresetChip — small button for 7d / 30d / 90d quick-select ──────── */
function PresetChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 rounded-md px-2.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45",
        active
          ? "bg-secondary text-foreground shadow-inner"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ── MultiSelect ─────────────────────────────────────────────────────
   Trigger button + portalled checkbox popover. Same overflow-escape
   pattern as the leads-table column popover so it works inside any
   container regardless of overflow rules. ────────────────────────── */

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  demographic,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  demographic?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }
    const compute = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    };
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter((s) => s !== v));
    else onChange([...selected, v]);
  };

  const hasValues = selected.length > 0;
  const disabled = options.length === 0 && !hasValues;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-8 rounded-md border border-transparent px-2.5 text-[13px] font-medium inline-flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45",
          disabled
            ? "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
            : "bg-card hover:bg-secondary",
          open && !disabled && "bg-secondary text-foreground",
          hasValues && !disabled && "text-foreground border-accent/40",
          !hasValues && !disabled && "text-muted-foreground",
          demographic && hasValues && "border-accent/50",
        )}
      >
        <span>{label}</span>
        {hasValues && <span className="font-medium">({selected.length})</span>}
        <span className="opacity-50">▾</span>
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: pos.top, left: pos.left }}
            className="z-50 min-w-[220px] max-h-[320px] overflow-y-auto bg-card border border-border rounded-md shadow-lg p-2 text-foreground"
          >
            {options.length === 0 && !hasValues ? (
              <div className="text-[12px] text-muted-foreground px-1.5 py-1">
                No values in range
              </div>
            ) : (
              <>
                {options.map((opt) => {
                  const checked = selected.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt)}
                        className="h-3.5 w-3.5 accent-foreground cursor-pointer shrink-0"
                      />
                      <span className="text-[13px] truncate">{opt}</span>
                    </label>
                  );
                })}
                {/* Stale selections — values previously chosen that are no
                    longer in the current date window. Show them so the
                    user can clear them. */}
                {selected.filter((s) => !options.includes(s)).map((opt) => (
                  <label
                    key={`stale-${opt}`}
                    className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-pointer opacity-60"
                  >
                    <input
                      type="checkbox"
                      checked
                      onChange={() => toggle(opt)}
                      className="h-3.5 w-3.5 accent-foreground cursor-pointer shrink-0"
                    />
                    <span className="text-[13px] truncate italic">{opt} (out of range)</span>
                  </label>
                ))}
                {hasValues && (
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="rounded px-1 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground mt-2 ml-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function presetFor(from: string, to: string): 7 | 30 | 90 | null {
  const fromTime = Date.parse(`${from}T00:00:00.000Z`);
  const toTime = Date.parse(`${to}T00:00:00.000Z`);
  if (Number.isNaN(fromTime) || Number.isNaN(toTime)) return null;

  // The query's upper bound is exclusive, so "30d" spans 31 calendar dates:
  // since today - 30 through tomorrow.
  const days = Math.round((toTime - fromTime) / 86_400_000) - 1;
  if (days === 7 || days === 30 || days === 90) return days;
  return null;
}
