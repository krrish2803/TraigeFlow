import type { IngestionResult, SyncAction, NormalizedSignal } from "./types";
import { isSignalResult, isIgnoreResult, isErrorResult } from "./types";
import { getLemmaClient } from "@/lib/lemma/client";
import type { SignalSource, Signal } from "@/lib/lemma/types";
import { parseSlackPayload } from "./slack";
import { parsePushNotification, parseGmailMessage } from "./gmail";
import { parseGitHubPayload, handleGitHubSync } from "./github";
import { parseJiraPayload, handleJiraSync } from "./jira";

export interface RouterResult {
  action: "signal_ingested" | "ignored" | "synced" | "error";
  signalId?: string;
  reason?: string;
  error?: string;
  syncResult?: SyncAction;
}

function normalizedToSignal(input: NormalizedSignal): Omit<Signal, "id" | "status" | "evidence" | "createdAt" | "updatedAt"> {
  return {
    source: input.source,
    sourceMessageId: input.sourceMessageId,
    title: input.title,
    body: input.body,
    author: input.author,
    channel: input.channel,
    timestamp: input.timestamp,
    externalUrl: input.externalUrl,
    rawType: input.rawType,
    productArea: input.productArea,
    metadata: input.metadata,
    rawPayload: input.rawPayload,
  };
}

export function routeIngestion(source: SignalSource, rawPayload: unknown): RouterResult {
  let result: IngestionResult;

  switch (source) {
    case "slack":
      result = parseSlackPayload(rawPayload);
      break;
    case "gmail":
      result = parsePushNotification(rawPayload);
      if (isIgnoreResult(result) && result.reason.startsWith("Push notification received")) {
        return { action: "ignored", reason: result.reason };
      }
      break;
    case "github":
      result = parseGitHubPayload(rawPayload);
      break;
    case "jira":
      result = parseJiraPayload(rawPayload);
      break;
    default:
      return { action: "error", error: `Unknown source: ${source}` };
  }

  if (isErrorResult(result)) {
    return { action: "error", error: result.error };
  }

  if (isIgnoreResult(result)) {
    return { action: "ignored", reason: result.reason };
  }

  if (isSignalResult(result)) {
    return ingestAndPipeline(result.signal);
  }

  return { action: "error", error: "Unexpected ingestion result" };
}

export function routeGmailMessage(message: unknown): RouterResult {
  const result = parseGmailMessage(message as Parameters<typeof parseGmailMessage>[0]);

  if (isErrorResult(result)) {
    return { action: "error", error: result.error };
  }

  if (isIgnoreResult(result)) {
    return { action: "ignored", reason: result.reason };
  }

  if (isSignalResult(result)) {
    return ingestAndPipeline(result.signal);
  }

  return { action: "error", error: "Unexpected Gmail message result" };
}

function ingestAndPipeline(signal: NormalizedSignal): RouterResult {
  const lemma = getLemmaClient();
  const signalData = normalizedToSignal(signal);

  const created = lemma.ingestSignal(signalData);
  lemma.runFullPipeline(created.id);

  return { action: "signal_ingested", signalId: created.id };
}

export function routeSync(source: "github" | "jira", rawPayload: unknown): RouterResult {
  const lemma = getLemmaClient();
  const drafts = lemma.getDrafts();

  let syncResult: SyncAction;

  switch (source) {
    case "github":
      syncResult = handleGitHubSync(rawPayload, drafts);
      break;
    case "jira":
      syncResult = handleJiraSync(rawPayload, drafts);
      break;
    default:
      return { action: "error", error: `Unknown sync source: ${source}` };
  }

  if (syncResult.type === "error") {
    return { action: "error", error: syncResult.error };
  }

  if (syncResult.type === "ignore") {
    return { action: "ignored", reason: syncResult.reason };
  }

  if (syncResult.type === "approve") {
    lemma.approveDraft(syncResult.draftId, "system");
    return {
      action: "synced",
      signalId: syncResult.draftId,
      syncResult,
      reason: `Approved draft via GitHub issue closure`,
    };
  }

  if (syncResult.type === "sync") {
    return {
      action: "synced",
      signalId: syncResult.draftId,
      syncResult,
      reason: `Synced draft state from Jira`,
    };
  }

  return { action: "error", error: "Unexpected sync result" };
}
