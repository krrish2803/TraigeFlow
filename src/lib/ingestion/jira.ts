import type { IngestionResult, SyncAction } from "./types";
import { extractTitle, cleanBody } from "./normalize";

export interface JiraWebhookPayload {
  event?: string;
  issue?: {
    id: string;
    key: string;
    self?: string;
    fields?: {
      summary?: string;
      description?: string;
      status?: { name: string; id: string };
      priority?: { name: string };
      assignee?: { displayName: string; emailAddress?: string };
      creator?: { displayName: string; emailAddress?: string };
      reporter?: { displayName: string; emailAddress?: string };
      project?: { key: string; name: string };
      labels?: string[];
      created?: string;
      updated?: string;
    };
    changelog?: {
      items?: Array<{
        field: string;
        fromString?: string;
        toString?: string;
      }>;
    };
  };
  user?: { displayName: string };
  timestamp?: number;
}

const SIGNAL_EVENTS = new Set([
  "jira:issue_created",
  "jira:issue_updated",
]);

function extractDescription(issue: NonNullable<JiraWebhookPayload["issue"]>): string {
  const desc = issue.fields?.description;
  if (!desc) return "";
  if (typeof desc === "string") return desc;
  if (typeof desc === "object") {
    try {
      return JSON.stringify(desc);
    } catch {
      return "";
    }
  }
  return "";
}

export function parseJiraPayload(body: unknown): IngestionResult {
  if (!body || typeof body !== "object") {
    return { type: "error", error: "Invalid Jira webhook payload" };
  }

  const payload = body as JiraWebhookPayload;
  const event = payload.event || "unknown";

  if (!SIGNAL_EVENTS.has(event)) {
    return { type: "ignore", reason: `Unsupported Jira event: ${event}` };
  }

  const issue = payload.issue;
  if (!issue) {
    return { type: "ignore", reason: "Missing issue in Jira webhook" };
  }

  const fields = issue.fields;
  const summary = fields?.summary || "";
  const description = extractDescription(issue);
  const cleanedBody = cleanBody(description);

  if (!summary.trim() && !cleanedBody.trim()) {
    return { type: "ignore", reason: `Empty Jira issue: ${issue.key}` };
  }

  const author = fields?.creator?.displayName || fields?.reporter?.displayName || payload.user?.displayName || "unknown";
  const labels = fields?.labels || [];
  const isBug = labels.some((l) => l.toLowerCase().includes("bug")) || summary.toLowerCase().includes("bug");

  const signal = {
    source: "jira" as const,
    sourceMessageId: issue.id,
    title: summary || extractTitle(cleanedBody),
    body: cleanedBody || summary,
    author,
    channel: fields?.project?.key || "unknown",
    timestamp: fields?.created ? new Date(fields.created).toISOString() : new Date().toISOString(),
    externalUrl: `${fields?.project?.key ? `https://${fields.project.key}.atlassian.net` : "https://jira.atlassian.net"}/browse/${issue.key}`,
    rawType: event,
    productArea: isBug ? "bug" : undefined,
    metadata: {
      key: issue.key,
      status: fields?.status?.name,
      priority: fields?.priority?.name,
      assignee: fields?.assignee?.displayName,
      project: fields?.project?.key,
      labels,
      changelog: issue.changelog?.items,
    },
    rawPayload: payload as unknown as Record<string, unknown>,
  };

  return { type: "signal", signal };
}

export function handleJiraSync(body: unknown, existingDrafts: Array<{ id: string; jiraIssueRef?: string }>): SyncAction {
  if (!body || typeof body !== "object") {
    return { type: "error", error: "Invalid Jira sync payload" };
  }

  const payload = body as JiraWebhookPayload;
  const event = payload.event || "unknown";
  const issue = payload.issue;

  if (!issue) return { type: "ignore", reason: "Missing issue in Jira webhook" };

  const changelogItems = issue.changelog?.items || [];
  const statusChange = changelogItems.find((item) => item.field === "status");

  if (statusChange && statusChange.toString?.toLowerCase() === "done") {
    const matched = existingDrafts.find((d) => {
      const ref = d.jiraIssueRef || "";
      return ref.includes(issue.key);
    });

    if (matched) {
      return {
        type: "sync",
        draftId: matched.id,
        updates: { status: "resolved" },
      };
    }
    return { type: "ignore", reason: `No matching draft for Jira issue ${issue.key}` };
  }

  return { type: "ignore", reason: `No sync action for event: ${event}` };
}
