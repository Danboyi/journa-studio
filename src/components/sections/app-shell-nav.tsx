import { BookOpenText, Brain, Library, Settings, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppTab = "journal" | "reflect" | "memory" | "library" | "settings";

type AppShellNavProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const items: Array<{ key: AppTab; label: string; icon: typeof BookOpenText }> = [
  { key: "journal", label: "Journal", icon: BookOpenText },
  { key: "reflect", label: "Reflect", icon: Sparkles },
  { key: "memory", label: "Memory", icon: Brain },
  { key: "library", label: "Library", icon: Library },
  { key: "settings", label: "Settings", icon: Settings },
];

export function AppShellNav({ activeTab, onChange }: AppShellNavProps) {
  return (
    <div className="sticky bottom-3 z-40 mt-6 grid grid-cols-5 gap-2 rounded-3xl border border-[var(--ink-200)] bg-white/90 p-2 shadow-lg backdrop-blur sm:sticky sm:top-4 sm:bottom-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.key;
        return (
          <Button
            key={item.key}
            variant={active ? "default" : "ghost"}
            className="flex h-auto flex-col gap-1 rounded-2xl px-2 py-3 text-xs"
            onClick={() => onChange(item.key)}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
