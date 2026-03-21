"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, Sparkles, Layers, Library, User } from "lucide-react";

const tabs = [
  { href: "/journal",  icon: PenLine,   label: "Write"   },
  { href: "/reflect",  icon: Sparkles,  label: "Reflect" },
  { href: "/memory",   icon: Layers,    label: "Gravity" },
  { href: "/library",  icon: Library,   label: "Library" },
  { href: "/settings", icon: User,      label: "You"     },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="dock-wrapper">
      <nav className="dock" role="navigation" aria-label="Main navigation">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`dock-item ${active ? "dock-item-active" : "dock-item-inactive"}`}
            >
              <Icon
                className="h-[19px] w-[19px]"
                strokeWidth={active ? 2.25 : 1.65}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
