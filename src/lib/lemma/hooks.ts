"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type WorkflowStatus = "idle" | "running" | "success" | "error";

export interface WorkflowRunState {
  status: WorkflowStatus;
  result: Record<string, unknown> | null;
  error: string | null;
}

export interface RecordQuery {
  type: "signals" | "clusters" | "drafts" | "activity" | "releases" | "dashboard";
  id?: string;
  filters?: Record<string, string>;
  limit?: number;
  offset?: number;
}

// ─── 1. useWorkflowRun ──────────────────────────────────────────────────────
// Trigger a Lemma workflow and track its lifecycle.
// Usage: const { status, run, result, error } = useWorkflowRun("approve");

export function useWorkflowRun<T = Record<string, unknown>>(
  endpoint: string,
  options?: {
    onSuccess?: (result: T) => void;
    onError?: (error: string) => void;
  },
) {
  const [state, setState] = useState<WorkflowRunState>({
    status: "idle",
    result: null,
    error: null,
  });

  const run = useCallback(
    async (payload?: Record<string, unknown>) => {
      setState({ status: "running", result: null, error: null });
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload ? JSON.stringify(payload) : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Workflow failed: ${res.status} ${text}`);
        }
        const data = (await res.json()) as T;
        setState({ status: "success", result: data as unknown as Record<string, unknown>, error: null });
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const msg = (err as Error).message;
        setState({ status: "error", result: null, error: msg });
        options?.onError?.(msg);
        return null;
      }
    },
    [endpoint, options],
  );

  return { ...state, run } as const;
}

// ─── 2. useWorkflowRunWaitAssignments ───────────────────────────────────────
// Polls for pending workflow assignments (e.g. drafts needing approval).
// Usage: const { assignments, loading } = useWorkflowRunWaitAssignments();

export interface WorkflowAssignment {
  id: string;
  type: "draft_approval" | "triage_review" | "release_review";
  title: string;
  summary: string;
  entityType: string;
  entityId: string;
  priority: string;
  createdAt: string;
  actions: Array<{
    label: string;
    endpoint: string;
    payload: Record<string, unknown>;
  }>;
}

export function useWorkflowRunWaitAssignments(options?: {
  pollIntervalMs?: number;
  maxItems?: number;
}) {
  const { pollIntervalMs = 15000, maxItems = 20 } = options || {};
  const [assignments, setAssignments] = useState<WorkflowAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      const [draftsRes, clustersRes] = await Promise.all([
        fetch("/api/drafts"),
        fetch("/api/clusters"),
      ]);
      const drafts = (await draftsRes.json()).drafts || [];
      const clusters = (await clustersRes.json()).clusters || [];

      const items: WorkflowAssignment[] = [];

      for (const d of drafts) {
        if (d.approvalStatus === "pending") {
          items.push({
            id: `draft-${d.id}`,
            type: "draft_approval",
            title: d.title || "Untitled draft",
            summary: d.summary?.slice(0, 200) || "",
            entityType: "draft",
            entityId: d.id,
            priority: d.severity || "medium",
            createdAt: d.createdAt,
            actions: [
              {
                label: "Approve",
                endpoint: "/api/drafts",
                payload: { action: "approve", draftId: d.id },
              },
              {
                label: "Reject",
                endpoint: "/api/drafts",
                payload: { action: "reject", draftId: d.id },
              },
            ],
          });
        }
      }

      for (const c of clusters) {
        if (c.status === "open" && c.signalIds?.length > 1) {
          items.push({
            id: `cluster-${c.id}`,
            type: "triage_review",
            title: c.canonicalTitle || "Untitled cluster",
            summary: c.summary?.slice(0, 200) || `${c.signalIds?.length || 0} signals grouped`,
            entityType: "cluster",
            entityId: c.id,
            priority: c.severity || "medium",
            createdAt: c.firstSeen,
            actions: [
              {
                label: "Run Triage",
                endpoint: "/api/clusters",
                payload: { action: "triage", clusterId: c.id },
              },
            ],
          });
        }
      }

      items.sort(
        (a, b) =>
          priorityWeight(a.priority) - priorityWeight(b.priority) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setAssignments(items.slice(0, maxItems));
      setLoading(false);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchAssignments();
    intervalRef.current = setInterval(fetchAssignments, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAssignments, pollIntervalMs]);

  return { assignments, loading, error, refresh: fetchAssignments } as const;
}

function priorityWeight(p: string): number {
  if (p === "critical") return 0;
  if (p === "high") return 1;
  if (p === "medium") return 2;
  if (p === "low") return 3;
  return 4;
}

// ─── 3. useRecords ──────────────────────────────────────────────────────────
// Generic hook to fetch Lemma records with optional query/filter/pagination.
// Usage: const { data, loading, error } = useRecords({ type: "drafts" });

export function useRecords<T = Record<string, unknown>>(query: RecordQuery) {
  const [data, setData] = useState<T | T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = useCallback(() => {
    let path = `/api/${query.type}`;
    if (query.id) path += `/${query.id}`;

    const params = new URLSearchParams();
    if (query.filters) {
      for (const [k, v] of Object.entries(query.filters)) {
        params.set(k, v);
      }
    }
    if (query.limit) params.set("limit", String(query.limit));
    if (query.offset) params.set("offset", String(query.offset));

    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(buildUrl())
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          const records = json[query.type] ?? json.signal ?? json;
          setData(records as T);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message);
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [buildUrl, query.type, query.id]);

  return { data, loading, error, refresh: () => {} } as const;
}
