export type SignalSource = "slack" | "gmail" | "github" | "jira";
export type SignalStatus = "pending" | "classified" | "clustered" | "noise" | "done";
export type SignalLabel = "bug" | "feature" | "question" | "noise" | "duplicate";
export type SeverityLevel = "critical" | "high" | "medium" | "low";
export type ReleaseRisk = "block" | "caution" | "safe";
export type DraftStatus = "pending" | "needs_review" | "approved" | "rejected";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface EvidenceItem {
  type: string;
  description: string;
  confidence: number;
  details?: string;
}

export interface Signal {
  id: string;
  source: SignalSource;
  sourceMessageId: string;
  title: string;
  body: string;
  author: string;
  channel?: string;
  timestamp: string;
  externalUrl?: string;
  rawType?: string;
  productArea?: string;
  label?: SignalLabel;
  labelConfidence?: number;
  severity?: SeverityLevel;
  severityScore?: number;
  status: SignalStatus;
  relatedClusterId?: string;
  evidence: EvidenceItem[];
  metadata?: Record<string, unknown>;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Cluster {
  id: string;
  canonicalTitle: string;
  summary: string;
  signalIds: string[];
  sourceTypes: SignalSource[];
  severity: SeverityLevel;
  severityScore: number;
  confidence: number;
  productArea?: string;
  rootCauseHypothesis?: string;
  releaseRisk?: ReleaseRisk;
  affectedModules?: string[];
  status: "open" | "draft_generated" | "resolved";
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  id: string;
  clusterId: string;
  identifier: string;
  title: string;
  summary: string;
  reproductionSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: SeverityLevel;
  confidence: number;
  ownerSuggestion: string;
  githubIssueRef?: string;
  jiraIssueRef?: string;
  releaseRisk: ReleaseRisk;
  releaseRiskReason?: string;
  approvalStatus: DraftStatus;
  reviewReason?: string;
  evidence: EvidenceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  draftId: string;
  status: ApprovalStatus;
  approver: string;
  reason?: string;
  timestamp: string;
  githubIssueRef?: string;
  jiraIssueRef?: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  timestamp: string;
  actor: string;
  description: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface ReleaseSummary {
  id: string;
  generatedAt: string;
  riskLevel: ReleaseRisk;
  riskScore: number;
  blockCount: number;
  cautionCount: number;
  safeCount: number;
  totalDrafts: number;
  totalClusters: number;
  highlights: string[];
  unresolvedDraftIds: string[];
  digestText?: string;
}

export interface WorkflowInput {
  signalId?: string;
  clusterId?: string;
  draftId?: string;
}

export interface WorkflowResult {
  success: boolean;
  workflow: string;
  status: string;
  outputs?: unknown;
  error?: string;
}

export interface AgentResult {
  agent: string;
  success: boolean;
  output: Record<string, unknown>;
  confidence: number;
  evidence: EvidenceItem[];
}
