import type { SignalSource } from "@/lib/lemma/types";

export interface NormalizedSignal {
  source: SignalSource;
  sourceMessageId: string;
  externalUrl?: string;
  title: string;
  body: string;
  author: string;
  channel?: string;
  timestamp: string;
  productArea?: string;
  rawType?: string;
  metadata?: Record<string, unknown>;
  rawPayload?: Record<string, unknown>;
}

export type IngestionResult =
  | { type: "signal"; signal: NormalizedSignal }
  | { type: "ignore"; reason: string }
  | { type: "error"; error: string };

export type SyncAction =
  | { type: "ignore"; reason: string }
  | { type: "approve"; draftId: string; ref: string; refUrl?: string }
  | { type: "sync"; draftId: string; updates: Record<string, unknown> }
  | { type: "error"; error: string };

export interface SourceModule<T = unknown> {
  parse(payload: T): IngestionResult;
}

export interface SyncModule<T = unknown> {
  handle(payload: T): SyncAction;
}

export function isErrorResult(r: IngestionResult): r is { type: "error"; error: string } {
  return r.type === "error";
}

export function isIgnoreResult(r: IngestionResult): r is { type: "ignore"; reason: string } {
  return r.type === "ignore";
}

export function isSignalResult(r: IngestionResult): r is { type: "signal"; signal: NormalizedSignal } {
  return r.type === "signal";
}
