/* ============================================================================
   ui/dashboard-page.tsx — shared page header for dashboard routes.

   The global top bar only carries the Helvi wordmark. Each dashboard owns its
   own H1 and lightweight controls inside the content canvas.
   ========================================================================== */

import * as React from "react";
import { DashboardToolbarButton } from "@/components/ui/dashboard-actions";
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
            <DashboardToolbarButton action="period" label={period} />
          )}
          <DashboardToolbarButton action="customize" label="Customize" />
        </div>
      </div>
      {children}
    </div>
  );
}
