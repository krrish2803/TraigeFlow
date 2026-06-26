import { describe, it, expect } from "vitest";
import { parseJiraPayload, handleJiraSync } from "./jira";

function makeJiraPayload(overrides: Record<string, unknown> = {}) {
  return {
    event: "jira:issue_created",
    issue: {
      id: "10001",
      key: "PROJ-123",
      self: "https://jira.atlassian.net/rest/api/2/issue/10001",
      fields: {
        summary: "App crashes on login screen",
        description: "When I try to log in with my credentials, the app crashes immediately",
        status: { name: "Open", id: "1" },
        priority: { name: "High" },
        creator: { displayName: "John Doe", emailAddress: "john@example.com" },
        reporter: { displayName: "John Doe", emailAddress: "john@example.com" },
        project: { key: "PROJ", name: "Project" },
        labels: ["bug", "login"],
        created: "2024-06-01T12:00:00.000Z",
        updated: "2024-06-01T12:00:00.000Z",
      },
    },
    user: { displayName: "John Doe" },
    timestamp: 1717238400000,
    ...overrides,
  };
}

describe("parseJiraPayload", () => {
  it("returns error for non-object input", () => {
    const result = parseJiraPayload(null);
    expect(result.type).toBe("error");
  });

  it("returns ignore for unsupported event types", () => {
    const result = parseJiraPayload({ event: "jira:issue_deleted" });
    expect(result.type).toBe("ignore");
  });

  it("returns ignore when issue is missing", () => {
    const result = parseJiraPayload({ event: "jira:issue_created" });
    expect(result.type).toBe("ignore");
  });

  it("returns signal for jira:issue_created", () => {
    const result = parseJiraPayload(makeJiraPayload());
    expect(result.type).toBe("signal");
    if (result.type === "signal") {
      expect(result.signal.source).toBe("jira");
      expect(result.signal.title).toBe("App crashes on login screen");
      expect(result.signal.author).toBe("John Doe");
      expect(result.signal.sourceMessageId).toBe("10001");
      expect(result.signal.channel).toBe("PROJ");
    }
  });

  it("returns signal for jira:issue_updated", () => {
    const result = parseJiraPayload(makeJiraPayload({ event: "jira:issue_updated" }));
    expect(result.type).toBe("signal");
    if (result.type === "signal") {
      expect(result.signal.source).toBe("jira");
    }
  });

  it("sets productArea to 'bug' when bug label is present", () => {
    const result = parseJiraPayload(makeJiraPayload());
    if (result.type === "signal") {
      expect(result.signal.productArea).toBe("bug");
    }
  });

  it("handles missing description gracefully", () => {
    const payload = makeJiraPayload({
      issue: {
        id: "10002",
        key: "PROJ-124",
        fields: {
          summary: "Minor issue",
          description: undefined,
          status: { name: "Open", id: "1" },
          creator: { displayName: "Jane" },
          project: { key: "PROJ", name: "Project" },
          labels: [],
          created: "2024-06-01T12:00:00.000Z",
          updated: "2024-06-01T12:00:00.000Z",
        },
      },
    });
    const result = parseJiraPayload(payload);
    expect(result.type).toBe("signal");
  });

  it("returns ignore when both summary and body are empty", () => {
    const payload = makeJiraPayload({
      issue: {
        id: "10003",
        key: "PROJ-125",
        fields: {
          summary: "",
          description: "",
          status: { name: "Open", id: "1" },
          creator: { displayName: "Jane" },
          project: { key: "PROJ", name: "Project" },
          labels: [],
          created: "2024-06-01T12:00:00.000Z",
          updated: "2024-06-01T12:00:00.000Z",
        },
      },
    });
    const result = parseJiraPayload(payload);
    expect(result.type).toBe("ignore");
  });
});

describe("handleJiraSync", () => {
  it("returns sync when issue status changes to Done and matches draft", () => {
    const changelog = {
      items: [{ field: "status", fromString: "In Progress", toString: "Done" }],
    };
    const result = handleJiraSync({
      event: "jira:issue_updated",
      issue: {
        id: "10001",
        key: "PROJ-123",
        changelog,
        fields: { summary: "", description: "", status: { name: "Done", id: "3" }, labels: [] },
      },
    }, [{ id: "draft-1", jiraIssueRef: "PROJ-123" }]);
    expect(result.type).toBe("sync");
    if (result.type === "sync") {
      expect(result.draftId).toBe("draft-1");
      expect(result.updates).toEqual({ status: "resolved" });
    }
  });

  it("returns ignore when no matching draft for Jira issue", () => {
    const changelog = {
      items: [{ field: "status", fromString: "In Progress", toString: "Done" }],
    };
    const result = handleJiraSync({
      event: "jira:issue_updated",
      issue: {
        id: "10002",
        key: "PROJ-456",
        changelog,
        fields: { summary: "", description: "", status: { name: "Done", id: "3" }, labels: [] },
      },
    }, [{ id: "draft-1", jiraIssueRef: "PROJ-123" }]);
    expect(result.type).toBe("ignore");
  });

  it("returns ignore when status change is not to Done", () => {
    const changelog = {
      items: [{ field: "status", fromString: "Open", toString: "In Progress" }],
    };
    const result = handleJiraSync({
      event: "jira:issue_updated",
      issue: {
        id: "10001",
        key: "PROJ-123",
        changelog,
        fields: { summary: "", description: "", status: { name: "In Progress", id: "2" }, labels: [] },
      },
    }, [{ id: "draft-1", jiraIssueRef: "PROJ-123" }]);
    expect(result.type).toBe("ignore");
  });

  it("returns error for invalid payload", () => {
    const result = handleJiraSync(null, []);
    expect(result.type).toBe("error");
  });
});
