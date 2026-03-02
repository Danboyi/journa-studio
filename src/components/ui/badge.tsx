import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--sand-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-700)]",
        className,
      )}
      {...props}
    />
  );
}
