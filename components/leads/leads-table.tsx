"use client";

/* ============================================================================
   leads/leads-table.tsx — interactive leads table.

   Inputs: the full set of leads from the server component.
   Owns: search text, per-column filter chips (eligibility / gender / status),
         sort key + direction, CSV export of the currently-visible rows.

   All filtering happens client-side over the rows the server already
   fetched. With a 100-row cap on the source query, that's a few KB of
   payload — well under any meaningful threshold. If the dataset grows
   past a few thousand rows, push filters back to the server via search
   params and refactor.
   ========================================================================== */

import * as React from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn, formatInt } from "@/lib/utils";

/* ── Row shape ── repeats the server-side type so this file is import-
   independent from the queries layer. */
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

type SortKey = "created_at" | "email" | "gender" | "eligibility" | "bmi" | "status" | "source";
type SortDir = "asc" | "desc";

const ELIGIBILITY_VARIANT: Record<LeadRow["eligibility"], BadgeVariant> = {
  eligible:   "eligible",
  borderline: "borderline",
  "low-bmi":  "low-bmi",
};

/* ── ISO-style date formatter — same shape as the previous server-side
   formatter so the user-facing column doesn't change. */
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/* ── status derivation ──── booked iff Cal.com confirmation timestamp set. */
function statusOf(r: LeadRow): "booked" | "lead" {
  return r.booking_confirmed_at !== null ? "booked" : "lead";
}

/* ── Per-key sort value extractor ──────────────────────────────────────── */
function sortValue(r: LeadRow, key: SortKey): string | number {
  switch (key) {
    case "created_at":   return r.created_at;                  // ISO string sorts lex == chrono
    case "email":        return r.email.toLowerCase();
    case "gender":       return r.gender;
    case "eligibility":  return r.eligibility;
    case "bmi":          return r.bmi ?? -Infinity;            // unknown BMI sorts last on asc
    case "status":       return statusOf(r);
    case "source":       return (r.utm_source ?? "(direct)").toLowerCase();
  }
}

/* ── CSV escaping ── RFC 4180 minimum: quote if it contains ',' / '"' / '\n',
   double up any existing '"' inside the value. */
function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  /* ── Filter + sort state ────────────────────────────────────────────── */
  const [search, setSearch] = React.useState("");
  const [eligibilityFilter, setEligibilityFilter] = React.useState<Set<LeadRow["eligibility"]>>(new Set());
  const [genderFilter, setGenderFilter]           = React.useState<Set<LeadRow["gender"]>>(new Set());
  const [statusFilter, setStatusFilter]           = React.useState<Set<"booked" | "lead">>(new Set());
  const [sortKey, setSortKey] = React.useState<SortKey>("created_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  /* ── Visible rows = rows passed through every active filter, then sorted. */
  const visible = React.useMemo(() => {
    let out = rows;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((r) =>
        r.email.toLowerCase().includes(q) ||
        (r.utm_source ?? "").toLowerCase().includes(q) ||
        (r.utm_medium ?? "").toLowerCase().includes(q),
      );
    }
    if (eligibilityFilter.size) out = out.filter((r) => eligibilityFilter.has(r.eligibility));
    if (genderFilter.size)      out = out.filter((r) => genderFilter.has(r.gender));
    if (statusFilter.size)      out = out.filter((r) => statusFilter.has(statusOf(r)));

    return [...out].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, search, eligibilityFilter, genderFilter, statusFilter, sortKey, sortDir]);

  /* ── Header click toggles direction if same key, else switches key. */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" || key === "bmi" ? "desc" : "asc");
    }
  };

  /* ── CSV export of the *currently visible* set ─────────────────────── */
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

  const anyFilterActive =
    search.trim() !== "" ||
    eligibilityFilter.size > 0 ||
    genderFilter.size > 0 ||
    statusFilter.size > 0;

  const clearAll = () => {
    setSearch("");
    setEligibilityFilter(new Set());
    setGenderFilter(new Set());
    setStatusFilter(new Set());
  };

  return (
    <>
      {/* === Toolbar === */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search email / source"
          className="font-mono text-xs px-2.5 py-1.5 border border-border rounded-md bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground min-w-[180px]"
        />

        <FilterGroup label="elig">
          {(["eligible", "borderline", "low-bmi"] as const).map((v) => (
            <Chip
              key={v}
              label={v}
              active={eligibilityFilter.has(v)}
              onClick={() => toggleSet(setEligibilityFilter, v)}
            />
          ))}
        </FilterGroup>

        <FilterGroup label="gender">
          {(["women", "men"] as const).map((v) => (
            <Chip
              key={v}
              label={v}
              active={genderFilter.has(v)}
              onClick={() => toggleSet(setGenderFilter, v)}
            />
          ))}
        </FilterGroup>

        <FilterGroup label="status">
          {(["booked", "lead"] as const).map((v) => (
            <Chip
              key={v}
              label={v}
              active={statusFilter.has(v)}
              onClick={() => toggleSet(setStatusFilter, v)}
            />
          ))}
        </FilterGroup>

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {formatInt(visible.length)} / {formatInt(rows.length)}
          </span>
          {anyFilterActive && (
            <button
              onClick={clearAll}
              className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              clear
            </button>
          )}
          <button
            onClick={downloadCsv}
            className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1.5 border border-border rounded-md bg-card hover:bg-muted text-foreground"
          >
            ↓ csv
          </button>
        </div>
      </div>

      {/* === Table === */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left border-b border-border">
              <Th k="created_at"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>created_at</Th>
              <Th k="email"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>email</Th>
              <Th k="gender"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>gender</Th>
              <Th k="eligibility" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>eligibility</Th>
              <Th k="bmi"         sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="right">bmi</Th>
              <Th k="status"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>status</Th>
              <Th k="source"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>source</Th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-xs text-muted-foreground">
                  {rows.length === 0 ? "No leads yet." : "No leads match the current filters."}
                </td>
              </tr>
            )}
            {visible.map((r) => (
              <tr key={r.lead_id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-2">{r.email}</td>
                <td className="px-4 py-2 font-mono text-xs lowercase">{r.gender}</td>
                <td className="px-4 py-2">
                  <Badge variant={ELIGIBILITY_VARIANT[r.eligibility] ?? "neutral"}>{r.eligibility}</Badge>
                </td>
                <td className="px-4 py-2 text-right metric">
                  {r.bmi !== null ? r.bmi.toFixed(1) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-2">
                  {statusOf(r) === "booked" ? (
                    <Badge variant="booked">booked</Badge>
                  ) : (
                    <Badge variant="pending">lead</Badge>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
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

/* ── Small helpers ─────────────────────────────────────────────────────── */

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "font-mono text-[11px] px-2 py-0.5 rounded-md border transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Th<K extends SortKey>({
  k,
  sortKey,
  sortDir,
  onSort,
  align,
  children,
}: {
  k: K;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "right";
  children: React.ReactNode;
}) {
  const active = sortKey === k;
  return (
    <th
      className={cn(
        "px-4 py-2 font-mono text-[11px] uppercase tracking-wider font-medium",
        align === "right" ? "text-right" : "",
      )}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 select-none transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span>{children}</span>
        <span className={cn("text-foreground", !active && "opacity-30")}>
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

/* ── Set toggle helper used by every filter chip ──────────────────────── */
function toggleSet<T>(setState: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) {
  setState((prev) => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  });
}
