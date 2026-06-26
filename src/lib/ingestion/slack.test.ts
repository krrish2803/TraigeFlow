import { describe, it, expect } from "vitest";
import { parseSlackPayload } from "./slack";

describe("parseSlackPayload", () => {
  it("returns error for non-object input", () => {
    const result = parseSlackPayload(null);
    expect(result.type).toBe("error");
  });

  it("returns ignore for url_verification", () => {
    const result = parseSlackPayload({ type: "url_verification", challenge: "abc123" });
    expect(result.type).toBe("ignore");
    if (result.type === "ignore") {
      expect(result.reason).toContain("URL verification");
    }
  });

  it("returns ignore for non-message events", () => {
    const result = parseSlackPayload({
      type: "event_callback",
      event: { type: "reaction_added" },
    });
    expect(result.type).toBe("ignore");
  });

  it("returns ignore for bot messages", () => {
    const result = parseSlackPayload({
      type: "event_callback",
      event: { type: "message", bot_id: "B123", text: "hello", channel: "C123" },
    });
    expect(result.type).toBe("ignore");
  });

  it("returns ignore for bot subtype messages", () => {
    const result = parseSlackPayload({
      type: "event_callback",
      event: { type: "message", subtype: "bot_message", text: "hello", channel: "C123" },
    });
    expect(result.type).toBe("ignore");
  });

  it("returns ignore for unsupported message subtypes", () => {
    const result = parseSlackPayload({
      type: "event_callback",
      event: { type: "message", subtype: "message_deleted", text: "hello", channel: "C123" },
    });
    expect(result.type).toBe("ignore");
  });

  it("returns ignore for empty message text", () => {
    const result = parseSlackPayload({
      type: "event_callback",
      event: { type: "message", text: "   ", channel: "C123", user: "U123" },
    });
    expect(result.type).toBe("ignore");
  });

  it("returns signal for valid message event", () => {
    const result = parseSlackPayload({
      type: "event_callback",
      event: {
        type: "message",
        text: "The app crashes when I login",
        user: "U12345",
        channel: "C123",
        ts: "1715000100.000100",
        team: "T001",
      },
      team_id: "T001",
    });
    expect(result.type).toBe("signal");
    if (result.type === "signal") {
      expect(result.signal.source).toBe("slack");
      expect(result.signal.sourceMessageId).toBe("1715000100.000100");
      expect(result.signal.author).toBe("U12345");
      expect(result.signal.channel).toBe("C123");
      expect(result.signal.body).toContain("app crashes");
    }
  });

  it("filters by SLACK_SUPPORT_CHANNEL_IDS env var", () => {
    const prev = process.env.SLACK_SUPPORT_CHANNEL_IDS;
    process.env.SLACK_SUPPORT_CHANNEL_IDS = "C456,C789";

    const result = parseSlackPayload({
      type: "event_callback",
      event: {
        type: "message",
        text: "The app crashes",
        user: "U123",
        channel: "C123",
        ts: "1715000100.000100",
      },
    });
    expect(result.type).toBe("ignore");
    if (result.type === "ignore") {
      expect(result.reason).toContain("C123");
    }

    process.env.SLACK_SUPPORT_CHANNEL_IDS = prev;
  });

  it("allows messages from allowed channels", () => {
    const prev = process.env.SLACK_SUPPORT_CHANNEL_IDS;
    process.env.SLACK_SUPPORT_CHANNEL_IDS = "C456,C789";

    const result = parseSlackPayload({
      type: "event_callback",
      event: {
        type: "message",
        text: "The app crashes",
        user: "U123",
        channel: "C789",
        ts: "1715000100.000100",
      },
    });
    expect(result.type).toBe("signal");

    process.env.SLACK_SUPPORT_CHANNEL_IDS = prev;
  });

  it("handles message_changed subtype as ignore (text in nested message)", () => {
    // message_changed events have text in event.message.text, not event.text
    const prev = process.env.SLACK_SUPPORT_CHANNEL_IDS;
    process.env.SLACK_SUPPORT_CHANNEL_IDS = "";

    const result = parseSlackPayload({
      type: "event_callback",
      event: {
        type: "message",
        subtype: "message_changed",
        text: undefined,
        message: { text: "Updated message content" },
        user: "U123",
        channel: "C123",
        ts: "1715000100.000100",
      },
    });
    expect(result.type).toBe("ignore");
    if (result.type === "ignore") {
      expect(result.reason).toContain("Empty");
    }

    process.env.SLACK_SUPPORT_CHANNEL_IDS = prev;
  });

  it("returns ignore for unsupported top-level event type", () => {
    const result = parseSlackPayload({ type: "app_rate_limited" });
    expect(result.type).toBe("ignore");
  });
});
