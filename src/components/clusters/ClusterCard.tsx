"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SourcePill from "@/components/ui/SourcePill";
import SeverityBadge from "@/components/ui/SeverityBadge";
import ConfidenceBar from "@/components/ui/ConfidenceBar";
import SignalFusionAnimation from "@/components/signals/SignalFusionAnimation";
import type { SourceType, SeverityLevel } from "@/lib/constants";

interface ClusterCardProps {
  id: string;
  title: string;
  severity: SeverityLevel;
  sources: SourceType[];
  signalCount: number;
  sourceCount: number;
  lastActivity: string;
  severityScore: number;
  confidence: number;
  area: string;
  description: string;
  rootCause: string;
  evidence: string[];
  aiExplanation: string;
  signals: string[];
}

export default function ClusterCard(cluster: ClusterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFusion, setShowFusion] = useState(false);

  return (
    <motion.div
      layout
      className="rounded-xl border border-border bg-surface overflow-hidden"
    >
      <motion.div
        layout
        className={`p-5 cursor-pointer transition-colors hover:bg-elevated/30 ${
          cluster.severity === "critical"
            ? "border-l-2 border-secondary"
            : cluster.severity === "high"
            ? "border-l-2 border-warn"
            : cluster.severity === "medium"
            ? "border-l-2 border-primary"
            : "border-l-2 border-text-muted"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <SeverityBadge level={cluster.severity} />
            <h3 className="text-base font-display font-semibold text-text-primary">{cluster.title}</h3>
          </div>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-text-muted"
          >
            ▼
          </motion.span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {cluster.sources.map((source) => (
            <SourcePill key={source} source={source} />
          ))}
          <span className="text-xs text-text-muted ml-2">
            {cluster.signalCount} signals · {cluster.sourceCount} sources · Last: {cluster.lastActivity}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-medium">Severity</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-mono font-bold text-text-primary">{cluster.severityScore}</span>
              <span className="text-xs text-text-muted">/ 10</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-medium">Confidence</span>
            <ConfidenceBar value={cluster.confidence} className="mt-2" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFusion(!showFusion);
            }}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
          >
            <span>⟐</span> {showFusion ? "Hide" : "View Evidence"}
          </button>
          <button className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1">
            <span>⊟</span> Generate Issue Draft
          </button>
          <button className="text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1">
            <span>✕</span> Archive
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {showFusion && (
                <SignalFusionAnimation
                  signals={cluster.sources.map((s, i) => ({
                    id: `${cluster.id}-sig-${i}`,
                    source: s,
                    text: cluster.signals[i] || `Signal from ${s}`,
                  }))}
                  clusterTitle={cluster.title}
                  clusterSeverity={cluster.severity}
                />
              )}

              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">AI Analysis</h4>
                <p className="text-sm text-text-primary leading-relaxed">{cluster.aiExplanation}</p>
              </div>

              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">Root Cause</h4>
                <p className="text-sm text-text-primary">{cluster.rootCause}</p>
              </div>

              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">Evidence</h4>
                <ul className="space-y-1.5">
                  {cluster.evidence.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-text-muted mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
