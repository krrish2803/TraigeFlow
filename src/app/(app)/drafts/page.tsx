"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ApprovalCard from "@/components/drafts/ApprovalCard";
import Pagination from "@/components/ui/Pagination";
import { useDraftsPaginated, approveDraftAction, rejectDraftAction } from "@/lib/use-data";
import type { SeverityLevel } from "@/lib/constants";

type FilterType = "all" | "pending" | "approved" | "rejected";

export default function DraftsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const { data, loading, error, setPage, page, refresh } = useDraftsPaginated(20);

  const drafts = data?.items ?? [];
  const filtered = filter === "all" ? drafts : drafts.filter((d) => d.approval_status === filter);

  const handleApprove = useCallback(async (draftId: string) => {
    const result = await approveDraftAction(draftId);
    if (!result.success) throw new Error(result.error || "Approval failed");
    await refresh();
  }, [refresh]);

  const handleReject = useCallback(async (draftId: string, reason?: string) => {
    const result = await rejectDraftAction(draftId, reason);
    if (!result.success) throw new Error(result.error || "Rejection failed");
    await refresh();
  }, [refresh]);

  const statusCounts = {
    all: data?.total ?? 0,
    pending: drafts.filter((d) => d.approval_status === "pending").length,
    approved: drafts.filter((d) => d.approval_status === "approved").length,
    rejected: drafts.filter((d) => d.approval_status === "rejected").length,
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full bg-warn/10 flex items-center justify-center mb-4">
          <span className="text-warn text-xl">!</span>
        </div>
        <p className="text-sm text-text-secondary mb-2">Failed to load drafts</p>
        <p className="text-xs text-text-muted mb-4">{error}</p>
        <button onClick={() => setPage(page)} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {([
          { label: "All", value: "all" as const },
          { label: `Pending (${statusCounts.pending})`, value: "pending" as const },
          { label: `Approved (${statusCounts.approved})`, value: "approved" as const },
          { label: `Rejected (${statusCounts.rejected})`, value: "rejected" as const },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-primary text-white"
                : "bg-elevated/50 text-text-secondary hover:text-text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
        {data && data.total > 0 && (
          <span className="text-xs text-text-muted ml-2">Page {data.page} of {data.totalPages}</span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {loading ? (
          <div className="text-center py-16">
            <div className="space-y-3 max-w-2xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-elevated/30 animate-pulse" />
              ))}
            </div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((draft, i) => (
              <motion.div
                key={draft.id as string}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ delay: i * 0.05 }}
              >
                <ApprovalCard
                  id={draft.id as string}
                  issueId={draft.identifier as string}
                  title={draft.title as string}
                  severity={(draft.severity || "medium") as SeverityLevel}
                  area={(draft.ownerSuggestion as string) || (draft.suggested_owner as string) || "Unknown"}
                  releaseRisk={(draft.release_risk as "block" | "caution" | "safe") || (draft.releaseRisk as "block" | "caution" | "safe") || "safe"}
                  summary={draft.summary as string}
                  reproSteps={draft.reproductionSteps as string || draft.repro_steps as string}
                  expectedActual={[draft.expected_behavior as string || draft.expectedBehavior as string, draft.actual_behavior as string || draft.actualBehavior as string].filter(Boolean).join("\n\n")}
                  suggestedOwner={draft.ownerSuggestion as string || draft.suggested_owner as string}
                  confidenceScores={{
                    summary: (draft.title_confidence as number) || 0.5,
                    reproSteps: (draft.repro_confidence as number) || 0.5,
                    expectedActual: (draft.area_confidence as number) || 0.5,
                    suggestedOwner: (draft.area_confidence as number) || 0.5,
                  }}
                  status={(draft.approval_status as "pending" | "approved" | "rejected") || (draft.approvalStatus as "pending" | "approved" | "rejected") || "pending"}
                  githubIssueRef={draft.githubIssueRef as string || draft.github_issue_url as string}
                  jiraIssueRef={draft.jiraIssueRef as string}
                  evidence={(draft.evidence as Array<{ type: string; description: string; confidence: number; details?: string }>) || undefined}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-text-muted">No drafts in this category.</p>
            <p className="text-xs text-text-muted mt-1">
              {filter === "pending" ? "Create clusters and run triage to generate drafts." : ""}
            </p>
          </div>
        )}
      </AnimatePresence>

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
