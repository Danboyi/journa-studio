"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@/context/session-context";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
  }).format(new Date());
}

const routeMeta: Record<string, { title: string; showDate?: boolean }> = {
  "/journal":  { title: "Studio",  showDate: true  },
  "/reflect":  { title: "Reflect", showDate: false },
  "/memory":   { title: "Gravity", showDate: false },
  "/library":  { title: "Library", showDate: false },
  "/settings": { title: "You",     showDate: false },
};

export function TopBar() {
  const pathname  = usePathname();
  const { user }  = useSession();
  const meta      = routeMeta[pathname] ?? { title: "Journa" };
  const initial   = user.email?.[0]?.toUpperCase() ?? "J";
  const isHome    = pathname === "/journal";

  return (
    <header className="top-bar">
      {/* Left: wordmark */}
      <span className="font-display text-[15px] font-semibold tracking-tight text-[var(--ink-950)]">
        journa
      </span>

      {/* Centre: page context */}
      <div className="flex flex-col items-center">
        {isHome ? (
          <>
            <span className="text-xs font-semibold text-[var(--ink-700)]">
              {getGreeting()}
            </span>
            <span className="text-[10px] text-[var(--ink-400)] leading-none mt-0.5">
              {getFormattedDate()}
            </span>
          </>
        ) : (
          <span className="font-display text-sm font-semibold text-[var(--ink-800)]">
            {meta.title}
          </span>
        )}
      </div>

      {/* Right: avatar */}
      <button
        title={user.email}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink-950)] text-[11px] font-bold text-white ring-2 ring-white/60 transition-transform active:scale-90"
      >
        {initial}
      </button>
    </header>
  );
}
