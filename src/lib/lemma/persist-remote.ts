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

const SCHEMA = `
CREATE TABLE IF NOT EXISTS store_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  snapshot TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

async function getClient(): Promise<import("@libsql/client").Client | null> {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) return null;
  const { createClient } = await import("@libsql/client");
  return createClient({ url, authToken: token });
}

async function ensureTable(): Promise<void> {
  const client = await getClient();
  if (!client) return;
  try {
    await client.execute(SCHEMA);
    await client.execute(
      "INSERT OR IGNORE INTO store_state (id, snapshot) VALUES (1, '{}')",
    );
  } finally {
    client.close();
  }
}

async function loadSnapshot(): Promise<StoreSnapshot | null> {
  const client = await getClient();
  if (!client) return null;
  try {
    const rs = await client.execute("SELECT snapshot FROM store_state WHERE id = 1");
    if (rs.rows.length === 0) return null;
    const raw = rs.rows[0].snapshot as string;
    return JSON.parse(raw) as StoreSnapshot;
  } catch (err) {
    console.warn("[DB] Failed to load from Turso:", err);
    return null;
  } finally {
    client.close();
  }
}

async function saveSnapshot(snapshot: StoreSnapshot): Promise<void> {
  const client = await getClient();
  if (!client) return;
  try {
    await client.execute({
      sql: "UPDATE store_state SET snapshot = ?, updated_at = datetime('now') WHERE id = 1",
      args: [JSON.stringify(snapshot)],
    });
  } catch (err) {
    console.error("[DB] Failed to persist to Turso:", err);
  } finally {
    client.close();
  }
}

export function persistRemoteStore(store: DataStore): DataStore {
  function hydrate(data: StoreSnapshot) {
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
  }

  function snapshot(): StoreSnapshot {
    return {
      signals: Object.fromEntries(store._signals),
      clusters: Object.fromEntries(store._clusters),
      drafts: Object.fromEntries(store._drafts),
      approvals: Object.fromEntries(store._approvals),
      activities: Object.fromEntries(store._activities),
      releases: Object.fromEntries(store._releases),
    };
  }

  // Fire-and-forget async init
  (async () => {
    try {
      await ensureTable();
      const data = await loadSnapshot();
      if (data) {
        hydrate(data);
        console.log(`[DB] Loaded ${Object.keys(data.signals).length} signals, ${Object.keys(data.clusters).length} clusters, ${Object.keys(data.drafts).length} drafts from Turso`);
      } else {
        console.log("[DB] No existing state found in Turso, starting fresh");
      }
    } catch (err) {
      console.warn("[DB] Turso init failed, running in-memory only:", err);
    }
  })();

  function persist<T>(fn: T): T {
    const f = fn as (...args: unknown[]) => unknown;
    return ((...args: unknown[]) => {
      const result = f(...args);
      saveSnapshot(snapshot()).catch(() => {});
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
