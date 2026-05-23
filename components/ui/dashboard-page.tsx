/* ============================================================================
   ui/dashboard-page.tsx — shared page header for dashboard routes.

   The global top bar only carries the Helvi wordmark. Each dashboard owns its
   own H1 and lightweight controls inside the content canvas.
   ========================================================================== */

import * as React from "react";
import { DashboardCustomizeButton, DashboardDateRangeButton } from "@/components/ui/dashboard-actions";
import { cn } from "@/lib/utils";
import type { DashboardDateRange } from "@/lib/date-range";

export function DashboardPage({
  title,
  dateRange,
  customize,
  children,
  className,
}: {
  title: string;
  dateRange?: DashboardDateRange;
  customize?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 lg:gap-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[26px] leading-tight font-semibold tracking-normal text-foreground">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {dateRange && <DashboardDateRangeButton range={dateRange} />}
          <DashboardCustomizeButton>{customize}</DashboardCustomizeButton>
        </div>
      </div>
      {children}
    </div>
  );
}
