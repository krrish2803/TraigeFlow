import type { IngestionResult } from "./types";
import { extractTitle, stripReplyQuotes } from "./normalize";

export interface GmailPushNotification {
  message?: {
    data?: string;
    messageId?: string;
    message_id?: string;
  };
  emailAddress?: string;
  historyId?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    mimeType?: string;
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; size?: number };
      parts?: Array<{ mimeType: string; body?: { data?: string; size?: number } }>;
    }>;
  };
  internalDate?: string;
}

export interface GmailWatchResponse {
  emailAddress: string;
  historyId: string;
  expiration?: string;
}

function decodeBase64(data: string): string {
  try {
    return Buffer.from(data, "base64").toString("utf-8");
  } catch {
    return data;
  }
}

function extractHeader(headers: Array<{ name: string; value: string }>, name: string): string | undefined {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
}

function extractPlainTextBody(message: GmailMessage): string {
  const parts = message.payload?.parts || [];
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64(part.body.data);
    }
    if (part.parts) {
      for (const sub of part.parts) {
        if (sub.mimeType === "text/plain" && sub.body?.data) {
          return decodeBase64(sub.body.data);
        }
      }
    }
  }
  const body = message.payload?.parts?.[0]?.body?.data || message.snippet || "";
  return body;
}

function parseGmailTimestamp(internalDate?: string): string {
  if (internalDate) {
    const ms = parseInt(internalDate, 10);
    if (!isNaN(ms)) return new Date(ms).toISOString();
  }
  return new Date().toISOString();
}

export function parsePushNotification(body: unknown): IngestionResult {
  if (!body || typeof body !== "object") {
    return { type: "error", error: "Invalid Gmail push payload" };
  }

  const raw = body as Record<string, unknown>;

  let emailAddress: string | undefined;
  let historyId: string | undefined;

  if (raw.message && typeof raw.message === "object") {
    const msg = raw.message as Record<string, unknown>;
    const dataField = (msg.data as string) || "";
    if (dataField) {
      try {
        const decoded = Buffer.from(dataField, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded) as GmailWatchResponse;
        emailAddress = parsed.emailAddress;
        historyId = parsed.historyId;
      } catch {
        return { type: "error", error: "Failed to decode Gmail push notification data" };
      }
    }
  } else {
    emailAddress = raw.emailAddress as string;
    historyId = raw.historyId as string;
  }

  if (!emailAddress || !historyId) {
    return { type: "error", error: "Missing emailAddress or historyId in push notification" };
  }

  return { type: "ignore", reason: `Push notification received for ${emailAddress}, historyId=${historyId} — awaiting message fetch` };
}

export function parseGmailMessage(message: GmailMessage): IngestionResult {
  if (!message || !message.id) {
    return { type: "error", error: "Invalid Gmail message: missing id" };
  }

  const headers = message.payload?.headers || [];
  const subject = extractHeader(headers, "subject") || "";
  const from = extractHeader(headers, "from") || "unknown";
  const date = extractHeader(headers, "date");

  const rawBody = extractPlainTextBody(message);
  const cleanedBody = stripReplyQuotes(rawBody);
  const finalBody = cleanedBody || message.snippet || "";
  const labelIds = message.labelIds || [];

  if (labelIds.includes("SPAM") || labelIds.includes("TRASH")) {
    return { type: "ignore", reason: `Ignoring spam/trash message: ${message.id}` };
  }

  if (labelIds.includes("DRAFT")) {
    return { type: "ignore", reason: `Ignoring draft message: ${message.id}` };
  }

  if (!finalBody.trim() && !subject.trim()) {
    return { type: "ignore", reason: `Empty Gmail message: ${message.id}` };
  }

  const signal = {
    source: "gmail" as const,
    sourceMessageId: message.id,
    title: subject || extractTitle(finalBody),
    body: finalBody.trim() || subject,
    author: from,
    channel: "support",
    timestamp: date ? new Date(date).toISOString() : parseGmailTimestamp(message.internalDate),
    externalUrl: `https://mail.google.com/mail/u/0/#inbox/${message.id}`,
    rawType: "message",
    productArea: labelIds.includes("INBOX") ? undefined : undefined,
    metadata: {
      threadId: message.threadId,
      labelIds,
      headers: headers.slice(0, 10),
    },
    rawPayload: message as unknown as Record<string, unknown>,
  };

  return { type: "signal", signal };
}

export function mockGmailMessage(overrides?: Partial<GmailMessage>): GmailMessage {
  return {
    id: `msg-${Date.now()}`,
    threadId: `thread-${Date.now()}`,
    labelIds: ["INBOX", "IMPORTANT"],
    snippet: overrides?.snippet || "I'm having trouble with the payment on my account...",
    payload: {
      headers: [
        { name: "Subject", value: overrides?.payload?.headers?.find((h) => h.name === "Subject")?.value || "Payment issue on my account" },
        { name: "From", value: overrides?.payload?.headers?.find((h) => h.name === "From")?.value || "Customer <customer@example.com>" },
        { name: "To", value: overrides?.payload?.headers?.find((h) => h.name === "To")?.value || "support@triageflow.io" },
        { name: "Date", value: overrides?.payload?.headers?.find((h) => h.name === "Date")?.value || new Date().toUTCString() },
      ],
    },
    internalDate: String(Date.now()),
    ...overrides,
  };
}
