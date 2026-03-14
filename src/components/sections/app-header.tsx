import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  userEmail?: string;
  onSignOut: () => void;
};

export function AppHeader({ userEmail, onSignOut }: AppHeaderProps) {
  return (
    <div className="rounded-3xl border border-[var(--ink-200)] bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Journa</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink-950)] sm:text-3xl">Your private reflection space</h1>
          <p className="mt-1 text-sm text-[var(--ink-700)]">Write, reflect, and revisit what matters without the landing-page noise.</p>
        </div>
        <div className="flex items-center gap-2">
          {userEmail ? <span className="hidden rounded-full bg-[var(--sand-50)] px-3 py-1 text-xs text-[var(--ink-700)] sm:inline-flex">{userEmail}</span> : null}
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
