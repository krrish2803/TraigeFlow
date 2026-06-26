"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SourcePill from "@/components/ui/SourcePill";
import SeverityBadge from "@/components/ui/SeverityBadge";
import ConfidenceBar from "@/components/ui/ConfidenceBar";
import { useSignal, useSignals } from "@/lib/use-data";
import type { SourceType } from "@/lib/constants";

interface SignalDetailPanelProps {
  signalId: string | null;
  onClose: () => void;
  onRunTriage?: () => void;
}

export default function SignalDetailPanel({ signalId, onClose, onRunTriage }: SignalDetailPanelProps) {
  const { data: signal } = useSignal(signalId);
  const { data: allSignals } = useSignals();
  const [showEvidence, setShowEvidence] = useState(false);

  const similarSignals = signal && allSignals
    ? allSignals.filter((s) => s.id !== signal.id && s.source === signal.source).slice(0, 2)
    : [];

  const evidence = (signal?.evidence as Array<{ type: string; description: string; confidence: number; details?: string }>) || [];

  return (
    <AnimatePresence>
      {signal && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed right-0 top-16 bottom-0 w-[400px] bg-surface border-l border-border z-30 overflow-y-auto"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <SourcePill source={signal.source as SourceType} size="md" />
              <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg">✕</button>
            </div>

            <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
              {(signal.title as string) || (signal.raw_text as string)?.slice(0, 80)}
            </h2>

            <div className="flex items-center gap-2 mb-6">
              <SeverityBadge level={(signal.severity as "critical" | "high" | "medium" | "low") || (signal.urgency as "critical" | "high" | "medium" | "low") || "medium"} />
              <span className="text-xs text-text-muted">
                {(signal.author as string) || "unknown"} · {(signal.channel as string) || "unknown"} · {formatTimestamp(signal.created_at as string || signal.createdAt as string)}
              </span>
            </div>

            <div className="mb-6 p-4 rounded-lg bg-elevated/30 border border-border">
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {(signal.body as string) || (signal.raw_text as string) || ""}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary">AI Classification</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">
                  {(signal.label as string) || (signal.category as string) || "Pending"}
                </span>
                {(() => {
                  const conf = (signal.labelConfidence as number) || (signal.label_confidence as number) || (signal.confidence as number);
                  if (conf) return (
                    <>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted">Confidence</span>
                      <ConfidenceBar value={conf || 0.5} className="flex-1" />
                    </>
                  );
                  return null;
                })()}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span>Product Area: <span className="text-text-primary">{(signal.productArea as string) || (signal.product_area as string) || "Unclassified"}</span></span>
                <span>·</span>
                <span>Status: <span className="text-text-primary">{(signal.status as string) || "pending"}</span></span>
              </div>
            </div>

            {evidence.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="text-xs font-medium uppercase tracking-wider text-text-secondary hover:text-text-primary flex items-center gap-1"
                >
                  <span>{showEvidence ? "▼" : "▶"}</span>
                  Evidence ({evidence.length} items)
                </button>
                <AnimatePresence>
                  {showEvidence && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 space-y-2 overflow-hidden"
                    >
                      {evidence.map((e, i) => (
                        <div key={i} className="p-3 rounded-lg bg-elevated/20 border border-border">
                          <div className="flex items-start gap-2">
                            <span className="text-text-muted text-xs mt-0.5">•</span>
                            <div>
                              <p className="text-xs text-text-primary font-medium">{e.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-text-muted">
                                  {Math.round(e.confidence * 100)}% confidence
                                </span>
                                <span className="text-[10px] text-text-muted">·</span>
                                <span className="text-[10px] text-text-muted">{e.type}</span>
                              </div>
                              {e.details && (
                                <p className="text-[10px] text-text-muted mt-1 italic">{e.details}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {similarSignals.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary">Similar Signals</h3>
                {similarSignals.map((s) => (
                  <div
                    key={s.id as string}
                    className="flex items-center gap-3 p-2 rounded-lg bg-elevated/20 border border-border cursor-pointer hover:bg-elevated/40 transition-colors"
                  >
                    <SourcePill source={s.source as SourceType} />
                    <span className="text-xs text-text-primary truncate flex-1">
                      {(s.raw_text as string)?.slice(0, 50) || (s.body as string)?.slice(0, 50)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onRunTriage}
              className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              → Run Triage Pipeline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatTimestamp(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
