"use client";

import { motion } from "framer-motion";
import type { AgentName } from "@/lib/constants";
import { AGENT_LABELS } from "@/lib/constants";

interface AgentStatusNodeProps {
  agent: AgentName;
  status: "running" | "idle" | "done";
  isActive?: boolean;
}

const STATUS_ICONS: Record<string, string> = {
  idle: "○",
  running: "◉",
  done: "✓",
};

export default function AgentStatusNode({ agent, status, isActive }: AgentStatusNodeProps) {
  const isRunning = status === "running" || isActive;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 relative ${
          status === "done"
            ? "bg-success/20 border-success text-success"
            : isRunning
            ? "bg-primary/20 border-primary text-primary"
            : "bg-elevated/50 border-border text-text-muted"
        }`}
        animate={
          isRunning
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(108,99,255,0.4)",
                  "0 0 0 8px rgba(108,99,255,0)",
                ],
              }
            : {}
        }
        transition={isRunning ? { duration: 2, repeat: Infinity } : {}}
      >
        {status === "done" ? (
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : (
          STATUS_ICONS[status]
        )}
      </motion.div>
      <span
        className={`text-[10px] font-medium uppercase tracking-wider ${
          isRunning ? "text-primary" : status === "done" ? "text-success" : "text-text-muted"
        }`}
      >
        {AGENT_LABELS[agent]}
      </span>
    </div>
  );
}
