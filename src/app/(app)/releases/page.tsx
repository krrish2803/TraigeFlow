"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReleases, useDrafts, generateReleaseDigestAction } from "@/lib/use-data";

export default function ReleasesPage() {
  const { data: release, loading, error, refresh } = useReleases();
  const { data: allDrafts } = useDrafts();
  const [generating, setGenerating] = useState(false);
  const [lastDigest, setLastDigest] = useState<Record<string, unknown> | null>(null);

  const handleGenerateDigest = async () => {
    setGenerating(true);
    try {
      const result = await generateReleaseDigestAction();
      setLastDigest(result);
      await refresh();
    } catch {
      // ignore
    }
    setGenerating(false);
  };

  const digest = lastDigest || release?.lastDigest;

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-muted animate-pulse">Analyzing release impact…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full bg-warn/10 flex items-center justify-center mb-4">
          <span className="text-warn text-xl">!</span>
        </div>
        <p className="text-sm text-text-secondary mb-2">Failed to load release data</p>
        <p className="text-xs text-text-muted mb-4">{error}</p>
        <button onClick={refresh} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Blocking" value={release?.blockCount ?? 0} color="text-secondary" />
        <StatCard label="Caution" value={release?.cautionCount ?? 0} color="text-warn" />
        <StatCard label="Safe" value={release?.safeCount ?? 0} color="text-success" />
        <StatCard label="Risk Score" value={`${release?.riskScore ?? 0}%`} color="text-primary" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">At a Glance</h3>
          <div className="space-y-2">
            <Row label="Total Clusters" value={String(release?.totalClusters ?? 0)} />
            <Row label="Total Drafts" value={String(release?.totalDrafts ?? 0)} />
            <Row label="Unreviewed Drafts" value={String((release?.blockCount ?? 0) + (release?.cautionCount ?? 0))} />
            <Row label="Signals This Cycle" value={String(release?.totalSignals ?? 0)} />
            <Row label="Total Signals" value={String(release?.totalSignals ?? 0)} />
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-text-secondary mb-2">Risk Breakdown</h4>
            <div className="flex items-center gap-2 h-2">
              {renderBar(release?.blockCount ?? 0, "bg-secondary")}
              {renderBar(release?.cautionCount ?? 0, "bg-warn")}
              {renderBar(release?.safeCount ?? 0, "bg-success")}
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-secondary" /> Block</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-warn" /> Caution</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-success" /> Safe</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Release Digest</h3>
          {digest ? (
            <div className="space-y-2">
              <Row label="Risk Level" value={String(digest.riskLevel || digest.overall_risk || "unknown").toUpperCase()} />
              <Row label="Generated" value={formatDate(String(digest.generatedAt || digest.created_at || digest.generated_at || ""))} />
              {(() => {
                const hl = digest.highlights;
                if (hl && Array.isArray(hl)) {
                  return (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-text-secondary mb-1">Highlights</p>
                      {hl.map((h, i) => (
                        <p key={i} className="text-xs text-text-primary flex items-start gap-1">
                          <span className="text-text-muted">•</span> {String(h)}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-text-muted">No digest generated yet for this cycle.</p>
              <p className="text-xs text-text-muted">Generate one to see a full release readiness summary.</p>
            </div>
          )}
          <button
            onClick={handleGenerateDigest}
            disabled={generating}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {generating ? "Generating…" : "Generate Release Digest"}
          </button>
        </div>
      </div>

      {allDrafts && allDrafts.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Draft Impact Breakdown</h3>
          <div className="space-y-2">
            {allDrafts.map((draft) => {
              const risk = (draft.releaseRisk as string) || (draft.release_risk as string) || "safe";
              const riskColor =
                risk === "block" ? "border-l-secondary" :
                risk === "caution" ? "border-l-warn" : "border-l-success";
              return (
                <motion.div
                  key={draft.id as string}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-surface border border-border border-l-4 ${riskColor} rounded-lg px-4 py-3`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{(draft.title as string) || "Untitled"}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {(draft.ownerSuggestion as string) || (draft.suggested_owner as string) || "Unknown area"} · {(draft.severity as string) || "medium"} severity
                        {draft.approvalStatus === "approved" || draft.approval_status === "approved" ? " · ✅ Approved" : ""}
                        {(draft.githubIssueRef || draft.github_issue_url) ? ` · ${draft.githubIssueRef || draft.github_issue_url}` : ""}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                      risk === "block" ? "bg-secondary/10 text-secondary" :
                      risk === "caution" ? "bg-warn/10 text-warn" :
                      "bg-success/10 text-success"
                    }`}>
                      {risk === "block" ? "BLOCK" : risk === "caution" ? "CAUTION" : "SAFE"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs font-medium text-text-primary">{value}</span>
    </div>
  );
}

function renderBar(count: number, color: string, total?: number) {
  const max = total || 1;
  const pct = Math.max((count / max) * 100, count > 0 ? 8 : 0);
  return <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />;
}

function formatDate(d: string) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" });
}
