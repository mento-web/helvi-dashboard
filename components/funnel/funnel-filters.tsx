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

  /* ── apply: write zero or more URL params at once, then router.replace ── */
  const apply = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
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
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const anyFilterActive = FUNNEL_FILTER_KEYS.some(
    (k) => (filters[k]?.length ?? 0) > 0,
  );
  const demographicActive = DEMO_KEYS.some(
    (k) => (filters[k]?.length ?? 0) > 0,
  );

  return (
    <div className="rounded-md border border-border bg-card p-3 flex flex-col gap-2.5">
      {/* ── Row 1 · date range + presets + reset ────────────────────── */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">
          Date
        </span>
        <DateField value={filters.from} onChange={(v) => setDate("from", v)} />
        <span className="text-muted-foreground text-sm">→</span>
        <DateField value={filters.to} onChange={(v) => setDate("to", v)} />
        <div className="ml-2 flex items-center gap-1">
          <PresetChip onClick={() => setDateRange(7)}>7d</PresetChip>
          <PresetChip onClick={() => setDateRange(30)}>30d</PresetChip>
          <PresetChip onClick={() => setDateRange(90)}>90d</PresetChip>
        </div>
        {anyFilterActive && (
          <button
            onClick={resetAll}
            className="ml-auto font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            reset all
          </button>
        )}
      </div>

      {/* ── Row 2 · traffic dimensions ──────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">
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
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">
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
          <span className="text-[10px] text-muted-foreground italic ml-1">
            ⓘ Demographic filters narrow the funnel to visitors who reached the survey.
          </span>
        )}
      </div>
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
      className="font-mono text-xs px-2 py-1 border border-border rounded bg-card focus:outline-none focus:ring-1 focus:ring-foreground"
    />
  );
}

/* ── PresetChip — small button for 7d / 30d / 90d quick-select ──────── */
function PresetChip({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[11px] uppercase tracking-wider px-2 py-1 border border-border rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
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
      setPos(null);
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
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "font-mono text-[11px] px-2 py-1 border rounded inline-flex items-center gap-1.5 transition-colors",
          disabled
            ? "border-border bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
            : "border-border bg-card hover:bg-muted",
          hasValues && !disabled && "text-foreground border-foreground/30",
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
            className="z-50 min-w-[220px] max-h-[320px] overflow-y-auto bg-card border border-border rounded-md shadow-md p-2 text-foreground"
          >
            {options.length === 0 && !hasValues ? (
              <div className="font-mono text-[11px] text-muted-foreground px-1.5 py-1">
                no values in range
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
                      <span className="font-mono text-xs truncate">{opt}</span>
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
                    <span className="font-mono text-xs truncate italic">{opt} (out of range)</span>
                  </label>
                ))}
                {hasValues && (
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground mt-2 ml-1.5"
                  >
                    clear
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
