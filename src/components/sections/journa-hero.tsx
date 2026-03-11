import { LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type JournaHeroProps = {
  isAuthenticated: boolean;
  userEmail?: string;
  onSignOut: () => void;
};

export function JournaHero({ isAuthenticated, userEmail, onSignOut }: JournaHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-white/50 bg-[radial-gradient(circle_at_top_left,_#cffafe_0,_#f8fafc_50%,_#fef3c7_100%)] p-6 sm:p-10">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--brand-300)]/45 blur-3xl" />
      <Badge>Private memory studio</Badge>
      <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-[var(--ink-950)] sm:text-5xl">
        A private journal that helps you understand your life as you live it.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-[var(--ink-700)] sm:text-lg">
        Journa helps you capture what happened, reflect on what it meant, and notice what keeps returning over time. It is built for memory, clarity, and honest writing — not content churn.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-[var(--ink-700)] sm:text-sm">
        <span className="rounded-full bg-white/70 px-3 py-1">Private by default</span>
        <span className="rounded-full bg-white/70 px-3 py-1">Reflection before rewriting</span>
        <span className="rounded-full bg-white/70 px-3 py-1">Patterns over time</span>
      </div>
      {isAuthenticated ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="ghost" onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> {userEmail}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
