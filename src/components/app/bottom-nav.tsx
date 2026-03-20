"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Sparkles, Brain, Library, Settings } from "lucide-react";

const tabs = [
  { href: "/journal", label: "Write", icon: BookOpen },
  { href: "/reflect", label: "Reflect", icon: Sparkles },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/library", label: "Library", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item ${active ? "bottom-nav-item-active" : "bottom-nav-item-inactive"}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={`h-5 w-5 transition-all duration-200 ${active ? "scale-110" : ""}`}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
