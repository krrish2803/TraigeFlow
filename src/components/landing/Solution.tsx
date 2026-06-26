"use client";

import { motion } from "framer-motion";

const PIPELINE_STEPS = [
  {
    name: "Intake",
    description: "Ingests signals from Slack, Gmail, GitHub, and Jira. Normalizes text, detects language, filters noise.",
    agent: "Intake Agent",
    icon: "⊞",
    color: "from-primary/20 to-primary/5",
    border: "border-primary/20",
  },
  {
    name: "Classify",
    description: "Labels each signal as bug, feature, question, or noise. Assigns initial urgency with automatic severity boosts.",
    agent: "Classification Agent",
    icon: "▲",
    color: "from-secondary/20 to-secondary/5",
    border: "border-secondary/20",
  },
  {
    name: "Similarity",
    description: "Compares against existing signals using Jaccard similarity. Merges duplicates or creates new clusters.",
    agent: "Similarity Agent",
    icon: "◎",
    color: "from-success/20 to-success/5",
    border: "border-success/20",
  },
  {
    name: "Triage",
    description: "Assesses severity score (0-10), root cause, release risk, and affected modules with confidence ratings.",
    agent: "Triage Agent",
    icon: "◉",
    color: "from-warn/20 to-warn/5",
    border: "border-warn/20",
  },
  {
    name: "Draft",
    description: "Generates structured GitHub issues with title, summary, repro steps, customer reply, and Slack summary.",
    agent: "Draft Agent",
    icon: "⊟",
    color: "from-primary/20 to-primary/5",
    border: "border-primary/20",
  },
  {
    name: "Review",
    description: "Validates required fields, checks consistency. Ready for one-click approval to create real tickets.",
    agent: "Review Agent",
    icon: "✓",
    color: "from-success/20 to-success/5",
    border: "border-success/20",
  },
];

export default function Solution() {
  return (
    <section id="solution" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.015] to-transparent" />
      <motion.div
        className="absolute bottom-1/3 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[150px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4 block">
            The Solution
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary mb-4">
            6-Agent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              AI Pipeline
            </span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
            From raw message to ready-to-file issue in under 15 seconds. Every step is transparent and auditable.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent" />

          <div className="space-y-6 lg:space-y-0">
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={step.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`relative lg:w-1/2 ${i % 2 === 0 ? "lg:pr-12 lg:ml-0" : "lg:pl-12 lg:ml-auto"}`}
              >
                <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-base z-10 shadow-lg shadow-primary/30"
                  style={{ [i % 2 === 0 ? "right" : "left"]: "-6px" }}
                />

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`p-6 rounded-2xl border ${step.border} bg-surface/40 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300`}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-lg shrink-0`}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-base font-display font-semibold text-text-primary">
                          {step.name}
                        </h3>
                        <span className="text-[10px] font-mono text-text-muted bg-elevated/50 px-2 py-0.5 rounded border border-border/50">
                          {step.agent}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-surface/30 border border-border/50 backdrop-blur-sm">
            {["Intake", "Classify", "Similarity", "Triage", "Draft", "Review"].map((agent, i) => (
              <motion.span
                key={agent}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + i * 0.08 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated/50 border border-border/60 text-xs font-medium text-text-secondary"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {agent}
                {i < 5 && <span className="text-text-muted ml-0.5">→</span>}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
