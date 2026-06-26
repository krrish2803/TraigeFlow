"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SeverityBadge from "@/components/ui/SeverityBadge";
import ConfidenceBar from "@/components/ui/ConfidenceBar";
import { useToast } from "@/components/ui/Toast";
import type { SeverityLevel } from "@/lib/constants";

interface ApprovalCardProps {
  id: string;
  issueId: string;
  title: string;
  severity: SeverityLevel;
  area: string;
  releaseRisk: "block" | "caution" | "safe";
  summary: string;
  reproSteps: string;
  expectedActual: string;
  suggestedOwner: string;
  confidenceScores: {
    summary: number;
    reproSteps: number;
    expectedActual: number;
    suggestedOwner: number;
  };
  status: "pending" | "approved" | "rejected";
  githubIssueRef?: string;
  jiraIssueRef?: string;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, reason?: string) => Promise<void>;
  evidence?: Array<{ type: string; description: string; confidence: number; details?: string }>;
}

const RISK_COLORS = {
  block: { bg: "rgba(255,107,107,0.15)", text: "var(--accent-secondary)", label: "BLOCK" },
  caution: { bg: "rgba(255,179,71,0.15)", text: "var(--accent-warn)", label: "CAUTION" },
  safe: { bg: "rgba(0,212,170,0.15)", text: "var(--accent-success)", label: "SAFE" },
};

export default function ApprovalCard(props: ApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [localStatus, setLocalStatus] = useState(props.status);
  const { showToast } = useToast();
  const risk = RISK_COLORS[props.releaseRisk];

  const handleApprove = async () => {
    if (!props.onApprove) return;
    setIsApproving(true);
    showToast("Approving draft and creating issues…", "info");
    try {
      await props.onApprove(props.id);
      setLocalStatus("approved");
      showToast(`Issue ${props.issueId} approved and filed`, "success");
    } catch {
      showToast("Failed to approve draft", "error");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!props.onReject) return;
    setIsRejecting(true);
    try {
      await props.onReject(props.id, rejectReason || "Rejected by reviewer");
      setLocalStatus("rejected");
      showToast(`Draft ${props.issueId} rejected`, "info");
    } catch {
      showToast("Failed to reject draft", "error");
    } finally {
      setIsRejecting(false);
      setShowRejectInput(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.85) return "var(--accent-success)";
    if (score >= 0.7) return "var(--accent-warn)";
    return "var(--accent-secondary)";
  };

  const isApproved = localStatus === "approved";
  const isRejected = localStatus === "rejected";

  return (
    <motion.div
      layout
      className={`relative rounded-xl border overflow-hidden transition-all ${
        isApproved
          ? "border-success/50 bg-success/[0.02]"
          : isRejected
          ? "border-secondary/30 bg-secondary/[0.02]"
          : "border-border bg-surface"
      }`}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        {isApproved && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-success/50 border border-success/30 px-2 py-1 rounded">
            APPROVED
          </span>
        )}
        {isRejected && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary/50 border border-secondary/30 px-2 py-1 rounded">
            REJECTED
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-medium text-text-muted uppercase tracking-wider">DRAFT</span>
            <span className="text-[11px] font-mono text-primary font-bold">{props.issueId}</span>
            <SeverityBadge level={props.severity} />
            <span className="text-xs text-text-muted">· {props.area}</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider"
            style={{ backgroundColor: risk.bg, color: risk.text }}
          >
            <span>●</span>
            {risk.label}
          </div>
        </div>

        <h3 className="text-base font-display font-semibold text-text-primary mb-4">{props.title}</h3>

        <div className="space-y-4">
          <Section label="Summary" confidence={props.confidenceScores.summary} color={getConfidenceColor(props.confidenceScores.summary)}>
            {props.summary}
          </Section>
          <Section label="Repro Steps" confidence={props.confidenceScores.reproSteps} color={getConfidenceColor(props.confidenceScores.reproSteps)}>
            {props.reproSteps}
          </Section>
          <Section label="Expected vs Actual" confidence={props.confidenceScores.expectedActual} color={getConfidenceColor(props.confidenceScores.expectedActual)}>
            {props.expectedActual}
          </Section>
          <Section label="Suggested Owner" confidence={props.confidenceScores.suggestedOwner} color={getConfidenceColor(props.confidenceScores.suggestedOwner)}>
            {props.suggestedOwner}
          </Section>
        </div>

        {(props.githubIssueRef || props.jiraIssueRef) && (
          <div className="mt-4 flex items-center gap-3 text-xs">
            {props.githubIssueRef && (
              <span className="text-success flex items-center gap-1">
                <span>●</span> GitHub: {props.githubIssueRef}
              </span>
            )}
            {props.jiraIssueRef && (
              <span className="text-warn flex items-center gap-1">
                <span>●</span> Jira: {props.jiraIssueRef}
              </span>
            )}
          </div>
        )}

        {props.evidence && props.evidence.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
            >
              <span>{showEvidence ? "▼" : "▶"}</span>
              Evidence ({props.evidence.length} items)
            </button>
            {showEvidence && (
              <div className="mt-2 space-y-1.5">
                {props.evidence.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-elevated/20 text-xs">
                    <span className="text-text-muted shrink-0 mt-0.5">•</span>
                    <div>
                      <span className="text-text-primary">{e.description}</span>
                      <span className="text-text-muted ml-1">
                        ({Math.round(e.confidence * 100)}% confidence)
                      </span>
                      {e.details && (
                        <p className="text-text-muted mt-0.5 text-[10px]">{e.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
          {!isApproved && !isRejected ? (
            <>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-70 transition-all"
              >
                {isApproving ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >◌</motion.span>
                    Approving…
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Approve & Create
                  </>
                )}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowRejectInput(!showRejectInput)}
                  disabled={isRejecting}
                  className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-elevated/50 transition-colors"
                >
                  {isRejecting ? "Rejecting…" : "✗ Reject"}
                </button>
                {showRejectInput && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 right-0 z-10 w-72 p-3 rounded-lg bg-surface border border-border shadow-lg"
                  >
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection…"
                      className="w-full px-3 py-2 rounded-lg bg-elevated/50 border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary resize-none h-20"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleReject}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-medium hover:bg-secondary/90"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          ) : isApproved ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <span>✓</span> Approved
              {props.githubIssueRef && <span className="text-text-muted">· {props.githubIssueRef}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span>✗</span> Rejected
            </div>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="ml-auto px-4 py-2 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-elevated/50 transition-colors"
          >
            ✏ Edit Draft
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Section({
  label,
  confidence,
  children,
}: {
  label: string;
  confidence: number;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">{label}</span>
        <div className="flex-1" />
        <ConfidenceBar value={confidence} className="w-24" />
      </div>
      <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{children}</p>
    </div>
  );
}
