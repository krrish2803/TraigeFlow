import { describe, it, expect, vi, beforeEach } from "vitest";
import { routeIngestion, routeGmailMessage, routeSync } from "./router";

const mockLemma = {
  ingestSignal: vi.fn().mockReturnValue({ id: "sig-123" }),
  runFullPipeline: vi.fn(),
  getDrafts: vi.fn().mockReturnValue([]),
  approveDraft: vi.fn(),
};

vi.mock("@/lib/lemma/client", () => ({
  getLemmaClient: () => mockLemma,
}));

describe("routeIngestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes Slack payloads to parseSlackPayload", () => {
    const result = routeIngestion("slack", {
      type: "url_verification",
      challenge: "abc",
    });
    expect(result.action).toBe("ignored");
  });

  it("routes valid Slack signal to ingestion", () => {
    const result = routeIngestion("slack", {
      type: "event_callback",
      event: {
        type: "message",
        text: "App crashes on login",
        user: "U123",
        channel: "C123",
        ts: "1715000100.000100",
      },
      team_id: "T001",
    });
    expect(result.action).toBe("signal_ingested");
    expect(mockLemma.ingestSignal).toHaveBeenCalled();
    expect(mockLemma.runFullPipeline).toHaveBeenCalledWith("sig-123");
  });

  it("routes GitHub payloads", () => {
    const result = routeIngestion("github", {
      event: "issues",
      action: "opened",
      issue: {
        id: 1,
        number: 42,
        title: "Bug",
        body: "Crash on startup",
        state: "open",
        html_url: "https://github.com/o/r/issues/42",
        user: { login: "user" },
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      repository: { full_name: "o/r", name: "r", owner: { login: "o" }, html_url: "" },
    });
    expect(result.action).toBe("signal_ingested");
  });

  it("routes Jira payloads", () => {
    const result = routeIngestion("jira", {
      event: "jira:issue_created",
      issue: {
        id: "100",
        key: "PROJ-1",
        fields: {
          summary: "Bug report",
          description: "App crashes",
          status: { name: "Open" },
          creator: { displayName: "John" },
          project: { key: "PROJ", name: "Project" },
          labels: [],
          created: "2024-01-01T00:00:00Z",
          updated: "2024-01-01T00:00:00Z",
        },
      },
    });
    expect(result.action).toBe("signal_ingested");
  });

  it("returns error for unknown source", () => {
    const result = routeIngestion("unknown" as never, {});
    expect(result.action).toBe("error");
  });

  it("handles Gmail push notification as ignored", () => {
    const data = Buffer.from(JSON.stringify({ emailAddress: "a@b.com", historyId: "1" })).toString("base64");
    const result = routeIngestion("gmail", { message: { data } });
    expect(result.action).toBe("ignored");
  });
});

describe("routeGmailMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ingests a valid Gmail message", () => {
    const message = {
      id: "msg-1",
      threadId: "thread-1",
      labelIds: ["INBOX"],
      payload: {
        headers: [
          { name: "Subject", value: "Bug Report" },
          { name: "From", value: "User <user@test.com>" },
          { name: "To", value: "support@triageflow.io" },
          { name: "Date", value: new Date().toUTCString() },
        ],
      },
      internalDate: "1704067200000",
    };
    const result = routeGmailMessage(message);
    expect(result.action).toBe("signal_ingested");
  });

  it("returns error for invalid message", () => {
    const result = routeGmailMessage({});
    expect(result.action).toBe("error");
  });
});

describe("routeSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for unknown sync source", () => {
    const result = routeSync("unknown" as never, {});
    expect(result.action).toBe("error");
  });

  it("returns error for invalid payload", () => {
    const result = routeSync("github", null);
    expect(result.action).toBe("error");
  });
});
