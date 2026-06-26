"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MOCK_SIGNALS } from "@/constants/mockData";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-6"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-6">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              AI-Powered Triage for Engineering Teams
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
              Scattered Noise into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/70 to-primary/40">
                Execution-Ready Work
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-base sm:text-lg text-text-secondary max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              Feedback-to-Fix ingests bug reports from Slack, Gmail, GitHub, and Jira, runs them through a multi-agent AI pipeline, and outputs clean engineering tickets ready to ship.
            </motion.p>

            <motion.div variants={itemVariants} className="flex items-center gap-4 justify-center lg:justify-start">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/dashboard"
                  className="inline-flex px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25"
                >
                  Try the Demo →
                </Link>
              </motion.div>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#features"
                className="inline-flex px-6 py-3 rounded-lg border border-border text-text-secondary text-sm font-medium hover:border-text-muted hover:text-text-primary transition-all"
              >
                See How It Works
              </motion.a>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
              {[
                { value: "4", label: "Sources" },
                { value: "12s", label: "Avg. Triage" },
                { value: "94%", label: "Accuracy" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <motion.p
                    className="text-2xl font-mono font-bold text-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative">
            <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 shadow-2xl shadow-primary/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <div className="w-3 h-3 rounded-full bg-warn" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <span className="text-[10px] text-text-muted font-mono">signal-inbox</span>
              </div>

              <div className="space-y-2">
                {MOCK_SIGNALS.map((signal, i) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.12 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-elevated/30 border border-border group cursor-default"
                  >
                    <motion.div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: signal.color }}
                      whileHover={{ scale: 1.1, rotate: -5 }}
                    >
                      {signal.avatar}
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color: signal.color }}>
                          {signal.source}
                        </span>
                        <span className="text-[10px] text-text-muted">{signal.from}</span>
                        <span className="text-[10px] text-text-muted ml-auto">{signal.timestamp}</span>
                      </div>
                      <p className="text-xs text-text-primary/80 leading-relaxed line-clamp-2">
                        {signal.text}
                      </p>
                    </div>
                    <motion.span
                      className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      whileHover={{ x: 2 }}
                    >
                      →
                    </motion.span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.8, duration: 0.5 }}
                className="mt-4 pt-4 border-t border-border"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-mono">4 unclassified signals</span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-md"
                  >
                    Run Triage →
                  </motion.button>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
