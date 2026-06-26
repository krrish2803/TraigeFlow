import type { NormalizedSignal } from "./types";

export function extractTitle(body: string, fallback?: string): string {
  if (fallback && fallback.length > 0) return fallback;
  const firstLine = body.split("\n")[0].trim();
  if (firstLine.length > 0) return firstLine.slice(0, 120);
  return "Untitled signal";
}

export function stripReplyQuotes(body: string): string {
  return body
    .split("\n")
    .filter((line) => !line.startsWith(">") && !line.startsWith("On ") && !line.startsWith("--"))
    .join("\n")
    .trim();
}

export function cleanBody(body: string): string {
  return body.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, "").trim();
}

export function buildExternalUrl(source: NormalizedSignal["source"], meta: {
  channel?: string;
  threadTs?: string;
  messageId?: string;
  repo?: string;
  issueNumber?: number;
  projectKey?: string;
  issueKey?: string;
}): string | undefined {
  switch (source) {
    case "slack": {
      if (meta.channel && meta.threadTs) {
        const channel = meta.channel.startsWith("#") ? meta.channel.slice(1) : meta.channel;
        return `https://slack.com/archives/${channel}/p${meta.threadTs.replace(".", "")}`;
      }
      return undefined;
    }
    case "github": {
      if (meta.repo && meta.issueNumber) {
        return `https://github.com/${meta.repo}/issues/${meta.issueNumber}`;
      }
      return undefined;
    }
    case "jira": {
      if (meta.projectKey && meta.issueKey) {
        return `https://${meta.projectKey}.atlassian.net/browse/${meta.issueKey}`;
      }
      return undefined;
    }
    case "gmail": {
      if (meta.messageId) {
        return `https://mail.google.com/mail/u/0/#inbox/${meta.messageId}`;
      }
      return undefined;
    }
    default:
      return undefined;
  }
}
