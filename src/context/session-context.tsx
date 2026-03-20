"use client";

import { createContext, useContext } from "react";

export type SessionUser = {
  id: string;
  email?: string;
};

export type SessionContextValue = {
  user: SessionUser;
  signOut: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
