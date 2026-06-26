import {
  type Signal,
  type Cluster,
  type Draft,
  type Approval,
  type ActivityItem,
  type ReleaseSummary,
  type SignalSource,
  type WorkflowResult,
} from "./types";
import { getStore } from "./store";
import {
  ingestSignalWorkflow,
  triageSignalWorkflow,
  approveDraftWorkflow,
  rejectDraftWorkflow,
  recomputeReleaseSummaryWorkflow,
  runFullPipelineWorkflow,
} from "./workflows";

export function createLemmaClient() {
  const store = getStore();

  return {
    store,

    // ── Signal lifecycle ──────────────────────────────────────────────
    // Creates a signal record and runs ingest workflow (intake only).
    // Call runTriage separately to classify, cluster, and draft.
    ingestSignal(data: {
      source: SignalSource;
      sourceMessageId?: string;
      body: string;
      author: string;
      channel?: string;
      title?: string;
      timestamp?: string;
      externalUrl?: string;
      rawType?: string;
      productArea?: string;
      metadata?: Record<string, unknown>;
      rawPayload?: Record<string, unknown>;
    }): Signal {
      const signal = store.createSignal({
        source: data.source,
        sourceMessageId: data.sourceMessageId || `gen-${Date.now()}`,
        title: data.title || data.body.slice(0, 80),
        body: data.body,
        author: data.author,
        channel: data.channel,
        timestamp: data.timestamp || new Date().toISOString(),
        externalUrl: data.externalUrl,
        rawType: data.rawType,
        productArea: data.productArea,
        metadata: data.metadata,
        rawPayload: data.rawPayload,
        status: "pending",
        evidence: [],
      });

      // Fire-and-forget ingest workflow (just intake + persist)
      ingestSignalWorkflow({ signalId: signal.id }).then((result) => {
        if (!result.success) {
          store.addActivity({
            type: "error", actor: "System",
            description: `Ingest workflow failed: ${result.error}`,
            entityType: "signal", entityId: signal.id,
          });
        }
      });

      return signal;
    },

    // Full pipeline: ingest + triage in one call (for demo/seed use)
    runFullPipeline(signalId: string): Promise<WorkflowResult> {
      return runFullPipelineWorkflow({ signalId });
    },

    // Run triage pipeline (classify → similar → triage → draft → review)
    runTriage(signalId: string): Promise<WorkflowResult> {
      return triageSignalWorkflow({ signalId });
    },

    // Cluster-level triage (for retroactively triaging a cluster)
    runTriageOnCluster(clusterId: string): Promise<WorkflowResult> {
      const cluster = store.getCluster(clusterId);
      if (!cluster || cluster.signalIds.length === 0) {
        return Promise.resolve({ success: false, workflow: "triage", status: "failed", error: "Cluster empty or not found" });
      }
      const firstSignalId = cluster.signalIds[0];
      return triageSignalWorkflow({ signalId: firstSignalId });
    },

    // ── Approval gate in Lemma ────────────────────────────────────────
    // These create Approval entities in Lemma state — the UI only triggers them.
    approveDraft(draftId: string, approver = "User"): Promise<WorkflowResult> {
      return approveDraftWorkflow(draftId, approver);
    },

    rejectDraft(draftId: string, reason?: string, reviewer = "User"): Promise<WorkflowResult> {
      return rejectDraftWorkflow(draftId, reviewer, reason);
    },

    getApprovals(): Approval[] {
      return store.getApprovals();
    },

    getApprovalByDraft(draftId: string): Approval | null {
      return store.getApprovalByDraft(draftId);
    },

    // ── Release summary ────────────────────────────────────────────────
    generateReleaseDigest(): Promise<WorkflowResult> {
      return recomputeReleaseSummaryWorkflow();
    },

    // ── Read-only queries ──────────────────────────────────────────────
    getSignals(): Signal[] {
      return store.getSignals();
    },

    getSignalsPaginated(page: number, limit: number): { items: Signal[]; total: number; page: number; totalPages: number } {
      const all = store.getSignals();
      const total = all.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      return { items: all.slice(start, start + limit), total, page, totalPages };
    },

    getSignal(id: string): Signal | null {
      return store.getSignal(id);
    },

    getClusters(): Cluster[] {
      return store.getClusters();
    },

    getClustersPaginated(page: number, limit: number): { items: Cluster[]; total: number; page: number; totalPages: number } {
      const all = store.getClusters();
      const total = all.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      return { items: all.slice(start, start + limit), total, page, totalPages };
    },

    getCluster(id: string): Cluster | null {
      return store.getCluster(id);
    },

    getDrafts(): Draft[] {
      return store.getDrafts();
    },

    getDraftsPaginated(page: number, limit: number): { items: Draft[]; total: number; page: number; totalPages: number } {
      const all = store.getDrafts();
      const total = all.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      return { items: all.slice(start, start + limit), total, page, totalPages };
    },

    getDraft(id: string): Draft | null {
      return store.getDraft(id);
    },

    getActivities(): ActivityItem[] {
      return store.getActivities();
    },

    getActivitiesPaginated(page: number, limit: number): { items: ActivityItem[]; total: number; page: number; totalPages: number } {
      const all = store.getActivities();
      const total = all.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      return { items: all.slice(start, start + limit), total, page, totalPages };
    },

    getReleases(): ReleaseSummary[] {
      return store.getReleases();
    },

    getLastRelease(): ReleaseSummary | null {
      const releases = store.getReleases();
      return releases.length > 0 ? releases[0] : null;
    },

    getDashboard() {
      const signals = store.getSignals();
      const clusters = store.getClusters();
      const drafts = store.getDrafts();
      const activities = store.getActivities();

      return {
        totalSignals: signals.length,
        totalClusters: clusters.length,
        totalDrafts: drafts.length,
        pendingSignals: signals.filter((s) => s.status === "pending" || s.status === "classified").length,
        pendingDrafts: drafts.filter((d) => d.approvalStatus === "pending").length,
        criticalClusters: clusters.filter((c) => c.severity === "critical" || c.severityScore >= 7).length,
        riskScore: clusters.filter((c) => c.severity === "critical").length * 25,
        recentActivity: activities.slice(0, 10),
        recentDrafts: drafts.filter((d) => d.approvalStatus === "pending").slice(0, 3),
      };
    },

    getReleaseOverview() {
      const clusters = store.getClusters();
      const drafts = store.getDrafts();
      const lastRelease = this.getLastRelease();

      const blockItems = drafts.filter((d) => d.releaseRisk === "block");
      const cautionItems = drafts.filter((d) => d.releaseRisk === "caution");
      const safeItems = drafts.filter((d) => d.releaseRisk === "safe");

      const riskScore = blockItems.length * 10 + cautionItems.length * 5;
      const totalSignals = clusters.reduce((a, c) => a + c.signalIds.length, 0);

      return {
        clusters,
        drafts,
        lastDigest: lastRelease,
        blockCount: blockItems.length,
        cautionCount: cautionItems.length,
        safeCount: safeItems.length,
        riskScore: Math.min(riskScore, 100),
        totalSignals,
        totalClusters: clusters.length,
        totalDrafts: drafts.length,
      };
    },
  };
}

export type LemmaClient = ReturnType<typeof createLemmaClient>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForLemma = globalThis as any;

export function getLemmaClient(): LemmaClient {
  if (!globalForLemma.__signal2fix_lemma) {
    globalForLemma.__signal2fix_lemma = createLemmaClient();
  }
  return globalForLemma.__signal2fix_lemma;
}

export default getLemmaClient;
