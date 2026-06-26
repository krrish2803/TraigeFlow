"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/inbox", label: "Inbox", icon: "⊞" },
  { href: "/clusters", label: "Clusters", icon: "⟐" },
  { href: "/drafts", label: "Drafts", icon: "⊟" },
  { href: "/releases", label: "Releases", icon: "↑" },
];

const BOTTOM_ITEMS = [
  { href: "/settings", label: "Settings", icon: "⚙" },
  { href: "#", label: "Help", icon: "?" },
];

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col bg-surface border-r border-border"
      animate={{ width: isExpanded ? 220 : 64 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex items-center justify-center h-16 border-b border-border shrink-0">
        <span className="text-primary font-display font-bold text-xl tracking-tight">
          {isExpanded ? "Signal2Fix" : "S2"}
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative ${
                  isActive
                    ? "bg-elevated text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-elevated/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="text-lg w-5 text-center shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4 flex flex-col gap-1">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = item.href !== "#" && pathname.startsWith(item.href);
          return (
            <Link key={item.label} href={item.href}>
              <motion.div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "bg-elevated text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-elevated/50"
                }`}
              >
                <span className="text-lg w-5 text-center shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.aside>
  );
}
