"use client";

/* ============================================================================
   dashboard-slice-controls.tsx — URL-backed slice controls for toolbar popovers.
   ========================================================================== */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function SingleParamControl({
  label,
  param,
  value,
  options,
}: {
  label: string;
  param: string;
  value: string;
  options: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setValue = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === options[0]?.value) params.delete(param);
    else params.set(param, next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div>
      <div className="mb-2 text-[12px] font-medium text-muted-foreground">{label}</div>
      <div className="grid gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setValue(option.value)}
            className={cn(
              "h-8 rounded-md px-2 text-left text-[13px] font-medium hover:bg-secondary",
              value === option.value ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MultiParamControl({
  label,
  param,
  selected,
  options,
}: {
  label: string;
  param: string;
  selected: string[];
  options: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length === 0) params.delete(param);
    else params.set(param, next.join(","));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div>
      <div className="mb-2 text-[12px] font-medium text-muted-foreground">{label}</div>
      <div className="grid gap-1">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.value)}
              className={cn(
                "h-8 rounded-md px-2 text-left text-[13px] font-medium hover:bg-secondary",
                active ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
