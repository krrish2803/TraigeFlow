import { describe, it, expect } from "vitest";
import { parseGitHubPayload, handleGitHubSync } from "./github";

describe("parseGitHubPayload", () => {
  it("returns error for non-object input", () => {
    const result = parseGitHubPayload(null);
    expect(result.type).toBe("error");
  });

  it("returns ignore for ping event", () => {
    const result = parseGitHubPayload({ event: "ping", action: "unknown" });
    expect(result.type).toBe("ignore");
  });

  it("returns signal for issues.opened", () => {
    const result = parseGitHubPayload({
      event: "issues",
      action: "opened",
      issue: {
        id: 1001,
        number: 42,
        title: "App crashes on login",
        body: "When I try to log in, the app crashes immediately",
        state: "open",
        html_url: "https://github.com/owner/repo/issues/42",
        user: { login: "testuser" },
        created_at: "2024-06-01T12:00:00Z",
        updated_at: "2024-06-01T12:00:00Z",
      },
      repository: { full_name: "owner/repo", name: "repo", owner: { login: "owner" }, html_url: "" },
      sender: { login: "testuser" },
    });
    expect(result.type).toBe("signal");
    if (result.type === "signal") {
      expect(result.signal.source).toBe("github");
      expect(result.signal.title).toBe("App crashes on login");
      expect(result.signal.author).toBe("testuser");
      expect(result.signal.channel).toBe("owner/repo");
      expect(result.signal.sourceMessageId).toBe("1001");
    }
  });

  it("returns signal for issues.reopened", () => {
    const result = parseGitHubPayload({
      event: "issues",
      action: "reopened",
      issue: {
        id: 1002,
        number: 43,
        title: "Payment bug still present",
        body: "The payment bug is still happening after the update",
        state: "open",
        html_url: "https://github.com/owner/repo/issues/43",
        user: { login: "devuser" },
        created_at: "2024-06-02T12:00:00Z",
        updated_at: "2024-06-02T12:00:00Z",
      },
      repository: { full_name: "org/repo", name: "repo", owner: { login: "org" }, html_url: "" },
      sender: { login: "devuser" },
    });
    expect(result.type).toBe("signal");
    if (result.type === "signal") {
      expect(result.signal.source).toBe("github");
      expect(result.signal.sourceMessageId).toBe("1002");
    }
  });

  it("returns ignore for issues.closed (handled by sync)", () => {
    const result = parseGitHubPayload({
      event: "issues",
      action: "closed",
      issue: {
        id: 1003,
        number: 44,
        title: "Fixed bug",
        body: "This was fixed",
        state: "closed",
        html_url: "https://github.com/owner/repo/issues/44",
        user: { login: "user" },
        created_at: "2024-06-03T12:00:00Z",
        updated_at: "2024-06-03T12:00:00Z",
      },
    });
    expect(result.type).toBe("ignore");
  });

  it("handles empty issue body", () => {
    const result = parseGitHubPayload({
      event: "issues",
      action: "opened",
      issue: {
        id: 1004,
        number: 45,
        title: "Empty body issue",
        body: "",
        state: "open",
        html_url: "https://github.com/owner/repo/issues/45",
        user: { login: "user" },
        created_at: "2024-06-04T12:00:00Z",
        updated_at: "2024-06-04T12:00:00Z",
      },
      repository: { full_name: "owner/repo", name: "repo", owner: { login: "owner" }, html_url: "" },
    });
    expect(result.type).toBe("signal");
  });

  it("returns ignore for issue with empty title and body", () => {
    const result = parseGitHubPayload({
      event: "issues",
      action: "opened",
      issue: {
        id: 1005,
        number: 46,
        title: "",
        body: "",
        state: "open",
        html_url: "",
        user: { login: "user" },
        created_at: "2024-06-05T12:00:00Z",
        updated_at: "2024-06-05T12:00:00Z",
      },
    });
    expect(result.type).toBe("ignore");
  });
});

describe("handleGitHubSync", () => {
  it("returns approve when closed issue matches draft", () => {
    const result = handleGitHubSync({
      event: "issues",
      action: "closed",
      issue: {
        id: 1001,
        number: 42,
        title: "Fixed bug",
        body: "This was fixed",
        state: "closed",
        html_url: "https://github.com/owner/repo/issues/42",
        user: { login: "user" },
        created_at: "2024-06-01T12:00:00Z",
        updated_at: "2024-06-01T14:00:00Z",
      },
    }, [{ id: "draft-1", githubIssueRef: "https://github.com/owner/repo/issues/42" }]);
    expect(result.type).toBe("approve");
    if (result.type === "approve") {
      expect(result.draftId).toBe("draft-1");
    }
  });

  it("returns ignore when no matching draft found", () => {
    const result = handleGitHubSync({
      event: "issues",
      action: "closed",
      issue: {
        id: 1002,
        number: 99,
        title: "Another bug",
        body: "Fixed",
        state: "closed",
        html_url: "https://github.com/owner/repo/issues/99",
        user: { login: "user" },
        created_at: "2024-06-01T12:00:00Z",
        updated_at: "2024-06-01T14:00:00Z",
      },
    }, [{ id: "draft-1", githubIssueRef: "https://github.com/owner/repo/issues/42" }]);
    expect(result.type).toBe("ignore");
  });

  it("returns error for invalid payload", () => {
    const result = handleGitHubSync(null, []);
    expect(result.type).toBe("error");
  });

  it("returns ignore for non-close events", () => {
    const result = handleGitHubSync({
      event: "issues",
      action: "opened",
      issue: { id: 1003, number: 43, title: "New bug", body: "desc", state: "open", html_url: "", user: { login: "user" }, created_at: "", updated_at: "" },
    }, []);
    expect(result.type).toBe("ignore");
  });
});
