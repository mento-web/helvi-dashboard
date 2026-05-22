/* ============================================================================
   ui/badge.tsx — Shopify-style status pill.

   Soft tinted background + dark text. Three semantic eligibility variants
   keyed to the leads.eligibility CHECK constraint, plus booked/lead for
   the funnel status.
   ========================================================================== */

import * as React from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  eligible:   "bg-tint-moss text-foreground",
  borderline: "bg-tint-peach text-foreground",
  "low-bmi":  "bg-tint-dusty-pink text-foreground",
  booked:     "bg-accent/10 text-accent",
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
