import type { Signal, Cluster, Draft, Approval, ActivityItem, ReleaseSummary } from "./types";
import { persistStore } from "./persist";

export interface DataStore {
  _signals: Map<string, Signal>;
  _clusters: Map<string, Cluster>;
  _drafts: Map<string, Draft>;
  _approvals: Map<string, Approval>;
  _activities: Map<string, ActivityItem>;
  _releases: Map<string, ReleaseSummary>;

  getSignals(): Signal[];
  getSignal(id: string): Signal | null;
  createSignal(data: Omit<Signal, "id" | "createdAt" | "updatedAt">): Signal;
  updateSignal(id: string, data: Partial<Signal>): Signal;

  getClusters(): Cluster[];
  getCluster(id: string): Cluster | null;
  createCluster(data: Omit<Cluster, "id" | "createdAt" | "updatedAt">): Cluster;
  updateCluster(id: string, data: Partial<Cluster>): Cluster;

  getDrafts(): Draft[];
  getDraft(id: string): Draft | null;
  createDraft(data: Omit<Draft, "id" | "createdAt" | "updatedAt">): Draft;
  updateDraft(id: string, data: Partial<Draft>): Draft;

  getApprovals(): Approval[];
  getApproval(id: string): Approval | null;
  getApprovalByDraft(draftId: string): Approval | null;
  createApproval(data: Omit<Approval, "id" | "timestamp">): Approval;
  updateApproval(id: string, data: Partial<Approval>): Approval;

  getActivities(): ActivityItem[];
  addActivity(data: Omit<ActivityItem, "id" | "timestamp">): ActivityItem;

  getReleases(): ReleaseSummary[];
  getRelease(id: string): ReleaseSummary | null;
  createRelease(data: Omit<ReleaseSummary, "id" | "generatedAt">): ReleaseSummary;

  clear(): void;
}

function makeId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export function createMemoryStore(): DataStore {
  const signals = new Map<string, Signal>();
  const clusters = new Map<string, Cluster>();
  const drafts = new Map<string, Draft>();
  const approvals = new Map<string, Approval>();
  const activities = new Map<string, ActivityItem>();
  const releases = new Map<string, ReleaseSummary>();

  const store: DataStore = {
    _signals: signals,
    _clusters: clusters,
    _drafts: drafts,
    _approvals: approvals,
    _activities: activities,
    _releases: releases,

    getSignals(): Signal[] {
      return Array.from(signals.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    getSignal(id: string): Signal | null {
      return signals.get(id) ?? null;
    },
    createSignal(data): Signal {
      const signal: Signal = {
        ...data,
        id: makeId(),
        createdAt: now(),
        updatedAt: now(),
        evidence: data.evidence ?? [],
      };
      signals.set(signal.id, signal);
      return signal;
    },
    updateSignal(id, data): Signal {
      const existing = signals.get(id);
      if (!existing) throw new Error(`Signal ${id} not found`);
      const updated = { ...existing, ...data, updatedAt: now() };
      signals.set(id, updated);
      return updated;
    },

    getClusters(): Cluster[] {
      return Array.from(clusters.values()).sort(
        (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );
    },
    getCluster(id: string): Cluster | null {
      return clusters.get(id) ?? null;
    },
    createCluster(data): Cluster {
      const cluster: Cluster = {
        ...data,
        id: makeId(),
        createdAt: now(),
        updatedAt: now(),
      };
      clusters.set(cluster.id, cluster);
      return cluster;
    },
    updateCluster(id, data): Cluster {
      const existing = clusters.get(id);
      if (!existing) throw new Error(`Cluster ${id} not found`);
      const updated = { ...existing, ...data, updatedAt: now() };
      clusters.set(id, updated);
      return updated;
    },

    getDrafts(): Draft[] {
      return Array.from(drafts.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    getDraft(id: string): Draft | null {
      return drafts.get(id) ?? null;
    },
    createDraft(data): Draft {
      const draft: Draft = {
        ...data,
        id: makeId(),
        createdAt: now(),
        updatedAt: now(),
        evidence: data.evidence ?? [],
      };
      drafts.set(draft.id, draft);
      return draft;
    },
    updateDraft(id, data): Draft {
      const existing = drafts.get(id);
      if (!existing) throw new Error(`Draft ${id} not found`);
      const updated = { ...existing, ...data, updatedAt: now() };
      drafts.set(id, updated);
      return updated;
    },

    getApprovals(): Approval[] {
      return Array.from(approvals.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    getApproval(id: string): Approval | null {
      return approvals.get(id) ?? null;
    },
    getApprovalByDraft(draftId: string): Approval | null {
      return Array.from(approvals.values()).find((a) => a.draftId === draftId) ?? null;
    },
    createApproval(data): Approval {
      const approval: Approval = {
        ...data,
        id: makeId(),
        timestamp: now(),
      };
      approvals.set(approval.id, approval);
      return approval;
    },
    updateApproval(id, data): Approval {
      const existing = approvals.get(id);
      if (!existing) throw new Error(`Approval ${id} not found`);
      const updated = { ...existing, ...data };
      approvals.set(id, updated);
      return updated;
    },

    getActivities(): ActivityItem[] {
      return Array.from(activities.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    addActivity(data): ActivityItem {
      const item: ActivityItem = {
        ...data,
        id: makeId(),
        timestamp: now(),
      };
      activities.set(item.id, item);
      return item;
    },

    getReleases(): ReleaseSummary[] {
      return Array.from(releases.values()).sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
    },
    getRelease(id: string): ReleaseSummary | null {
      return releases.get(id) ?? null;
    },
    createRelease(data): ReleaseSummary {
      const summary: ReleaseSummary = {
        ...data,
        id: makeId(),
        generatedAt: now(),
      };
      releases.set(summary.id, summary);
      return summary;
    },

    clear(): void {
      signals.clear();
      clusters.clear();
      drafts.clear();
      approvals.clear();
      activities.clear();
      releases.clear();
    },
  };

  return store;
}

export function createPersistentStore(dbPath?: string): DataStore {
  const memory = createMemoryStore();
  if (typeof window !== "undefined") {
    return memory;
  }
  if (process.env.TURSO_DATABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { persistRemoteStore } = require("./persist-remote");
    return persistRemoteStore(memory);
  }
  const path = dbPath || process.env.DATABASE_PATH || "./data/store.json";
  return persistStore(memory, path);
}

const globalForStore = globalThis as unknown as { __signal2fix_store?: DataStore };

export function getStore(): DataStore {
  if (!globalForStore.__signal2fix_store) {
    globalForStore.__signal2fix_store = createPersistentStore();
  }
  return globalForStore.__signal2fix_store;
}
