/* ============================================================================
   date-range.ts — shared URL date-range helpers.

   Ranges use inclusive `from` and exclusive `to` YYYY-MM-DD boundaries,
   matching the Supabase .gte/.lt query pattern used throughout the dashboard.
   ========================================================================== */

export type DashboardDateRange = {
  from: string;
  to: string;
  label: string;
  days: number;
  allTime: boolean;
};

const ALL_TIME_FROM = "2020-01-01";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultDateRange(days = 30): DashboardDateRange {
  const toDate = startOfUtcDay(addDays(new Date(), 1));
  const fromDate = addDays(toDate, -days);
  return {
    from: dayKey(fromDate),
    to: dayKey(toDate),
    label: `Last ${days} days`,
    days,
    allTime: false,
  };
}

export function allTimeRange(): DashboardDateRange {
  const toDate = startOfUtcDay(addDays(new Date(), 1));
  return {
    from: ALL_TIME_FROM,
    to: dayKey(toDate),
    label: "All time",
    days: daysBetween(ALL_TIME_FROM, dayKey(toDate)),
    allTime: true,
  };
}

export function daysBetween(from: string, to: string): number {
  const fromTime = Date.parse(`${from}T00:00:00.000Z`);
  const toTime = Date.parse(`${to}T00:00:00.000Z`);
  if (Number.isNaN(fromTime) || Number.isNaN(toTime) || toTime <= fromTime) {
    return 1;
  }
  return Math.max(1, Math.round((toTime - fromTime) / 86_400_000));
}

export function parseDateRangeParams(
  sp: Record<string, string | string[] | undefined>,
  fallbackDays = 30,
): DashboardDateRange {
  const range = typeof sp.range === "string" ? sp.range : undefined;
  if (range === "all") return allTimeRange();

  const fallback = defaultDateRange(fallbackDays);
  const from = typeof sp.from === "string" ? sp.from : fallback.from;
  const to = typeof sp.to === "string" ? sp.to : fallback.to;
  const days = daysBetween(from, to);

  const preset = [7, 30, 90].find((d) => d === days);
  return {
    from,
    to,
    days,
    label: preset ? `Last ${preset} days` : `${from} to ${to}`,
    allTime: false,
  };
}
