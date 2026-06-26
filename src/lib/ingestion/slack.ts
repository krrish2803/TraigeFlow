import type { IngestionResult } from "./types";
import { extractTitle, cleanBody, buildExternalUrl } from "./normalize";

export interface SlackEvent {
  type?: string;
  event?: {
    type?: string;
    text?: string;
    user?: string;
    channel?: string;
    ts?: string;
    thread_ts?: string;
    team?: string;
    event_ts?: string;
    bot_id?: string;
    subtype?: string;
  };
  challenge?: string;
  event_id?: string;
  team_id?: string;
}

export function parseSlackPayload(body: unknown): IngestionResult {
  if (!body || typeof body !== "object") {
    return { type: "error", error: "Invalid payload: expected object" };
  }

  const payload = body as SlackEvent;

  if (payload.type === "url_verification") {
    return { type: "ignore", reason: "URL verification challenge" };
  }

  if (payload.type === "event_callback" || payload.event) {
    return parseSlackEvent(payload);
  }

  return { type: "ignore", reason: `Unsupported slack event type: ${payload.type}` };
}

function parseSlackEvent(payload: SlackEvent): IngestionResult {
  const event = payload.event;
  if (!event) {
    return { type: "ignore", reason: "Missing event in event_callback" };
  }

  if (event.type !== "message") {
    return { type: "ignore", reason: `Ignoring non-message event: ${event.type}` };
  }

  if (event.bot_id || event.subtype === "bot_message") {
    return { type: "ignore", reason: "Ignoring bot message" };
  }

  if (event.subtype && event.subtype !== "message_changed") {
    return { type: "ignore", reason: `Ignoring message subtype: ${event.subtype}` };
  }

  const supportedChannels = process.env.SLACK_SUPPORT_CHANNEL_IDS;
  const channel = event.channel || "unknown";
  if (supportedChannels) {
    const allowed = supportedChannels.split(",").map((c) => c.trim());
    if (!allowed.includes(channel)) {
      return { type: "ignore", reason: `Channel ${channel} not in support channel allowlist` };
    }
  }

  const text = (event.text || "").trim();
  if (!text) {
    return { type: "ignore", reason: "Empty message text" };
  }

  const cleanedText = cleanBody(text);
  if (!cleanedText) {
    return { type: "ignore", reason: "Message contains only emoji/whitespace" };
  }

  const ts = event.ts || event.event_ts || Date.now().toString();

  const signal = {
    source: "slack" as const,
    sourceMessageId: ts,
    title: extractTitle(cleanedText, `Message in ${channel}`),
    body: cleanedText,
    author: event.user || "unknown",
    channel,
    timestamp: slackTsToIso(ts),
    rawType: "message",
    metadata: {
      teamId: payload.team_id || event.team,
      channel,
      threadTs: event.thread_ts,
      eventId: payload.event_id,
    },
    rawPayload: payload as unknown as Record<string, unknown>,
    externalUrl: buildExternalUrl("slack", {
      channel,
      threadTs: ts,
    }),
  };

  return { type: "signal", signal };
}

function slackTsToIso(ts: string): string {
  const seconds = parseFloat(ts);
  if (isNaN(seconds)) return new Date().toISOString();
  return new Date(seconds * 1000).toISOString();
}
