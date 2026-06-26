"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SourcePill from "@/components/ui/SourcePill";
import SeverityBadge from "@/components/ui/SeverityBadge";
import type { SourceType } from "@/lib/constants";

interface FusionSignal {
  id: string;
  source: SourceType;
  text: string;
}

interface SignalFusionAnimationProps {
  signals: FusionSignal[];
  onComplete?: () => void;
  clusterTitle?: string;
  clusterSeverity?: "critical" | "high" | "medium" | "low";
}

export default function SignalFusionAnimation({
  signals,
  onComplete,
  clusterTitle = "Mobile OAuth Login Crash",
  clusterSeverity = "critical",
}: SignalFusionAnimationProps) {
  const [phase, setPhase] = useState<"scatter" | "converging" | "merged" | "done">("scatter");

  const triggerFusion = () => {
    setPhase("converging");
    setTimeout(() => {
      setPhase("merged");
      setTimeout(() => {
        setPhase("done");
        onComplete?.();
      }, 600);
    }, 800);
  };

  const resetAnimation = () => {
    setPhase("scatter");
  };

  const getScatterPosition = (i: number, total: number) => {
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 80 + (i % 3) * 20;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  return (
    <div className="relative">
      <div className="relative h-[200px] flex items-center justify-center overflow-hidden rounded-xl border border-border bg-surface/50">
        {phase === "scatter" && (
          <div className="flex items-center gap-4">
            {signals.map((signal, i) => {
              const pos = getScatterPosition(i, signals.length);
              return (
                <motion.div
                  key={signal.id}
                  className="absolute"
                  initial={{ x: pos.x, y: pos.y, opacity: 1 }}
                  animate={{ x: pos.x, y: pos.y, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <SourcePill source={signal.source} size="md" />
                    <p className="mt-1 text-[10px] text-text-muted max-w-[100px] truncate text-center">
                      {signal.text}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={triggerFusion}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors z-10"
            >
              ▶ Show Formation
            </motion.button>
          </div>
        )}

        {phase === "converging" && (
          <div className="relative w-full h-full flex items-center justify-center">
            {signals.map((signal, i) => {
              const pos = getScatterPosition(i, signals.length);
              return (
                <motion.div
                  key={signal.id}
                  className="absolute"
                  initial={{ x: pos.x, y: pos.y, opacity: 1 }}
                  animate={{ x: 0, y: 0, opacity: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: i * 0.05,
                  }}
                  style={{ zIndex: 10 - i }}
                >
                  <motion.div
                    animate={{ scale: [1, 0.5, 0.8] }}
                    transition={{ duration: 0.3 }}
                  >
                    <SourcePill source={signal.source} size="md" />
                  </motion.div>
                </motion.div>
              );
            })}
            <motion.div
              className="absolute w-12 h-12 rounded-full bg-primary/30"
              animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1, repeat: 1 }}
            />
          </div>
        )}

        {(phase === "merged" || phase === "done") && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2">
              {signals.slice(0, 4).map((signal) => (
                <SourcePill key={signal.id} source={signal.source} />
              ))}
              {signals.length > 4 && (
                <span className="text-xs text-text-muted font-mono">+{signals.length - 4}</span>
              )}
            </div>
            <SeverityBadge level={clusterSeverity} />
            <h3 className="text-sm font-display font-semibold text-text-primary">{clusterTitle}</h3>
            <motion.div
              className="flex items-center gap-1 text-xs text-text-muted font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-text-primary font-bold">9.2</span>
              <span>severity ·</span>
              <span className="text-success">91%</span>
              <span>confidence ·</span>
              <span>{signals.length} sources</span>
            </motion.div>
            {phase === "done" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={resetAnimation}
                className="mt-2 px-3 py-1.5 rounded-md border border-border text-[10px] text-text-secondary hover:text-text-primary transition-colors"
              >
                ↺ Replay Formation
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
