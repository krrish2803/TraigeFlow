"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const STEPS = [
  { icon: "⊞", label: "1. Intake", desc: "Signals arrive from Slack, Gmail, GitHub, or Jira." },
  { icon: "⟐", label: "2. Triage", desc: "Lemma classifies, clusters, and triages signals." },
  { icon: "⊟", label: "3. Draft", desc: "Lemma generates structured bug/feature drafts." },
  { icon: "✓", label: "4. Approve", desc: "Human-in-the-loop gate — review and approve." },
  { icon: "↑", label: "5. Release", desc: "GitHub/Jira issues created; release risk updated." },
];

export default function HowItWorks({ open: externalOpen, onClose }: { open?: boolean; onClose?: () => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const close = () => {
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setInternalOpen(true)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <span className="text-sm">?</span>
        How it works
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-display font-semibold text-text-primary">How Signal2Fix Works</h2>
                    <button
                      onClick={close}
                      className="text-text-muted hover:text-text-primary transition-colors text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                    Signal2Fix turns Slack/Gmail complaints into reviewed GitHub/Jira action.
                    The entire pipeline is powered by <strong className="text-primary">Lemma</strong> —
                    classification, clustering, triage, drafting, review, and release-risk assessment
                    all run through Lemma agents and durable workflows.
                  </p>

                  <div className="space-y-3">
                    {STEPS.map((step, i) => (
                      <motion.div
                        key={step.label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-elevated/30"
                      >
                        <span className="text-lg w-6 text-center shrink-0 mt-0.5 text-primary">
                          {step.icon}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{step.label}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{step.desc}</p>
                        </div>
                        {i < STEPS.length - 1 && (
                          <span className="text-text-muted text-sm ml-auto">↓</span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      <strong className="text-primary">Judge quick-start:</strong> Go to{" "}
                      <strong>Settings</strong> → inject a demo signal →
                      <strong>Inbox</strong> → <strong>Clusters</strong> (Run Triage) →
                      <strong>Drafts</strong> (Approve) → <strong>Releases</strong>.
                      All 4 intake sources work: Slack, Gmail, GitHub, Jira.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
