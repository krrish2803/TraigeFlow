"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(fetcher: () => Promise<T>): FetchState<T> & { refresh: () => Promise<void> } {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}

function usePaginatedFetch<T>(
  fetcher: (page: number, limit: number) => Promise<{ items: T[]; total: number; page: number; totalPages: number }>,
  initialLimit = 20,
): FetchState<{ items: T[]; total: number; page: number; totalPages: number }> & { refresh: () => Promise<void>; setPage: (p: number) => void; page: number; limit: number } {
  const [page, setPage] = useState(1);
  const limit = initialLimit;
  const [state, setState] = useState<FetchState<{ items: T[]; total: number; page: number; totalPages: number }>>({
    data: null, loading: true, error: null,
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current(page, limit);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);

  return { ...state, page, limit, setPage, refresh: load };
}

export function useSignals() {
  return useFetch(async () => {
    const res = await fetch("/api/signals");
    const json = await res.json();
    return json.signals as Record<string, unknown>[];
  });
}

export function useSignalsPaginated(limit = 20) {
  return usePaginatedFetch(async (page, lim) => {
    const res = await fetch(`/api/signals?page=${page}&limit=${lim}`);
    const json = await res.json();
    return { items: json.signals as Record<string, unknown>[], total: json.total as number, page: json.page as number, totalPages: json.totalPages as number };
  }, limit);
}

export function useSignal(id: string | null) {
  return useFetch(async () => {
    if (!id) return null;
    const res = await fetch(`/api/signals/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.signal as Record<string, unknown>;
  });
}

export function useClusters() {
  return useFetch(async () => {
    const res = await fetch("/api/clusters");
    const json = await res.json();
    return json.clusters as Record<string, unknown>[];
  });
}

export function useClustersPaginated(limit = 20) {
  return usePaginatedFetch(async (page, lim) => {
    const res = await fetch(`/api/clusters?page=${page}&limit=${lim}`);
    const json = await res.json();
    return { items: json.clusters as Record<string, unknown>[], total: json.total as number, page: json.page as number, totalPages: json.totalPages as number };
  }, limit);
}

export function useDrafts() {
  return useFetch(async () => {
    const res = await fetch("/api/drafts");
    const json = await res.json();
    return json.drafts as Record<string, unknown>[];
  });
}

export function useDraftsPaginated(limit = 20) {
  return usePaginatedFetch(async (page, lim) => {
    const res = await fetch(`/api/drafts?page=${page}&limit=${lim}`);
    const json = await res.json();
    return { items: json.drafts as Record<string, unknown>[], total: json.total as number, page: json.page as number, totalPages: json.totalPages as number };
  }, limit);
}

export function useActivity() {
  return useFetch(async () => {
    const res = await fetch("/api/activity");
    const json = await res.json();
    return json.activity as Record<string, unknown>[];
  });
}

export function useActivityPaginated(limit = 50) {
  return usePaginatedFetch(async (page, lim) => {
    const res = await fetch(`/api/activity?page=${page}&limit=${lim}`);
    const json = await res.json();
    return { items: json.activity as Record<string, unknown>[], total: json.total as number, page: json.page as number, totalPages: json.totalPages as number };
  }, limit);
}

export function useReleases() {
  return useFetch(async () => {
    const res = await fetch("/api/releases");
    return res.json() as Promise<{
      clusters: Record<string, unknown>[];
      drafts: Record<string, unknown>[];
      lastDigest: Record<string, unknown> | null;
      blockCount: number;
      cautionCount: number;
      safeCount: number;
      riskScore: number;
      totalSignals: number;
      totalClusters: number;
      totalDrafts: number;
    }>;
  });
}

export function useDashboard() {
  return useFetch(async () => {
    const res = await fetch("/api/dashboard");
    return res.json() as Promise<{
      totalSignals: number;
      totalClusters: number;
      totalDrafts: number;
      pendingSignals: number;
      pendingDrafts: number;
      criticalClusters: number;
      riskScore: number;
      recentActivity: Record<string, unknown>[];
      recentDrafts: Record<string, unknown>[];
    }>;
  });
}

export async function approveDraftAction(draftId: string) {
  const res = await fetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "approve", draftId }),
  });
  return res.json();
}

export async function rejectDraftAction(draftId: string, reason?: string) {
  const res = await fetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reject", draftId, reason }),
  });
  return res.json();
}

export async function runTriageAction(clusterId: string) {
  const res = await fetch("/api/clusters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "triage", clusterId }),
  });
  return res.json();
}

export async function injectDemoSignal(scenarioId: string) {
  const res = await fetch("/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId }),
  });
  return res.json();
}

export async function injectCustomSignal(data: {
  source: string;
  body: string;
  author?: string;
  channel?: string;
}) {
  const res = await fetch("/api/signals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function generateReleaseDigestAction() {
  const res = await fetch("/api/releases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
