/* ============================================================================
   ui/card.tsx — Shopify-style card primitive.

   Pure white surface with a soft 1px shadow (no hard border). Rounded
   corners (8–10px). Generous internal padding. The header row holds a
   small label and an optional trailing action slot (e.g. an "explore"
   icon button). Description, if present, sits beneath the label.

   No "uppercase mono" anything anymore — that was the ops-console
   aesthetic the previous pass favoured. This pass mirrors Shopify's
   commerce dashboard where every card answers one question in plain
   noun-phrase English.
   ========================================================================== */

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[10px] bg-card text-card-foreground shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-5 pt-5 pb-3",
        className,
      )}
      {...props}
    />
  );
}

/** A "noun phrase" card label, sentence-case, with a dotted underline that
 *  signals tool-tippable definitions (we don't ship tooltips yet, but the
 *  affordance is the visual hint). */
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[13px] font-medium text-muted-foreground tooltip-label",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted-foreground mt-0.5", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

/** Slot for the period footer at the bottom of charts ("— Current  ⋯ Prev"). */
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 pb-4 pt-2 flex items-center gap-3 text-[11px] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function ExploreButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Explore ${label}`}
      title={`Explore ${label}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <Search size={15} strokeWidth={1.75} aria-hidden />
    </button>
  );
}

export function PeriodFooter({
  current,
  comparison,
  className,
}: {
  current: string;
  comparison?: string;
  className?: string;
}) {
  return (
    <CardFooter className={className}>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-px w-5 bg-accent" aria-hidden />
        <span>{current}</span>
      </span>
      {comparison && (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-px w-5 border-t border-dotted border-accent-muted"
            aria-hidden
          />
          <span>{comparison}</span>
        </span>
      )}
    </CardFooter>
  );
}
