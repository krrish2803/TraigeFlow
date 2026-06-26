"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ClusterCard from "@/components/clusters/ClusterCard";
import Pagination from "@/components/ui/Pagination";
import { useClustersPaginated, runTriageAction } from "@/lib/use-data";
import { useToast } from "@/components/ui/Toast";
import type { SourceType, SeverityLevel } from "@/lib/constants";

export default function ClustersPage() {
  const { data, loading, error, setPage, page, refresh } = useClustersPaginated(20);
  const { showToast } = useToast();
  const [triaging, setTriaging] = useState<string | null>(null);

  const clusters = data?.items ?? [];
  const totalSignals = clusters.reduce((a, c) => a + ((c.signal_count as number) || (c.signalIds as string[])?.length || 0), 0);

  const handleTriage = async (clusterId: string) => {
    setTriaging(clusterId);
    try {
      const result = await runTriageAction(clusterId);
      if (result.success) {
        showToast("Triage complete — draft generated", "success");
        await refresh();
      } else {
        showToast(`Triage failed: ${result.error || "Unknown error"}`, "error");
      }
    } catch {
      showToast("Triage request failed", "error");
    }
    setTriaging(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full bg-warn/10 flex items-center justify-center mb-4">
          <span className="text-warn text-xl">!</span>
        </div>
        <p className="text-sm text-text-secondary mb-2">Failed to load clusters</p>
        <p className="text-xs text-text-muted mb-4">{error}</p>
        <button onClick={() => setPage(page)} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          {loading ? "Loading…" : `${data?.total ?? 0} clusters formed from ${totalSignals} signals`}
        </p>
        <div className="flex items-center gap-2">
          <select className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary">
            <option>Sort by Severity</option>
            <option>Sort by Date</option>
            <option>Sort by Confidence</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="space-y-3 max-w-2xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-elevated/30 animate-pulse" />
            ))}
          </div>
        </div>
      ) : clusters.length > 0 ? (
        <div className="space-y-4">
          {clusters.map((cluster, i) => (
            <motion.div
              key={cluster.id as string}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <ClusterCard
                id={cluster.id as string}
                title={cluster.canonicalTitle as string || cluster.canonical_title as string}
                severity={(cluster.severity || "medium") as SeverityLevel}
                sources={(cluster.sourceTypes as SourceType[]) || (cluster.sources as SourceType[]) || []}
                signalCount={(cluster.signal_count as number) || (cluster.signalIds as string[])?.length || 0}
                sourceCount={(cluster.source_count as number) || (cluster.sourceTypes as string[])?.length || 0}
                lastActivity={cluster.lastSeen ? formatRelativeTime(cluster.lastSeen as string) : cluster.last_seen ? formatRelativeTime(cluster.last_seen as string) : "N/A"}
                severityScore={(cluster.severity_score as number) || (cluster.severityScore as number) || 0}
                confidence={(cluster.confidence as number) || 0}
                area={(cluster.productArea as string) || (cluster.product_area as string) || "Unknown"}
                description={(cluster.summary as string) || cluster.canonical_summary as string || cluster.canonicalTitle as string || cluster.canonical_title as string}
                rootCause={(cluster.rootCauseHypothesis as string) || (cluster.root_cause_hypothesis as string) || "No root cause analysis yet"}
                evidence={[(cluster.rootCauseHypothesis as string) || (cluster.root_cause_hypothesis as string) || "No evidence collected"].filter(Boolean)}
                aiExplanation={(cluster.analysisNotes as string) || (cluster.analysis_notes as string) || cluster.summary as string || "Cluster formed from related signals."}
                signals={[]}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => handleTriage(cluster.id as string)}
                  disabled={triaging === cluster.id}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {triaging === cluster.id ? "Triaging…" : "Run Triage → Generate Draft"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-sm text-text-muted">No clusters formed yet.</p>
          <p className="text-xs text-text-muted mt-1">Inject signals first to form clusters.</p>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
