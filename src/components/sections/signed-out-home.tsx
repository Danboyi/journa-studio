import { AuthCard } from "@/components/sections/auth-card";
import { JournaHero } from "@/components/sections/journa-hero";
import { Card } from "@/components/ui/card";

type AuthMode = "sign-in" | "sign-up";

type SignedOutHomeProps = {
  authMode: AuthMode;
  authEmail: string;
  authPassword: string;
  authFullName: string;
  isAuthLoading: boolean;
  setAuthMode: (mode: AuthMode) => void;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  setAuthFullName: (value: string) => void;
  onSubmit: () => void;
};

export function SignedOutHome(props: SignedOutHomeProps) {
  const {
    authMode,
    authEmail,
    authPassword,
    authFullName,
    isAuthLoading,
    setAuthMode,
    setAuthEmail,
    setAuthPassword,
    setAuthFullName,
    onSubmit,
  } = props;

  return (
    <>
      <JournaHero isAuthenticated={false} onSignOut={() => undefined} />

      <Card className="mt-8 p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-500)]">Start here</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--ink-950)]">A mobile-first private journaling experience</h2>
        <p className="mt-3 text-sm text-[var(--ink-700)]">
          Journa is built around a simple rhythm: capture the moment, reflect on what it means, and return later to see what patterns your life is forming.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[var(--sand-50)] p-4 text-sm text-[var(--ink-800)]">Onboarding helps Journa understand your voice and context.</div>
          <div className="rounded-2xl bg-[var(--sand-50)] p-4 text-sm text-[var(--ink-800)]">Reflection comes before rewriting, so the app feels thoughtful instead of generic.</div>
          <div className="rounded-2xl bg-[var(--sand-50)] p-4 text-sm text-[var(--ink-800)]">Memory, recap rituals, and retrieval help your writing compound over time.</div>
        </div>
      </Card>

      <AuthCard
        authMode={authMode}
        authEmail={authEmail}
        authPassword={authPassword}
        authFullName={authFullName}
        isAuthLoading={isAuthLoading}
        setAuthMode={setAuthMode}
        setAuthEmail={setAuthEmail}
        setAuthPassword={setAuthPassword}
        setAuthFullName={setAuthFullName}
        onSubmit={onSubmit}
      />
    </>
  );
}
