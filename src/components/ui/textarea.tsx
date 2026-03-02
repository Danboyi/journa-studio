import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[140px] w-full rounded-2xl border border-[var(--ink-300)] bg-white/90 px-4 py-3 text-sm text-[var(--ink-900)] shadow-sm outline-none transition placeholder:text-[var(--ink-500)] focus:border-[var(--brand-700)] focus:ring-2 focus:ring-[var(--brand-300)]",
        className,
      )}
      {...props}
    />
  );
}
