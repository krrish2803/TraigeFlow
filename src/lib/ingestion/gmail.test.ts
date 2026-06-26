import { describe, it, expect } from "vitest";
import { parsePushNotification, parseGmailMessage, mockGmailMessage } from "./gmail";

describe("parsePushNotification", () => {
  it("returns error for non-object input", () => {
    expect(parsePushNotification(null).type).toBe("error");
  });

  it("decodes base64 message data", () => {
    const data = Buffer.from(JSON.stringify({ emailAddress: "test@example.com", historyId: "12345" })).toString("base64");
    const result = parsePushNotification({ message: { data } });
    expect(result.type).toBe("ignore");
    if (result.type === "ignore") {
      expect(result.reason).toContain("test@example.com");
    }
  });

  it("handles direct emailAddress / historyId format", () => {
    const result = parsePushNotification({ emailAddress: "user@example.com", historyId: "67890" });
    expect(result.type).toBe("ignore");
    if (result.type === "ignore") {
      expect(result.reason).toContain("user@example.com");
    }
  });

  it("returns error when decoded data is invalid JSON", () => {
    const data = Buffer.from("not-json").toString("base64");
    const result = parsePushNotification({ message: { data } });
    expect(result.type).toBe("error");
  });

  it("returns error when emailAddress and historyId missing", () => {
    const result = parsePushNotification({ message: {} });
    expect(result.type).toBe("error");
  });
});

describe("parseGmailMessage", () => {
  it("returns error for message without id", () => {
    const result = parseGmailMessage({ id: "", threadId: "t1" } as never);
    expect(result.type).toBe("error");
  });

  it("ignores spam messages", () => {
    const msg = mockGmailMessage({ labelIds: ["SPAM"] });
    const result = parseGmailMessage(msg);
    expect(result.type).toBe("ignore");
  });

  it("ignores trash messages", () => {
    const msg = mockGmailMessage({ labelIds: ["TRASH"] });
    const result = parseGmailMessage(msg);
    expect(result.type).toBe("ignore");
  });

  it("ignores draft messages", () => {
    const msg = mockGmailMessage({ labelIds: ["DRAFT"] });
    const result = parseGmailMessage(msg);
    expect(result.type).toBe("ignore");
  });

  it("parses a valid inbox message into a signal", () => {
    const msg = mockGmailMessage();
    const result = parseGmailMessage(msg);
    expect(result.type).toBe("signal");
    if (result.type === "signal") {
      expect(result.signal.source).toBe("gmail");
      expect(result.signal.author).toContain("Customer");
      expect(result.signal.channel).toBe("support");
    }
  });

  it("extracts subject from headers", () => {
    const msg = mockGmailMessage({
      payload: {
        headers: [
          { name: "Subject", value: "Urgent: Payment Issue" },
          { name: "From", value: "User <user@test.com>" },
          { name: "To", value: "support@triageflow.io" },
          { name: "Date", value: new Date().toUTCString() },
        ],
      },
    });
    const result = parseGmailMessage(msg);
    if (result.type === "signal") {
      expect(result.signal.title).toBe("Urgent: Payment Issue");
    }
  });
});
