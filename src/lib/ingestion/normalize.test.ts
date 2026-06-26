import { describe, it, expect } from "vitest";
import { extractTitle, stripReplyQuotes, cleanBody, buildExternalUrl } from "./normalize";

describe("extractTitle", () => {
  it("returns the first line of body", () => {
    expect(extractTitle("App crashes on login\nMore details here")).toBe("App crashes on login");
  });

  it("returns fallback when provided", () => {
    expect(extractTitle("body content", "Fallback title")).toBe("Fallback title");
  });

  it("truncates to 120 chars", () => {
    const long = "a".repeat(200);
    expect(extractTitle(long).length).toBe(120);
  });

  it("returns 'Untitled signal' for empty body with no fallback", () => {
    expect(extractTitle("")).toBe("Untitled signal");
  });

  it("prefers fallback even when body is non-empty", () => {
    expect(extractTitle("body text", "Explicit Title")).toBe("Explicit Title");
  });
});

describe("stripReplyQuotes", () => {
  it("removes email reply quote lines", () => {
    const input = "I have a problem\n> On Jan 1, 2024 wrote\n> Previous message\n--\nOriginal message";
    expect(stripReplyQuotes(input)).toBe("I have a problem\nOriginal message");
  });

  it("keeps non-quoted lines intact", () => {
    const input = "First line\nSecond line\nThird line";
    expect(stripReplyQuotes(input)).toBe(input);
  });

  it("handles empty input", () => {
    expect(stripReplyQuotes("")).toBe("");
  });
});

describe("cleanBody", () => {
  it("removes emoji characters", () => {
    const input = "Hello 👍 world 👏 test";
    const result = cleanBody(input);
    expect(result).not.toContain("👍");
    expect(result).not.toContain("👏");
    expect(result).toContain("Hello");
    expect(result).toContain("world");
    expect(result).toContain("test");
  });

  it("trims whitespace", () => {
    expect(cleanBody("  hello world  ")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(cleanBody("")).toBe("");
  });
});

describe("buildExternalUrl", () => {
  it("builds Slack URL from channel and threadTs", () => {
    const url = buildExternalUrl("slack", { channel: "C12345", threadTs: "1715000100.000100" });
    expect(url).toBe("https://slack.com/archives/C12345/p1715000100000100");
  });

  it("removes # prefix from Slack channel", () => {
    const url = buildExternalUrl("slack", { channel: "#bugs", threadTs: "1715000100.000100" });
    expect(url).toBe("https://slack.com/archives/bugs/p1715000100000100");
  });

  it("builds GitHub URL from repo and issue number", () => {
    const url = buildExternalUrl("github", { repo: "owner/repo", issueNumber: 42 });
    expect(url).toBe("https://github.com/owner/repo/issues/42");
  });

  it("builds Jira URL from project key and issue key", () => {
    const url = buildExternalUrl("jira", { projectKey: "PROJ", issueKey: "PROJ-123" });
    expect(url).toBe("https://PROJ.atlassian.net/browse/PROJ-123");
  });

  it("builds Gmail URL from messageId", () => {
    const url = buildExternalUrl("gmail", { messageId: "abc123" });
    expect(url).toBe("https://mail.google.com/mail/u/0/#inbox/abc123");
  });

  it("returns undefined for Slack when channel is missing", () => {
    expect(buildExternalUrl("slack", {})).toBeUndefined();
  });

  it("returns undefined for unknown source", () => {
    expect(buildExternalUrl("unknown" as never, {})).toBeUndefined();
  });
});
