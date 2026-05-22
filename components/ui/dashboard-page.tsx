/* ============================================================================
   ui/dashboard-page.tsx — shared page header for dashboard routes.

   The global top bar only carries the Helvi wordmark. Each dashboard owns its
   own H1 and lightweight controls inside the content canvas.
   ========================================================================== */

import * as React from "react";
import { CalendarDays, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardPage({
  title,
  period,
  children,
  className,
}: {
  title: string;
  period?: string;
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
          {period && (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-card px-2.5 text-[13px] font-medium text-foreground shadow-card hover:bg-secondary"
            >
              <CalendarDays size={15} strokeWidth={1.75} aria-hidden />
              <span>{period}</span>
            </button>
          )}
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-card px-2.5 text-[13px] font-medium text-foreground shadow-card hover:bg-secondary"
          >
            <SlidersHorizontal size={15} strokeWidth={1.75} aria-hidden />
            <span>Customize</span>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
