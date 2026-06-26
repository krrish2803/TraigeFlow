"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_SIGNALS, MOCK_FUSION_OUTPUT } from "@/constants/mockData";

type Phase = "idle" | "ingesting" | "classifying" | "clustering" | "done";

export default function SignalFusion() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeSignal, setActiveSignal] = useState(0);

  const runPipeline = useCallback(() => {
    setPhase("ingesting");
    setActiveSignal(0);
    let i = 0;
    const ingestInterval = setInterval(() => {
      i++;
      setActiveSignal(i);
      if (i >= MOCK_SIGNALS.length) {
        clearInterval(ingestInterval);
        setPhase("classifying");

        setTimeout(() => {
          setPhase("clustering");
          setTimeout(() => {
            setPhase("done");
          }, 1200);
        }, 1000);
      }
    }, 600);
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setActiveSignal(0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(runPipeline, 1500);
    return () => clearTimeout(timer);
  }, [runPipeline]);

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-primary/[0.02]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3">
            See the Pipeline in Action
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto text-sm">
            Watch raw signals from Slack, Gmail, GitHub, and Jira fuse into a single structured issue — automatically.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-2"
          >
            <div className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3 text-center lg:text-left">
              Incoming Signals
            </div>
            {MOCK_SIGNALS.map((signal, i) => {
              const isActive = phase !== "idle" && i <= activeSignal - 1;
              const isCurrent = phase === "ingesting" && i === activeSignal;
              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{
                    opacity: isActive ? 1 : 0.4,
                    x: isActive ? 0 : -10,
                    height: isActive ? "auto" : 0,
                  }}
                  transition={{ duration: 0.4, delay: isActive ? 0 : 0 }}
                  className={`p-3 rounded-xl border transition-all duration-500 ${
                    isCurrent
                      ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
                      : isActive
                      ? "border-border bg-surface/50"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ backgroundColor: signal.color }}
                    >
                      {signal.avatar.slice(0, 1)}
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: signal.color }}>
                      {signal.source}
                    </span>
                    {isCurrent && <motion.span className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />}
                  </div>
                  <p className="text-[11px] text-text-primary/70 line-clamp-1">{signal.text}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="flex flex-col items-center gap-3">
            {phase === "classifying" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center"
              >
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/40"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-primary text-2xl">⟐</span>
                <motion.span
                  className="absolute -bottom-6 text-[10px] font-mono text-primary font-medium whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Classifying…
                </motion.span>
              </motion.div>
            )}
            {phase === "clustering" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative w-20 h-20 rounded-full bg-violet-500/20 border-2 border-violet-500 flex items-center justify-center"
              >
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-violet-500/40"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div className="flex flex-wrap gap-0.5 justify-center w-8">
                  {MOCK_SIGNALS.slice(0, 4).map((s, i) => (
                    <motion.div
                      key={s.id}
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: s.color }}
                      animate={{ x: [0, i < 2 ? -4 : 4, 0], y: [0, i % 2 === 0 ? -4 : 4, 0] }}
                      transition={{ duration: 0.5 }}
                    />
                  ))}
                </motion.div>
                <motion.span className="absolute -bottom-6 text-[10px] font-mono text-violet-400 font-medium whitespace-nowrap">
                  Merging…
                </motion.span>
              </motion.div>
            )}
            {phase === "done" && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-success/20 border-2 border-success flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-success" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
              </motion.div>
            )}
            {phase === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-text-muted font-mono"
              >
                AI Node
              </motion.div>
            )}
            <div className="h-12 w-px bg-gradient-to-b from-primary/50 to-success/50" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3 text-center lg:text-left">
              Fused Issue
            </div>
            <AnimatePresence mode="wait">
              {phase === "done" ? (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="p-4 rounded-xl border border-success/30 bg-success/[0.03]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                      {MOCK_FUSION_OUTPUT.severity}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-text-primary">
                      {MOCK_FUSION_OUTPUT.score}
                    </span>
                    <span className="text-[10px] text-text-muted">/ 10</span>
                    <span className="text-[10px] text-text-muted ml-auto">
                      {MOCK_FUSION_OUTPUT.sources.join(" · ")}
                    </span>
                  </div>
                  <h4 className="text-sm font-display font-semibold text-text-primary mb-2">
                    {MOCK_FUSION_OUTPUT.title}
                  </h4>
                  <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                    {MOCK_FUSION_OUTPUT.summary}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">Root cause:</span>
                    <span className="text-[10px] text-text-primary/70">{MOCK_FUSION_OUTPUT.rootCause}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={reset}
                    className="mt-3 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
                  >
                    ↺ Replay
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="p-4 rounded-xl border border-border bg-surface/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-14 h-4 rounded bg-elevated/50" />
                    <div className="w-8 h-4 rounded bg-elevated/50" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-elevated/50 w-3/4" />
                    <div className="h-3 rounded bg-elevated/50 w-full" />
                    <div className="h-3 rounded bg-elevated/50 w-2/3" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {phase !== "done" && phase !== "idle" && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: phase === "ingesting" ? "25%" : phase === "classifying" ? "50%" : "75%" }}
            transition={{ duration: 0.5 }}
            className="mt-8 h-1 rounded-full bg-gradient-to-r from-primary via-violet-500 to-success mx-auto max-w-md"
          />
        )}
      </div>
    </section>
  );
}
