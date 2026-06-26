import { getLemmaClient } from "./lemma/client";

const lemma = getLemmaClient();

export async function getSignals() {
  return lemma.getSignals();
}

export async function getSignalsPaginated(page: number, limit: number) {
  return lemma.getSignalsPaginated(page, limit);
}

export async function getSignal(id: string) {
  return lemma.getSignal(id);
}

export async function getClusters() {
  return lemma.getClusters();
}

export async function getClustersPaginated(page: number, limit: number) {
  return lemma.getClustersPaginated(page, limit);
}

export async function getDrafts() {
  return lemma.getDrafts();
}

export async function getDraftsPaginated(page: number, limit: number) {
  return lemma.getDraftsPaginated(page, limit);
}

export async function getActivity() {
  return lemma.getActivities();
}

export async function getActivityPaginated(page: number, limit: number) {
  return lemma.getActivitiesPaginated(page, limit);
}

export async function getReleases() {
  return lemma.getReleaseOverview();
}

export async function getDashboard() {
  return lemma.getDashboard();
}

export async function ingestSignal(data: {
  source: "slack" | "gmail" | "github" | "jira";
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
}) {
  return lemma.ingestSignal(data);
}

export async function approveDraft(draftId: string) {
  return lemma.approveDraft(draftId);
}

export async function rejectDraft(draftId: string, reason?: string) {
  return lemma.rejectDraft(draftId, reason);
}

export async function generateReleaseDigest() {
  return lemma.generateReleaseDigest();
}

export async function runTriage(clusterId: string) {
  return lemma.runTriageOnCluster(clusterId);
}

export { lemma };
