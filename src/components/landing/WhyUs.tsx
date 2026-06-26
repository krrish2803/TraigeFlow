"use client";

import { motion } from "framer-motion";

const REASONS = [
  {
    title: "Built for Small Teams",
    description: "No enterprise overhead. Set up in minutes, not months. Connect your sources and the pipeline starts working immediately.",
    stat: "5 min setup",
  },
  {
    title: "Multi-Agent Pipeline",
    description: "Intake → Classify → Cluster → Triage → Draft → Ship. Each step is a specialized AI agent working in sequence. No black box — watch every decision.",
    stat: "6 agents",
  },
  {
    title: "Real Demo Data",
    description: "Pre-seeded with realistic signals across all 4 sources. See a complete triage flow from raw Slack message to approved GitHub issue in seconds.",
    stat: "8 signals → 1 cluster",
  },
  {
    title: "Your Data Stays Yours",
    description: "Runs on your infrastructure via Lemma SDK. No training on your data. No vendor lock-in. Full control over the pipeline.",
    stat: "100% private",
  },
];

export default function WhyUs() {
  return (
    <section id="why-us" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-4">
            Why Feedback-to-Fix?
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            We built this because we lived the pain of scattered bug reports and slow triage.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {REASONS.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-xl border border-border bg-surface"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-display font-semibold text-text-primary">
                  {reason.title}
                </h3>
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                  {reason.stat}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
