import type { Signal, WorkflowInput, WorkflowResult } from "./types";
import { getStore } from "./store";
import {
  runIntakeAgent,
  runClassificationAgent,
  runSimilarityAgent,
  runTriageAgent,
  runDraftAgent,
  runReviewAgent,
  runReleaseRiskAgent,
} from "./agents/index";
import { createGithubIssue } from "./surfaces/github";
import { createJiraIssue } from "./surfaces/jira";
import { postSlackMessage } from "./surfaces/slack";

// ─── A. ingestSignalWorkflow ──────────────────────────────────────────
// Purpose: Convert raw intake event into a stored normalized signal.
// Only runs IntakeAgent — no classification, similarity, or triage.
export async function ingestSignalWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  const store = getStore();
  const signal = input.signalId ? store.getSignal(input.signalId) : null;
  if (!signal) return { success: false, workflow: "ingest", status: "failed", error: "Signal not found" };

  try {
    const intakeResult = await runIntakeAgent({
      source: signal.source,
      sourceMessageId: signal.sourceMessageId,
      body: signal.body,
      author: signal.author,
      channel: signal.channel,
    });

    if (intakeResult.type === "noise") {
      store.updateSignal(signal.id, {
        status: "noise",
        label: "noise",
        evidence: [...signal.evidence, ...intakeResult.evidence],
      });
      store.addActivity({
        type: "ingest", actor: "Intake Agent",
        description: `Classified signal "${signal.title}" as noise (${intakeResult.noiseReason})`,
        entityType: "signal", entityId: signal.id,
      });
      return { success: true, workflow: "ingest", status: "noise", outputs: { intake: intakeResult } };
    }

    store.updateSignal(signal.id, {
      productArea: intakeResult.productArea ?? undefined,
      status: "pending",
      evidence: [...signal.evidence, ...intakeResult.evidence],
    });
    store.addActivity({
      type: "ingest", actor: "Intake Agent",
      description: `Ingested and cleaned signal from ${signal.source}`,
      entityType: "signal", entityId: signal.id,
    });

    return {
      success: true,
      workflow: "ingest",
      status: "completed",
      outputs: { signalId: signal.id, intake: intakeResult },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    store.addActivity({
      type: "error", actor: "System",
      description: `Ingest workflow failed: ${msg}`,
      entityType: "signal", entityId: signal.id,
    });
    return { success: false, workflow: "ingest", status: "failed", error: msg };
  }
}

