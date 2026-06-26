import fs from "fs";
import path from "path";
import type { DataStore } from "./store";
import type { Signal, Cluster, Draft, Approval, ActivityItem, ReleaseSummary } from "./types";

interface StoreSnapshot {
  signals: Record<string, Signal>;
  clusters: Record<string, Cluster>;
  drafts: Record<string, Draft>;
  approvals: Record<string, Approval>;
  activities: Record<string, ActivityItem>;
  releases: Record<string, ReleaseSummary>;
}

export function persistStore(store: DataStore, dbPath: string): DataStore {
  const resolved = path.resolve(dbPath);
  const dir = path.dirname(resolved);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  function load(): StoreSnapshot | null {
    try {
      if (!fs.existsSync(resolved)) return null;
      const raw = fs.readFileSync(resolved, "utf-8");
      const data = JSON.parse(raw) as StoreSnapshot;
      for (const key of ["signals", "clusters", "drafts", "approvals", "activities", "releases"] as const) {
        const obj = data[key];
        const mapKey = `_${key}` as const;
        if (obj) {
          store[mapKey].clear();
          for (const [id, val] of Object.entries(obj)) {
            store[mapKey].set(id, val as never);
          }
        }
      }
      return data;
    } catch (err) {
      console.warn(`[DB] Failed to load from ${resolved}:`, err);
      return null;
    }
  }

  function save() {
    try {
      const snapshot: StoreSnapshot = {
        signals: Object.fromEntries(store._signals),
        clusters: Object.fromEntries(store._clusters),
        drafts: Object.fromEntries(store._drafts),
        approvals: Object.fromEntries(store._approvals),
        activities: Object.fromEntries(store._activities),
        releases: Object.fromEntries(store._releases),
      };
      const tmp = `${resolved}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(snapshot, null, 2), "utf-8");
      fs.renameSync(tmp, resolved);
    } catch (err) {
      console.error(`[DB] Failed to persist to ${resolved}:`, err);
    }
  }

  const existing = load();
  if (existing) {
    console.log(`[DB] Loaded ${Object.keys(existing.signals).length} signals, ${Object.keys(existing.clusters).length} clusters, ${Object.keys(existing.drafts).length} drafts from ${resolved}`);
  }

  function persist<T>(fn: T): T {
    const f = fn as (...args: unknown[]) => unknown;
    return ((...args: unknown[]) => {
      const result = f(...args);
      save();
      return result;
    }) as unknown as T;
  }

  return {
    ...store,
    createSignal: persist(store.createSignal),
    updateSignal: persist(store.updateSignal),
    createCluster: persist(store.createCluster),
    updateCluster: persist(store.updateCluster),
    createDraft: persist(store.createDraft),
    updateDraft: persist(store.updateDraft),
    createApproval: persist(store.createApproval),
    updateApproval: persist(store.updateApproval),
    addActivity: persist(store.addActivity),
    createRelease: persist(store.createRelease),
    clear: persist(store.clear),
  };
}
