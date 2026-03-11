import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AuthMode = "sign-in" | "sign-up";

type AuthCardProps = {
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

export function AuthCard({
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
}: AuthCardProps) {
  return (
    <Card className="mt-8 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--ink-900)]">Secure Account Access</h2>
        <div className="flex gap-2">
          <Button size="sm" variant={authMode === "sign-in" ? "default" : "secondary"} onClick={() => setAuthMode("sign-in")}>
            Sign in
          </Button>
          <Button size="sm" variant={authMode === "sign-up" ? "default" : "secondary"} onClick={() => setAuthMode("sign-up")}>
            Sign up
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          className="h-11 rounded-xl border border-[var(--ink-300)] bg-white/90 px-4 text-sm"
          placeholder="Email"
          type="email"
          value={authEmail}
          onChange={(event) => setAuthEmail(event.target.value)}
        />
        <input
          className="h-11 rounded-xl border border-[var(--ink-300)] bg-white/90 px-4 text-sm"
          placeholder="Password"
          type="password"
          value={authPassword}
          onChange={(event) => setAuthPassword(event.target.value)}
        />
        {authMode === "sign-up" ? (
          <input
            className="h-11 rounded-xl border border-[var(--ink-300)] bg-white/90 px-4 text-sm sm:col-span-2"
            placeholder="Full name (optional)"
            value={authFullName}
            onChange={(event) => setAuthFullName(event.target.value)}
          />
        ) : null}
      </div>

      <Button className="mt-4" onClick={onSubmit} disabled={isAuthLoading}>
        {isAuthLoading ? "Please wait..." : authMode === "sign-in" ? "Sign in" : "Create account"}
      </Button>
      <p className="mt-2 text-xs text-[var(--ink-700)]">
        Auth uses secure HTTP-only cookies. For sign-up, confirm email if your Supabase project enforces verification.
      </p>
      <div className="mt-4 grid gap-2 text-xs text-[var(--ink-700)] sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--sand-50)] p-3">Your writing stays tied to your account, not a public feed.</div>
        <div className="rounded-2xl bg-[var(--sand-50)] p-3">Use Copilot to reflect and rewrite without flattening your voice.</div>
        <div className="rounded-2xl bg-[var(--sand-50)] p-3">Sharing is optional and explicit — private remains the default posture.</div>
      </div>
    </Card>
  );
}
