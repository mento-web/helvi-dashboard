/* ============================================================================
   ui/badge.tsx — small status pill used on the Leads page.
   Three variants matching the leads.eligibility CHECK constraint.
   ========================================================================== */

import * as React from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  eligible:   "bg-tint-moss text-foreground",
  borderline: "bg-tint-peach text-foreground",
  "low-bmi":  "bg-tint-dusty-pink text-foreground",
  booked:     "bg-accent text-accent-foreground",
  pending:    "bg-muted text-muted-foreground",
  neutral:    "bg-muted text-foreground",
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
