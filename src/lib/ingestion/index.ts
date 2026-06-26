export type {
  NormalizedSignal,
  IngestionResult,
  SyncAction,
  SourceModule,
  SyncModule,
} from "./types";
export { isErrorResult, isIgnoreResult, isSignalResult } from "./types";

export { parseSlackPayload } from "./slack";
export type { SlackEvent } from "./slack";

export { parsePushNotification, parseGmailMessage, mockGmailMessage } from "./gmail";
export type { GmailPushNotification, GmailMessage, GmailWatchResponse } from "./gmail";

export { parseGitHubPayload, handleGitHubSync } from "./github";
export type { GitHubWebhookPayload } from "./github";

export { parseJiraPayload, handleJiraSync } from "./jira";
export type { JiraWebhookPayload } from "./jira";

export { routeIngestion, routeGmailMessage, routeSync } from "./router";
export type { RouterResult } from "./router";

export { extractTitle, cleanBody, stripReplyQuotes, buildExternalUrl } from "./normalize";
