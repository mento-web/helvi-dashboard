"use client";

/* ============================================================================
   leads/leads-table.tsx — Excel-style interactive leads table.

   Each column header is a dropdown trigger. Clicking opens a popover
   beneath the header with:
     - Sort options (asc / desc, with labels appropriate to the column type)
     - A column-appropriate filter:
         · text columns        → "contains" input (email, source)
         · categorical columns → checkbox list (gender, eligibility, status)
         · date / numeric      → sort only, no filter in v1

   Top-right corner of the card has a small strip with the visible / total
   row count, a "clear" link when any filter is active, and the CSV
   download button. No left-side filter chip toolbar — all filter UI is
   contextual to the column.

   All filtering + sorting happens client-side over the rows the server
   already fetched (currently capped at 100). Push to URL search params if
   the dataset grows past a few thousand rows.
   ========================================================================== */

import * as React from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn, formatInt } from "@/lib/utils";

/* ── Row shape ─────────────────────────────────────────────────────────── */
export type LeadRow = {
  lead_id: string;
  created_at: string;
  email: string;
  gender: "women" | "men";
  eligibility: "eligible" | "borderline" | "low-bmi";
  bmi: number | null;
  booking_confirmed_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
};

type ColumnKey =
  | "created_at"
  | "email"
  | "gender"
  | "eligibility"
  | "bmi"
  | "status"
  | "source";

type SortDir = "asc" | "desc";

type Filters = {
  email_contains: string;
  source_contains: string;
  genders: Set<LeadRow["gender"]>;
  eligibilities: Set<LeadRow["eligibility"]>;
  statuses: Set<"booked" | "lead">;
};

const EMPTY_FILTERS: Filters = {
  email_contains: "",
  source_contains: "",
  genders: new Set(),
  eligibilities: new Set(),
  statuses: new Set(),
};