// ─── B. triageSignalWorkflow ───────────────────────────────────────────
// Purpose: Turn a signal into a clustered, triaged draft.
// Runs: ClassificationAgent → SimilarityAgent → TriageAgent → DraftAgent → ReviewAgent.
// Draft enters awaiting_approval state if review passes.
export async function triageSignalWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  const store = getStore();
  const signalId = input.signalId;
  if (!signalId) return { success: false, workflow: "triage", status: "failed", error: "Signal ID required" };

  const signal = store.getSignal(signalId);
  if (!signal) return { success: false, workflow: "triage", status: "failed", error: `Signal ${signalId} not found` };

  try {
    // 1. ClassificationAgent
    const classificationResult = await runClassificationAgent({
      cleanedText: signal.body,
      source: signal.source,
    });

    store.updateSignal(signal.id, {
      label: classificationResult.label,
      severity: classificationResult.urgency,
      productArea: classificationResult.productArea,
      status: "classified",
      evidence: [...(store.getSignal(signal.id)?.evidence ?? []), ...classificationResult.evidence],
    });
    store.addActivity({
      type: "triage", actor: "Classify Agent",
      description: `Classified signal "${signal.title}" as ${classificationResult.label} (${classificationResult.urgency})`,
      entityType: "signal", entityId: signal.id,
    });

    // If noise, skip triage
    if (classificationResult.label === "noise") {
      store.updateSignal(signal.id, { status: "noise" });
      return { success: true, workflow: "triage", status: "noise", outputs: { classification: classificationResult } };
    }

    // 2. SimilarityAgent
    const allSignals = store.getSignals().filter((s) => s.id !== signal.id && s.status !== "noise");
    const similarityResult = runSimilarityAgent({
      signal: { ...signal, body: signal.body },
      allSignals,
    });

    store.updateSignal(signal.id, {
      evidence: [...(store.getSignal(signal.id)?.evidence ?? []), ...similarityResult.evidence],
    });

    let clusterId: string;
    if (similarityResult.existingClusterId) {
      clusterId = similarityResult.existingClusterId;
      store.updateSignal(signal.id, { relatedClusterId: clusterId, status: "clustered" });
      const cluster = store.getCluster(clusterId);
      if (cluster) {
        store.updateCluster(cluster.id, {
          signalIds: [...cluster.signalIds, signal.id],
          lastSeen: new Date().toISOString(),
        });
        recalculateClusterSeverity(cluster.id);
      }
      store.addActivity({
        type: "triage", actor: "Similarity Agent",
        description: `Merged signal "${signal.title}" into existing cluster`,
        entityType: "signal", entityId: signal.id,
      });
    } else {
      const newCluster = store.createCluster({
        canonicalTitle: signal.title,
        summary: classificationResult.label === "bug"
          ? `Bug report: ${signal.body.slice(0, 200)}`
          : signal.body.slice(0, 200),
        signalIds: [signal.id],
        sourceTypes: [signal.source],
        severity: classificationResult.urgency,
        severityScore: classificationResult.urgency === "critical" ? 8
          : classificationResult.urgency === "high" ? 6
          : classificationResult.urgency === "medium" ? 4 : 2,
        confidence: classificationResult.classificationConfidence,
        productArea: classificationResult.productArea,
        status: "open",
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
      clusterId = newCluster.id;
      store.updateSignal(signal.id, { relatedClusterId: clusterId, status: "clustered" });
      store.addActivity({
        type: "triage", actor: "Similarity Agent",
        description: `Created new cluster "${newCluster.canonicalTitle}" for signal`,
        entityType: "signal", entityId: signal.id,
      });
    }

    // 3. TriageAgent
    const cluster = store.getCluster(clusterId)!;
    const signalsInCluster = cluster.signalIds.map((id) => store.getSignal(id)).filter(Boolean) as Signal[];
    const allText = signalsInCluster.map((s) => s.body).join(" ");

    const triageResult = await runTriageAgent({
      signalCount: signalsInCluster.length,
      sourceTypes: cluster.sourceTypes,
      allText,
      productArea: cluster.productArea,
    });

    store.updateCluster(clusterId, {
      severity: triageResult.severity,
      severityScore: triageResult.severityScore,
      confidence: triageResult.confidence,
      rootCauseHypothesis: triageResult.rootCauseHypothesis,
      releaseRisk: triageResult.releaseRisk,
      affectedModules: triageResult.affectedModules,
      status: "draft_generated",
    });
    store.addActivity({
      type: "triage", actor: "Triage Agent",
      description: `Triaged cluster "${cluster.canonicalTitle}": ${triageResult.severity} (${triageResult.severityScore}/10), risk: ${triageResult.releaseRisk}`,
      entityType: "cluster", entityId: clusterId,
    });

    // 4. DraftAgent
    const draftResult = await runDraftAgent({
      signals: signalsInCluster.map((s) => ({ source: s.source, body: s.body, author: s.author })),
      rootCauseHypothesis: triageResult.rootCauseHypothesis,
      severity: triageResult.severity,
      severityScore: triageResult.severityScore,
      releaseRisk: triageResult.releaseRisk,
      releaseRiskReason: triageResult.releaseRiskReason,
      affectedModules: triageResult.affectedModules,
      confidence: triageResult.confidence,
      productArea: cluster.productArea,
    });

    const draft = store.createDraft({
      clusterId,
      identifier: draftResult.identifier,
      title: draftResult.issue.title,
      summary: draftResult.issue.summary,
      reproductionSteps: draftResult.issue.reproSteps,
      expectedBehavior: draftResult.issue.expectedBehavior,
      actualBehavior: draftResult.issue.actualBehavior,
      severity: triageResult.severity,
      confidence: triageResult.confidence,
      ownerSuggestion: draftResult.issue.suggestedOwnerArea,
      releaseRisk: triageResult.releaseRisk,
      releaseRiskReason: triageResult.releaseRiskReason,
      approvalStatus: "pending",
      evidence: draftResult.evidence,
    });

    store.addActivity({
      type: "triage", actor: "Draft Agent",
      description: `Draft created: "${draftResult.issue.title}" (${draftResult.identifier})`,
      entityType: "cluster", entityId: clusterId,
    });

    // 5. ReviewAgent — quality gate before approval
    const reviewResult = runReviewAgent({ draft });

    if (!reviewResult.approved) {
      store.updateDraft(draft.id, { approvalStatus: "needs_review", evidence: [...draft.evidence, ...reviewResult.evidence] });
      store.addActivity({
        type: "triage", actor: "Review Agent",
        description: `Draft "${draftResult.issue.title}" failed review: ${reviewResult.reviewReason}`,
        entityType: "draft", entityId: draft.id,
        metadata: { missingFields: reviewResult.missingFields },
      });
      return {
        success: true,
        workflow: "triage",
        status: "needs_review",
        outputs: { draftId: draft.id, clusterId, triage: triageResult, draft: draftResult, review: reviewResult },
      };
    }

    store.addActivity({
      type: "triage", actor: "Review Agent",
      description: `Draft "${draftResult.issue.title}" passed review`,
      entityType: "draft", entityId: draft.id,
    });

    // 6. Draft enters awaiting_approval state
    store.addActivity({
      type: "draft_created", actor: "Draft Agent",
      description: `Draft "${draftResult.issue.title}" generated from cluster "${cluster.canonicalTitle}" and awaiting approval`,
      entityType: "draft", entityId: draft.id,
      metadata: { identifier: draftResult.identifier, severity: triageResult.severity, releaseRisk: triageResult.releaseRisk },
    });

    return {
      success: true,
      workflow: "triage",
      status: "awaiting_approval",
      outputs: { draftId: draft.id, clusterId, triage: triageResult, draft: draftResult, review: reviewResult },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    store.addActivity({
      type: "error", actor: "System",
      description: `Triage workflow failed for signal ${signalId}: ${msg}`,
      entityType: "signal", entityId: signalId,
    });
    return { success: false, workflow: "triage", status: "failed", error: msg };
  }
}

// ─── C. approveDraftWorkflow ──────────────────────────────────────────
// Purpose: Human-approved draft becomes downstream engineering action.
// Creates Approval entity in Lemma state, creates GitHub/Jira issues,
// posts Slack summary, updates draft and cluster state.
export async function approveDraftWorkflow(draftId: string, approver = "User"): Promise<WorkflowResult> {
  const store = getStore();
  const draft = store.getDraft(draftId);
  if (!draft) return { success: false, workflow: "approve", status: "failed", error: `Draft ${draftId} not found` };

  try {
    // Verify draft is in awaiting_approval state
    if (draft.approvalStatus !== "pending") {
      return {
        success: false, workflow: "approve", status: "failed",
        error: `Draft ${draftId} is not pending approval (status: ${draft.approvalStatus})`,
      };
    }

    // Check for duplicate approval
    const existingApproval = store.getApprovalByDraft(draftId);
    if (existingApproval && existingApproval.status === "approved") {
      return {
        success: false, workflow: "approve", status: "failed",
        error: `Draft ${draftId} already approved`,
      };
    }

    // Create the Approval entity in Lemma state (approval gate)
    const approval = store.createApproval({
      draftId,
      status: "approved",
      approver,
    });

    // Create GitHub issue
    let githubRef: string | undefined;
    try {
      const githubResult = await createGithubIssue({
        title: draft.title,
        summary: draft.summary,
        reproSteps: draft.reproductionSteps,
        expectedBehavior: draft.expectedBehavior,
        actualBehavior: draft.actualBehavior,
        labels: [draft.severity, draft.releaseRisk],
        suggestedOwner: draft.ownerSuggestion,
      });
      githubRef = githubResult.refUrl;
      store.updateApproval(approval.id, { githubIssueRef: githubResult.refUrl });
      store.addActivity({
        type: "github_issue_created", actor: "GitHub Integration",
        description: `GitHub issue ${githubResult.ref} created: ${draft.title}`,
        entityType: "draft", entityId: draftId,
        metadata: { ref: githubResult.ref, refUrl: githubResult.refUrl, mock: githubResult.mock },
      });
    } catch (err) {
      store.addActivity({
        type: "github_issue_failed", actor: "GitHub Integration",
        description: `Failed to create GitHub issue: ${err instanceof Error ? err.message : String(err)}`,
        entityType: "draft", entityId: draftId,
      });
    }

    // Create Jira issue
    let jiraRef: string | undefined;
    try {
      const jiraResult = await createJiraIssue({
        title: draft.title,
        summary: draft.summary,
        reproSteps: draft.reproductionSteps,
        expectedBehavior: draft.expectedBehavior,
        actualBehavior: draft.actualBehavior,
        severity: draft.severity,
        suggestedOwner: draft.ownerSuggestion,
      });
      jiraRef = jiraResult.refUrl;
      store.updateApproval(approval.id, { jiraIssueRef: jiraResult.refUrl });
      store.addActivity({
        type: "jira_issue_created", actor: "Jira Integration",
        description: `Jira issue ${jiraResult.ref} created: ${draft.title}`,
        entityType: "draft", entityId: draftId,
        metadata: { ref: jiraResult.ref, refUrl: jiraResult.refUrl, mock: jiraResult.mock },
      });
    } catch (err) {
      store.addActivity({
        type: "jira_issue_failed", actor: "Jira Integration",
        description: `Failed to create Jira issue: ${err instanceof Error ? err.message : String(err)}`,
        entityType: "draft", entityId: draftId,
      });
    }

    // Update draft state
    store.updateDraft(draftId, {
      approvalStatus: "approved",
      githubIssueRef: githubRef,
      jiraIssueRef: jiraRef,
    });

    // Update cluster state
    const cluster = draft.clusterId ? store.getCluster(draft.clusterId) : null;
    if (cluster) {
      store.updateCluster(cluster.id, { status: "resolved" });
    }

    // Log approval
    store.addActivity({
      type: "draft_approved", actor: approver,
      description: `Draft "${draft.title}" approved${githubRef ? `. GitHub: ${githubRef}` : ""}${jiraRef ? `. Jira: ${jiraRef}` : ""}`,
      entityType: "draft", entityId: draftId,
      metadata: { githubRef, jiraRef, approvalId: approval.id },
    });

    // Post Slack notification (non-blocking)
    try {
      await postSlackMessage({
        channel: process.env.SLACK_ACTIVITY_CHANNEL || "#eng-activity",
        text: `✅ *${draft.title}* (${draft.identifier}) approved and filed. ${githubRef ? `GitHub: ${githubRef}` : ""} ${jiraRef ? `Jira: ${jiraRef}` : ""}`,
      });
    } catch {
      // Slack posting is optional
    }

    return {
      success: true,
      workflow: "approve",
      status: "approved",
      outputs: { githubRef, jiraRef, approvalId: approval.id },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, workflow: "approve", status: "failed", error: msg };
  }
}

// ─── D. rejectDraftWorkflow ────────────────────────────────────────────
// Purpose: Human rejection updates state cleanly and creates Approval entity.
export async function rejectDraftWorkflow(draftId: string, reviewer = "User", reason = "Rejected by reviewer"): Promise<WorkflowResult> {
  const store = getStore();
  const draft = store.getDraft(draftId);
  if (!draft) return { success: false, workflow: "reject", status: "failed", error: `Draft ${draftId} not found` };

  try {
    // Verify draft is in awaiting_approval state
    if (draft.approvalStatus !== "pending") {
      return {
        success: false, workflow: "reject", status: "failed",
        error: `Draft ${draftId} is not pending approval (status: ${draft.approvalStatus})`,
      };
    }

    // Create the Approval entity in Lemma state tracking the rejection
    store.createApproval({
      draftId,
      status: "rejected",
      approver: reviewer,
      reason,
    });

    // Update draft state
    store.updateDraft(draftId, {
      approvalStatus: "rejected",
      reviewReason: reason,
    });

    // Log rejection
    store.addActivity({
      type: "draft_rejected", actor: reviewer,
      description: `Draft "${draft.title}" rejected: ${reason}`,
      entityType: "draft", entityId: draftId,
    });

    return { success: true, workflow: "reject", status: "rejected" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, workflow: "reject", status: "failed", error: msg };
  }
}

// ─── E. recomputeReleaseSummaryWorkflow ────────────────────────────────
// Purpose: Recalculate product release risk from open approved work.
// Runs ReleaseRiskAgent to summarize highlights.
export async function recomputeReleaseSummaryWorkflow(): Promise<WorkflowResult> {
  const store = getStore();

  try {
    const drafts = store.getDrafts();
    const clusters = store.getClusters();

    const blockItems = drafts.filter((d) => d.releaseRisk === "block" && d.approvalStatus === "pending");
    const cautionItems = drafts.filter((d) => d.releaseRisk === "caution" && d.approvalStatus === "pending");
    const safeItems = drafts.filter((d) => d.releaseRisk === "safe" && d.approvalStatus === "pending");
    const approvedItems = drafts.filter((d) => d.approvalStatus === "approved");

    // Run ReleaseRiskAgent
    const riskOutput = runReleaseRiskAgent({
      drafts,
      blockCount: blockItems.length,
      cautionCount: cautionItems.length,
      safeCount: safeItems.length,
      approvedCount: approvedItems.length,
    });

    // Persist release summary in Lemma data
    const release = store.createRelease({
      riskLevel: riskOutput.riskLevel,
      riskScore: riskOutput.riskScore,
      blockCount: blockItems.length,
      cautionCount: cautionItems.length,
      safeCount: safeItems.length,
      totalDrafts: drafts.length,
      totalClusters: clusters.length,
      highlights: riskOutput.highlights,
      unresolvedDraftIds: [...blockItems, ...cautionItems].map((d) => d.id),
    });

    store.addActivity({
      type: "release_digest", actor: "Release Risk Agent",
      description: `Release digest generated: ${riskOutput.riskLevel.toUpperCase()} (${riskOutput.riskScore}/100)`,
      entityType: "release", entityId: release.id,
      metadata: { riskLevel: riskOutput.riskLevel, riskScore: riskOutput.riskScore, highlights: riskOutput.highlights },
    });

    return {
      success: true,
      workflow: "release-digest",
      status: "completed",
      outputs: { digestId: release.id, riskOutput },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, workflow: "release-digest", status: "failed", error: msg };
  }
}

// ─── Combined pipeline for backward compatibility ──────────────────────
// Runs ingest + triage sequentially. Used by seed/demo for a full pipeline.
export async function runFullPipelineWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  const ingestResult = await ingestSignalWorkflow(input);
  if (!ingestResult.success || ingestResult.status === "noise") return ingestResult;

  const triageResult = await triageSignalWorkflow({ signalId: input.signalId });
  return triageResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function recalculateClusterSeverity(clusterId: string): void {
  const store = getStore();
  const cluster = store.getCluster(clusterId);
  if (!cluster) return;

  const signals = cluster.signalIds.map((id) => store.getSignal(id)).filter(Boolean) as Signal[];
  const scores = signals.map((s) =>
    s.severity === "critical" ? 9 : s.severity === "high" ? 7 : s.severity === "medium" ? 4 : 2
  );

  const maxScore = Math.max(...scores, 0);
  const severity = maxScore >= 9 ? "critical" as const : maxScore >= 7 ? "high" as const : maxScore >= 4 ? "medium" as const : "low" as const;
  const confidence = Math.min(0.5 + signals.length * 0.1, 0.95);

  store.updateCluster(clusterId, {
    severity,
    severityScore: maxScore,
    confidence,
    signalIds: cluster.signalIds,
    sourceTypes: Array.from(new Set([...cluster.sourceTypes, ...signals.map((s) => s.source)])),
  });
}
