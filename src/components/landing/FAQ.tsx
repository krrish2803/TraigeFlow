"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "What sources does Signal2Fix support?",
    a: "Signal2Fix currently integrates with Slack (Events API), Gmail (email forwarding), GitHub Issues (webhooks), and Jira. Each source adapter handles authentication, rate limiting, and message normalization automatically.",
  },
  {
    q: "How accurate is the AI classification?",
    a: "The classification agent achieves ~94% accuracy on production data. It assigns labels (bug, feature, question, noise) and urgency levels. You can review every classification decision in the activity feed and override if needed.",
  },
  {
    q: "Does this replace my existing issue tracker?",
    a: "No. Signal2Fix sits upstream of your issue tracker. It ingests raw signals, clusters duplicates, triages severity, and drafts issues. You review and approve before anything reaches GitHub or Jira.",
  },
  {
    q: "Is my data used to train the AI models?",
    a: "Never. The pipeline runs on your infrastructure via the Lemma SDK. All agents are deterministic rule-based systems with heuristic scoring. No data leaves your environment. No training on your signals.",
  },
  {
    q: "How long does it take to set up?",
    a: "About 5 minutes. Connect your sources (Slack, Gmail, GitHub, Jira) and the pipeline starts working immediately. Pre-seeded demo data is available to explore all features before connecting real sources.",
  },
  {
    q: "Can I customize the triage rules?",
    a: "Yes. The settings page lets you configure severity boost rules, auto-assignment logic, and which sources to include. You can also tweak the similarity threshold for duplicate detection.",
  },
  {
    q: "What happens when a draft is approved?",
    a: "Approval triggers the creation of a GitHub issue and/or Jira ticket with the AI-generated content. A Slack notification is posted to your activity channel. The draft moves from pending to approved in the dashboard.",
  },
  {
    q: "Can I run this without GitHub or Jira?",
    a: "Yes. The approval workflow gracefully degrades — if credentials aren't configured, it produces mock issue references (GH-1042, JIRA-221) so you can evaluate the full flow without real integrations.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent" />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/4 blur-[120px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted mb-4 block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary">
            Frequently Asked{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Questions
            </span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`rounded-2xl border transition-all duration-300 cursor-pointer ${
                openIndex === i
                  ? "border-primary/30 bg-primary/[0.03] shadow-lg shadow-primary/5"
                  : "border-border/50 bg-surface/20 hover:bg-surface/40 hover:border-border"
              }`}
              onClick={() => toggle(i)}
            >
              <div className="flex items-center justify-between px-6 py-5">
                <h3 className="text-sm sm:text-base font-display font-medium text-text-primary pr-4">
                  {faq.q}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    openIndex === i ? "bg-primary/10 text-primary" : "bg-elevated/50 text-text-muted"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 4L6 8L10 4" />
                  </svg>
                </motion.div>
              </div>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
