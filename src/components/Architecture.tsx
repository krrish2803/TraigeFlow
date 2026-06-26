"use client";

import { motion } from "framer-motion";

const AGENTS = [
  { name: "Intake", desc: "Connect & ingest", icon: "⊞", color: "var(--accent-primary)" },
  { name: "Classify", desc: "Categorize signals", icon: "◎", color: "var(--accent-secondary)" },
  { name: "Retrieve", desc: "Context & history", icon: "◈", color: "var(--accent-warn)" },
  { name: "Triage", desc: "Score & prioritize", icon: "▲", color: "var(--accent-success)" },
  { name: "Review", desc: "Approve drafts", icon: "⊟", color: "var(--accent-primary)" },
  { name: "Ship", desc: "Create issues", icon: "↑", color: "var(--accent-secondary)" },
];

export default function Architecture() {
  return (
    <section id="architecture" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3">
            Multi-Agent Pipeline
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm">
            Six specialized AI agents work in sequence. No black box — watch every decision as it happens.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-8">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl border-2 relative"
                  style={{ borderColor: agent.color, backgroundColor: `${agent.color}15` }}
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <span style={{ color: agent.color }}>{agent.icon}</span>
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{ borderColor: agent.color }}
                    animate={{ boxShadow: [`0 0 0 0 ${agent.color}30`, `0 0 0 6px ${agent.color}10`, `0 0 0 0 ${agent.color}30`] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  />
                </motion.div>
                <span className="text-xs font-display font-semibold text-text-primary">{agent.name}</span>
                <span className="text-[9px] text-text-muted text-center">{agent.desc}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Powered by Lemma SDK",
                desc: "Each agent is a Lemma workflow node. The SDK handles state management, retries, observability, and inter-agent communication.",
              },
              {
                title: "Runs on Your Infrastructure",
                desc: "Deploy on your own cloud or on-premise. The pipeline is containerized, horizontally scalable, and fully auditable.",
              },
              {
                title: "Extensible & Configurable",
                desc: "Add custom agents, connect new sources, or modify scoring rules. The entire pipeline is configurable via YAML or the Settings UI.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-5 rounded-xl border border-border bg-surface"
              >
                <h4 className="text-sm font-display font-semibold text-text-primary mb-2">{item.title}</h4>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
