"use client";

import { motion } from "framer-motion";

const PROBLEMS = [
  {
    title: "Scattered Across Channels",
    description: "Bug reports live in Slack threads, GitHub discussions, support emails, and hallway conversations. No single source of truth.",
    icon: "⋯",
    stat: "4+ sources",
  },
  {
    title: "Duplicate Reports",
    description: "The same crash gets reported by 5 different users in 3 different places. Engineering spends hours triaging duplicates instead of fixing.",
    icon: "◎",
    stat: "~60% duplicates",
  },
  {
    title: "No Severity Signal",
    description: "A tiny CSS bug and a production outage both look the same in Slack. Critical signals get buried under noise.",
    icon: "▲",
    stat: "Low signal/noise",
  },
  {
    title: "Manual Triage Overhead",
    description: "Someone has to read every message, classify it, find duplicates, assess urgency, and write an issue. This doesn't scale.",
    icon: "◉",
    stat: "15 min per report",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/[0.02] to-transparent" />
      <motion.div
        className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[120px]"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-4 block">
            The Problem
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary mb-4">
            Feedback is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-secondary/60">
              broken
            </span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
            Engineering teams spend more time organizing bug reports than fixing them. Here is why.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="group relative p-6 sm:p-7 rounded-2xl border border-border/60 bg-surface/30 backdrop-blur-sm overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/[0.03] rounded-full blur-3xl group-hover:bg-secondary/[0.06] transition-all duration-500" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-xl"
                  >
                    {problem.icon}
                  </motion.div>
                  <span className="text-[10px] font-mono font-bold text-secondary/70 bg-secondary/5 px-2.5 py-1 rounded-md border border-secondary/10">
                    {problem.stat}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-display font-semibold text-text-primary mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface/50 border border-border/60 backdrop-blur-sm">
            <span className="text-lg">💡</span>
            <p className="text-sm text-text-secondary">
              <span className="text-text-primary font-medium">The result:</span> Engineers burn out. Bugs ship to production. Users churn.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
