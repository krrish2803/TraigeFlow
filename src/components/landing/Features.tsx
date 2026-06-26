"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Multi-Source Ingestion",
    description: "Connect Slack, Gmail, GitHub Issues, and Jira in one click. All feedback flows into a unified inbox, automatically classified and deduplicated.",
    icon: "⊞",
    stat: "4 sources",
    gradient: "from-primary/20 to-primary/5",
    hoverBorder: "group-hover:border-primary/30",
  },
  {
    title: "AI Signal Fusion",
    description: "Multi-agent pipeline clusters duplicate reports into single issues. Watch signals from different sources converge into one root cause analysis.",
    icon: "⟐",
    stat: "94% accuracy",
    gradient: "from-secondary/20 to-secondary/5",
    hoverBorder: "group-hover:border-secondary/30",
  },
  {
    title: "Severity Scoring",
    description: "Every cluster gets a severity score (0-10) and confidence rating. Critical issues surface immediately. Noise is filtered automatically.",
    icon: "▲",
    stat: "Real-time",
    gradient: "from-warn/20 to-warn/5",
    hoverBorder: "group-hover:border-warn/30",
  },
  {
    title: "Draft Generation",
    description: "AI writes structured GitHub issues with summaries, repro steps, and suggested owners. Review, edit, and approve with one click.",
    icon: "⊟",
    stat: "12s avg",
    gradient: "from-success/20 to-success/5",
    hoverBorder: "group-hover:border-success/30",
  },
  {
    title: "Release Risk Analysis",
    description: "Before shipping, get a digest of all open issues mapped to release risk. Know exactly what blocks, what's cautionary, and what's safe.",
    icon: "↑",
    stat: "Risk score",
    gradient: "from-primary/20 to-accent-secondary/10",
    hoverBorder: "group-hover:border-primary/30",
  },
  {
    title: "Workflow Automation",
    description: "Configure triage rules, auto-assign owners, and route issues to the right team. The pipeline runs continuously in the background.",
    icon: "⚙",
    stat: "Always on",
    gradient: "from-success/20 to-secondary/10",
    hoverBorder: "group-hover:border-success/30",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.015] to-transparent" />
      <motion.div
        className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[120px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
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
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-text-primary mb-4">
            From Chaos to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Clarity
            </span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
            Every feature is built to close the gap between a user complaining in Slack and an engineer shipping a fix.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`group relative p-6 sm:p-7 rounded-2xl border border-border/60 bg-surface/30 backdrop-blur-sm overflow-hidden cursor-default transition-all duration-300 ${feature.hoverBorder} hover:shadow-xl hover:shadow-primary/5`}
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/[0.02] rounded-full blur-3xl group-hover:bg-primary/[0.04] transition-all duration-500" />

              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                  className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg mb-4"
                >
                  {feature.icon}
                </motion.div>

                <h3 className="text-base font-display font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {feature.description}
                </p>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10"
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[10px] font-mono font-medium text-primary">
                    {feature.stat}
                  </span>
                </motion.div>
              </div>

              <motion.div
                className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