const ELIGIBILITY_VARIANT: Record<LeadRow["eligibility"], BadgeVariant> = {
  eligible:   "eligible",
  borderline: "borderline",
  "low-bmi":  "low-bmi",
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function statusOf(r: LeadRow): "booked" | "lead" {
  return r.booking_confirmed_at !== null ? "booked" : "lead";
}

function sortValue(r: LeadRow, key: ColumnKey): string | number {
  switch (key) {
    case "created_at":  return r.created_at;
    case "email":       return r.email.toLowerCase();
    case "gender":      return r.gender;
    case "eligibility": return r.eligibility;
    case "bmi":         return r.bmi ?? -Infinity;
    case "status":      return statusOf(r);
    case "source":      return (r.utm_source ?? "(direct)").toLowerCase();
  }
}

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/* ── Per-column ascending / descending sort labels ──────────────────── */
function sortLabels(key: ColumnKey): { asc: string; desc: string } {
  switch (key) {
    case "created_at":  return { asc: "oldest first",    desc: "newest first" };
    case "bmi":         return { asc: "low → high",      desc: "high → low" };
    case "email":
    case "gender":
    case "eligibility":
    case "status":
    case "source":
    default:            return { asc: "A → Z",           desc: "Z → A" };
  }
}

/* ── Check if a column has an active filter ──────────────────────────── */
function isColumnFiltered(key: ColumnKey, f: Filters): boolean {
  switch (key) {
    case "email":       return f.email_contains.trim() !== "";
    case "source":      return f.source_contains.trim() !== "";
    case "gender":      return f.genders.size > 0;
    case "eligibility": return f.eligibilities.size > 0;
    case "status":      return f.statuses.size > 0;
    default:            return false;
  }
}

/* ── Main component ──────────────────────────────────────────────────── */

export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  const [sortKey, setSortKey] = React.useState<ColumnKey>("created_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [openColumn, setOpenColumn] = React.useState<ColumnKey | null>(null);

  /* ── Visible rows = filtered → sorted ─────────────────────────────── */
  const visible = React.useMemo(() => {
    let out = rows;

    if (filters.email_contains.trim()) {
      const q = filters.email_contains.trim().toLowerCase();
      out = out.filter((r) => r.email.toLowerCase().includes(q));
    }
    if (filters.source_contains.trim()) {
      const q = filters.source_contains.trim().toLowerCase();
      out = out.filter((r) => {
        const s = r.utm_source ?? "(direct)";
        const m = r.utm_medium ?? "";
        return s.toLowerCase().includes(q) || m.toLowerCase().includes(q);
      });
    }
    if (filters.genders.size) out = out.filter((r) => filters.genders.has(r.gender));
    if (filters.eligibilities.size) out = out.filter((r) => filters.eligibilities.has(r.eligibility));
    if (filters.statuses.size) out = out.filter((r) => filters.statuses.has(statusOf(r)));

    return [...out].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, filters, sortKey, sortDir]);

  const anyFilterActive =
    filters.email_contains.trim() !== "" ||
    filters.source_contains.trim() !== "" ||
    filters.genders.size > 0 ||
    filters.eligibilities.size > 0 ||
    filters.statuses.size > 0;

  const clearAll = () => setFilters(EMPTY_FILTERS);

  /* ── Sort handler: setting from inside a popover also closes it ───── */
  const applySort = (key: ColumnKey, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setOpenColumn(null);
  };

  /* ── CSV export of currently visible rows ─────────────────────────── */
  const downloadCsv = () => {
    const headers = [
      "created_at_iso",
      "created_at_utc",
      "email",
      "gender",
      "eligibility",
      "bmi",
      "status",
      "booking_confirmed_at_iso",
      "utm_source",
      "utm_medium",
      "lead_id",
    ];
    const lines = [
      headers.join(","),
      ...visible.map((r) =>
        [
          r.created_at,
          fmtDate(r.created_at),
          r.email,
          r.gender,
          r.eligibility,
          r.bmi ?? "",
          statusOf(r),
          r.booking_confirmed_at ?? "",
          r.utm_source ?? "",
          r.utm_medium ?? "",
          r.lead_id,
        ].map(csvCell).join(","),
      ),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `helvi-leads-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* === Strip: row count + clear + CSV === */}
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-b border-border">
        <span className="num text-[12px] text-muted-foreground">
          {formatInt(visible.length)} / {formatInt(rows.length)}
        </span>
        {anyFilterActive && (
          <button
            onClick={clearAll}
            className="h-8 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Clear filters
          </button>
        )}
        <button
          onClick={downloadCsv}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-foreground hover:bg-secondary"
        >
          <Download size={15} strokeWidth={1.75} aria-hidden />
          <span>CSV</span>
        </button>
      </div>

      {/* === Table === */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-border">
              <ColumnHeader
                k="created_at" label="Created"
                sortKey={sortKey} sortDir={sortDir}
                filtered={isColumnFiltered("created_at", filters)}
                isOpen={openColumn === "created_at"}
                onOpenToggle={() => setOpenColumn((o) => (o === "created_at" ? null : "created_at"))}
                onClose={() => setOpenColumn(null)}
              >
                <SortPanel k="created_at" sortKey={sortKey} sortDir={sortDir} applySort={applySort} />
              </ColumnHeader>

              <ColumnHeader
                k="email" label="Email"
                sortKey={sortKey} sortDir={sortDir}
                filtered={isColumnFiltered("email", filters)}
                isOpen={openColumn === "email"}
                onOpenToggle={() => setOpenColumn((o) => (o === "email" ? null : "email"))}
                onClose={() => setOpenColumn(null)}
              >
                <SortPanel k="email" sortKey={sortKey} sortDir={sortDir} applySort={applySort} />
                <TextFilterPanel
                  label="contains"
                  value={filters.email_contains}
                  onChange={(v) => setFilters((f) => ({ ...f, email_contains: v }))}
                />
              </ColumnHeader>

              <ColumnHeader
                k="gender" label="Gender"
                sortKey={sortKey} sortDir={sortDir}
                filtered={isColumnFiltered("gender", filters)}
                isOpen={openColumn === "gender"}
                onOpenToggle={() => setOpenColumn((o) => (o === "gender" ? null : "gender"))}
                onClose={() => setOpenColumn(null)}
              >
                <SortPanel k="gender" sortKey={sortKey} sortDir={sortDir} applySort={applySort} />
                <CheckboxFilterPanel
                  options={["women", "men"]}
                  selected={filters.genders}
                  onToggle={(v) =>
                    setFilters((f) => ({ ...f, genders: toggleSetValue(f.genders, v) }))
                  }
                />
              </ColumnHeader>

              <ColumnHeader
                k="eligibility" label="Eligibility"
                sortKey={sortKey} sortDir={sortDir}
                filtered={isColumnFiltered("eligibility", filters)}
                isOpen={openColumn === "eligibility"}
                onOpenToggle={() => setOpenColumn((o) => (o === "eligibility" ? null : "eligibility"))}
                onClose={() => setOpenColumn(null)}
              >
                <SortPanel k="eligibility" sortKey={sortKey} sortDir={sortDir} applySort={applySort} />
                <CheckboxFilterPanel
                  options={["eligible", "borderline", "low-bmi"]}
                  selected={filters.eligibilities}
                  onToggle={(v) =>
                    setFilters((f) => ({ ...f, eligibilities: toggleSetValue(f.eligibilities, v) }))
                  }
                />
              </ColumnHeader>

              <ColumnHeader
                k="bmi" label="BMI" align="right"
                sortKey={sortKey} sortDir={sortDir}
                filtered={isColumnFiltered("bmi", filters)}
                isOpen={openColumn === "bmi"}
                onOpenToggle={() => setOpenColumn((o) => (o === "bmi" ? null : "bmi"))}
                onClose={() => setOpenColumn(null)}
              >
                <SortPanel k="bmi" sortKey={sortKey} sortDir={sortDir} applySort={applySort} />
              </ColumnHeader>

              <ColumnHeader
                k="status" label="Status"
                sortKey={sortKey} sortDir={sortDir}
                filtered={isColumnFiltered("status", filters)}
                isOpen={openColumn === "status"}
                onOpenToggle={() => setOpenColumn((o) => (o === "status" ? null : "status"))}
                onClose={() => setOpenColumn(null)}
              >
                <SortPanel k="status" sortKey={sortKey} sortDir={sortDir} applySort={applySort} />
                <CheckboxFilterPanel
                  options={["booked", "lead"]}
                  selected={filters.statuses}
                  onToggle={(v) =>
                    setFilters((f) => ({ ...f, statuses: toggleSetValue(f.statuses, v) }))
                  }
                />
              </ColumnHeader>

              <ColumnHeader
                k="source" label="Source"
                sortKey={sortKey} sortDir={sortDir}
                filtered={isColumnFiltered("source", filters)}
                isOpen={openColumn === "source"}
                onOpenToggle={() => setOpenColumn((o) => (o === "source" ? null : "source"))}
                onClose={() => setOpenColumn(null)}
              >
                <SortPanel k="source" sortKey={sortKey} sortDir={sortDir} applySort={applySort} />
                <TextFilterPanel
                  label="contains"
                  value={filters.source_contains}
                  onChange={(v) => setFilters((f) => ({ ...f, source_contains: v }))}
                />
              </ColumnHeader>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "No leads yet." : "No leads match the current filters."}
                </td>
              </tr>
            )}
            {visible.map((r) => (
              <tr key={r.lead_id} className="border-b border-border last:border-0 hover:bg-muted/45">
                <td className="px-5 py-3 num text-[13px] text-muted-foreground">{fmtDate(r.created_at)}</td>
                <td className="px-5 py-3 font-medium">{r.email}</td>
                <td className="px-5 py-3 text-[13px] lowercase">{r.gender}</td>
                <td className="px-5 py-3">
                  <Badge variant={ELIGIBILITY_VARIANT[r.eligibility] ?? "neutral"}>{r.eligibility}</Badge>
                </td>
                <td className="px-5 py-3 text-right num">
                  {r.bmi !== null ? r.bmi.toFixed(1) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-5 py-3">
                  {statusOf(r) === "booked" ? (
                    <Badge variant="booked">booked</Badge>
                  ) : (
                    <Badge variant="pending">lead</Badge>
                  )}
                </td>
                <td className="px-5 py-3 text-[13px] text-muted-foreground">
                  {r.utm_source ?? "(direct)"}
                  {r.utm_medium ? ` / ${r.utm_medium}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── ColumnHeader ──────────────────────────────────────────────────────
   Renders one <th>. The header text is the dropdown trigger. Children
   render inside the popover when open. The popover is portalled into
   document.body and positioned with position:fixed off the trigger's
   bounding rect, so it can escape every overflow:auto / overflow:hidden
   ancestor (the table's overflow-x-auto wrapper and the Card).
   ──────────────────────────────────────────────────────────────────── */

function ColumnHeader({
  k,
  label,
  sortKey,
  sortDir,
  filtered,
  isOpen,
  onOpenToggle,
  onClose,
  align,
  children,
}: {
  k: ColumnKey;
  label: string;
  sortKey: ColumnKey;
  sortDir: SortDir;
  filtered: boolean;
  isOpen: boolean;
  onOpenToggle: () => void;
  onClose: () => void;
  align?: "right";
  children: React.ReactNode;
}) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left?: number; right?: number } | null>(null);
  const isSorted = sortKey === k;

  /* ── Position the portalled popover off the trigger's rect.
        Recomputed on open, scroll, and resize so it stays anchored. ── */
  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    const compute = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.bottom + 4;
      if (align === "right") {
        setPos({ top, right: Math.max(0, window.innerWidth - rect.right) });
      } else {
        setPos({ top, left: rect.left });
      }
    };
    compute();
    // capture=true so we catch scrolls inside any ancestor scroll container too
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [isOpen, align]);

  /* ── Outside click + Escape close. Because the popover is portalled
        out of the <th>, we have to whitelist both the trigger and the
        popover when deciding what counts as "outside". ─────────────── */
  React.useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  return (
    <th
      className={cn(
        "px-5 py-2.5 text-[12px] font-medium",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={onOpenToggle}
        className={cn(
          "inline-flex items-center gap-1.5 select-none transition-colors",
          isSorted || filtered ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span>{label}</span>
        {/* Sort indicator (arrow if sorted on this column, dim chevron otherwise) */}
        <span className={cn(isSorted ? "text-foreground" : "opacity-40")}>
          {isSorted ? (sortDir === "asc" ? "↑" : "↓") : "▾"}
        </span>
        {/* Filter dot — small filled circle when this column has a filter */}
        {filtered && <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-accent" />}
      </button>

      {isOpen && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              right: pos.right,
            }}
            className={cn(
              "z-50 min-w-[200px] bg-card border border-border rounded-md shadow-lg p-2",
              "text-foreground normal-case tracking-normal text-left",
            )}
          >
            {children}
          </div>,
          document.body,
        )}
    </th>
  );
}

/* ── SortPanel — the always-on top section of every popover ────────── */
function SortPanel({
  k,
  sortKey,
  sortDir,
  applySort,
}: {
  k: ColumnKey;
  sortKey: ColumnKey;
  sortDir: SortDir;
  applySort: (k: ColumnKey, dir: SortDir) => void;
}) {
  const labels = sortLabels(k);
  const active = sortKey === k;
  return (
    <div className="space-y-0.5 pb-2 mb-2 border-b border-border">
      <PopoverButton
        active={active && sortDir === "asc"}
        onClick={() => applySort(k, "asc")}
      >
        <span className="opacity-60">↑</span>
        <span>{labels.asc}</span>
      </PopoverButton>
      <PopoverButton
        active={active && sortDir === "desc"}
        onClick={() => applySort(k, "desc")}
      >
        <span className="opacity-60">↓</span>
        <span>{labels.desc}</span>
      </PopoverButton>
    </div>
  );
}

/* ── TextFilterPanel — for email + source ────────────────────────── */
function TextFilterPanel({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[12px] font-medium text-muted-foreground">
        {label}
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/* ── CheckboxFilterPanel — for categorical columns ─────────────────── */
function CheckboxFilterPanel<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: ReadonlyArray<T>;
  selected: Set<T>;
  onToggle: (v: T) => void;
}) {
  return (
    <div className="space-y-1">
      {options.map((opt) => {
        const checked = selected.has(opt);
        return (
          <label
            key={opt}
            className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-pointer"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(opt)}
              className="h-3.5 w-3.5 accent-foreground cursor-pointer"
            />
            <span className="text-[13px]">{opt}</span>
          </label>
        );
      })}
      {selected.size > 0 && (
        <button
          onClick={() => {
            // Clear all by toggling each selected back off. Caller's setter
            // is keyed off each toggle, so this stays consistent.
            selected.forEach((v) => onToggle(v));
          }}
          className="text-[12px] font-medium text-muted-foreground hover:text-foreground mt-1 ml-1.5"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/* ── PopoverButton — shared row style for sort + filter rows ──────── */
function PopoverButton({
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
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-1.5 py-1 rounded text-[13px] hover:bg-muted",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ── Immutable Set toggle — returns a NEW Set so React sees a state change ── */
function toggleSetValue<T>(prev: Set<T>, value: T): Set<T> {
  const next = new Set(prev);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
