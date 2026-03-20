"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { SessionContext, type SessionUser } from "@/context/session-context";
import { BottomNav } from "@/components/app/bottom-nav";
import { TopBar } from "@/components/app/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const didCheck = useRef(false);

  useEffect(() => {
    if (didCheck.current) return;
    didCheck.current = true;

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((payload: { user?: SessionUser }) => {
        if (payload.user) {
          setUser(payload.user);
        } else {
          router.replace("/");
        }
      })
      .catch(() => router.replace("/"))
      .finally(() => setIsChecking(false));
  }, [router]);

  const signOut = async () => {
    try { await fetch("/api/auth/sign-out", { method: "POST" }); } catch { /* ignore */ }
    router.replace("/");
  };

  if (isChecking) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink-300)] border-t-[var(--ink-950)]" />
          <p className="text-xs text-[var(--ink-500)]">Loading journa...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SessionContext.Provider value={{ user, signOut }}>
      <div className="app-shell">
        <TopBar />
        <main className="app-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={typeof window !== "undefined" ? window.location.pathname : ""}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
    </SessionContext.Provider>
  );
}
