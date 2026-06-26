import type { IngestionResult, SyncAction } from "./types";
import { cleanBody } from "./normalize";

export interface GitHubWebhookPayload {
  event?: string;
  action?: string;
  issue?: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    user: { login: string } | null;
    labels?: Array<{ name: string }>;
    assignees?: Array<{ login: string }>;
    created_at: string;
    updated_at: string;
  };
  pull_request?: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    user: { login: string } | null;
    created_at: string;
    updated_at: string;
  };
  comment?: {
    id: number;
    body: string;
    user: { login: string } | null;
    created_at: string;
  };
  repository?: {
    full_name: string;
    name: string;
    owner: { login: string };
    html_url: string;
  };
  sender?: { login: string };
}

const SIGNAL_EVENTS = new Set([
  "issues.opened",
  "issues.reopened",
  "pull_request.opened",
  "issue_comment.created",
]);

function getEventKey(event?: string, action?: string): string {
  return `${event}.${action}`;
}

export function parseGitHubPayload(body: unknown): IngestionResult {
  if (!body || typeof body !== "object") {
    return { type: "error", error: "Invalid GitHub webhook payload" };
  }

  const payload = body as GitHubWebhookPayload;
  const event = payload.event || "unknown";
  const action = payload.action || "unknown";
  const eventKey = getEventKey(event, action);

  if (!SIGNAL_EVENTS.has(eventKey)) {
    return { type: "ignore", reason: `Unsupported GitHub event: ${eventKey}` };
  }

  if (event === "issues" && payload.issue) {
    return parseGitHubIssue(payload);
  }

  return { type: "ignore", reason: `No actionable content for event: ${eventKey}` };
}

function parseGitHubIssue(payload: GitHubWebhookPayload): IngestionResult {
  const issue = payload.issue!;
  const repo = payload.repository?.full_name || "unknown/repo";
  const body = issue.body || "";
  const cleanedBody = cleanBody(body);

  if (!issue.title.trim() && !cleanedBody.trim()) {
    return { type: "ignore", reason: `Empty GitHub issue #${issue.number}` };
  }

  const labels = issue.labels?.map((l) => l.name) || [];
  const assignees = issue.assignees?.map((a) => a.login) || [];

  const signal = {
    source: "github" as const,
    sourceMessageId: String(issue.id),
    title: issue.title,
    body: cleanedBody || issue.title,
    author: issue.user?.login || payload.sender?.login || "unknown",
    channel: repo,
    timestamp: new Date(issue.created_at).toISOString(),
    externalUrl: issue.html_url,
    rawType: `${payload.event}.${payload.action}`,
    productArea: labels.length > 0 ? labels[0] : undefined,
    metadata: {
      repo,
      issueNumber: issue.number,
      state: issue.state,
      labels,
      assignees,
    },
    rawPayload: payload as unknown as Record<string, unknown>,
  };

  return { type: "signal", signal };
}

export function handleGitHubSync(body: unknown, existingDrafts: Array<{ id: string; githubIssueRef?: string }>): SyncAction {
  if (!body || typeof body !== "object") {
    return { type: "error", error: "Invalid sync payload" };
  }

  const payload = body as GitHubWebhookPayload;
  const event = payload.event || "unknown";
  const action = payload.action || "unknown";
  const eventKey = getEventKey(event, action);

  if (event === "issues" && action === "closed") {
    const issue = payload.issue;
    if (!issue) return { type: "ignore", reason: "Missing issue in close event" };

    const matched = existingDrafts.find((d) => {
      const ref = d.githubIssueRef || "";
      return ref.includes(`issues/${issue.number}`) || ref.includes(`/issues/${issue.number}`);
    });

    if (matched) {
      return {
        type: "approve",
        draftId: matched.id,
        ref: issue.html_url,
        refUrl: issue.html_url,
      };
    }
    return { type: "ignore", reason: `No matching draft for GitHub issue #${issue.number}` };
  }

  return { type: "ignore", reason: `No sync action for event: ${eventKey}` };
}
