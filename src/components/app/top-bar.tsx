"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@/context/session-context";

const labels: Record<string, string> = {
  "/journal": "Today",
  "/reflect": "Reflect",
  "/memory": "Memory",
  "/library": "Library",
  "/settings": "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const { user } = useSession();
  const label = labels[pathname] ?? "Journa";

  const initial = user.email?.[0]?.toUpperCase() ?? "J";

  return (
    <header className="top-bar">
      <span className="font-display text-base font-semibold tracking-tight text-[var(--ink-950)]">
        journa
      </span>
      <span className="text-sm font-medium text-[var(--ink-500)]">{label}</span>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink-950)] text-xs font-bold text-white"
        title={user.email}
      >
        {initial}
      </div>
    </header>
  );
}
