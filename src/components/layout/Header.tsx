"use client";

import { usePathname } from "next/navigation";
import HowItWorks from "@/components/ui/HowItWorks";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inbox": "Signal Inbox",
  "/clusters": "Signal Clusters",
  "/drafts": "Issue Drafts",
  "/releases": "Release Readiness",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "Signal2Fix";

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-surface">
      <h1 className="text-lg font-display font-semibold tracking-tight text-text-primary">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <HowItWorks />

        <button className="text-text-muted hover:text-text-secondary transition-colors text-sm px-3 py-1.5 rounded-md border border-border hover:bg-elevated/50">
          <kbd className="text-xs text-text-muted mr-2">⌘K</kbd>
          Search
        </button>

        <button className="relative text-text-secondary hover:text-text-primary transition-colors">
          <span className="text-lg">🔔</span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            acme-corp
          </span>
          <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
