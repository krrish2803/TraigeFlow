import { describe, it, expect, vi, beforeEach } from "vitest";
import { runClassificationAgent } from "./classification-agent";

vi.mock("@/lib/ai", () => ({
  callAI: vi.fn().mockResolvedValue(null),
  parseJSON: vi.fn().mockReturnValue(null),
}));

describe("runClassificationAgent (heuristic fallback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifies auth crash as bug with critical urgency", async () => {
    const result = await runClassificationAgent({
      cleanedText: "the login page crashes with error 500",
      source: "slack",
    });
    expect(result.label).toBe("bug");
    expect(result.urgency).toBe("critical");
    expect(result.productArea).toBe("auth");
  });

  it("classifies payment issue as critical urgency", async () => {
    const result = await runClassificationAgent({
      cleanedText: "payment checkout keeps failing with timeout",
      source: "gmail",
    });
    expect(result.label).toBe("bug");
    expect(result.urgency).toBe("critical");
    expect(result.productArea).toBe("payments");
  });

  it("classifies feature request correctly", async () => {
    const result = await runClassificationAgent({
      cleanedText: "I would like to suggest adding dark mode support",
      source: "github",
    });
    expect(result.label).toBe("feature");
    expect(result.productArea).not.toBe("auth");
  });

  it("classifies question correctly", async () => {
    const result = await runClassificationAgent({
      cleanedText: "How do I reset my password? I'm confused",
      source: "slack",
    });
    expect(result.label).toBe("question");
  });

  it("detects data-loss severity boost", async () => {
    const result = await runClassificationAgent({
      cleanedText: "all my data is gone after the update, data loss critical",
      source: "gmail",
    });
    expect(result.urgency).toBe("critical");
    expect(result.severityBoostReason).toContain("Data-loss");
  });

  it("detects widespread impact boost", async () => {
    const result = await runClassificationAgent({
      cleanedText: "the app is broken for everyone, nobody can login",
      source: "slack",
    });
    expect(result.urgency).toBe("critical");
  });

  it("defaults to medium urgency with no indicators", async () => {
    const result = await runClassificationAgent({
      cleanedText: "the color of the button looks slightly off",
      source: "slack",
    });
    expect(result.urgency).toBe("medium");
    expect(result.productArea).toBe("ui");
  });

  it("identifies api product area", async () => {
    const result = await runClassificationAgent({
      cleanedText: "the API endpoint returns 504 gateway timeout",
      source: "github",
    });
    expect(result.productArea).toBe("api");
  });

  it("returns keyPhrases matching content", async () => {
    const result = await runClassificationAgent({
      cleanedText: "app crashes and times out with slow performance",
      source: "slack",
    });
    expect(result.keyPhrases.length).toBeGreaterThan(0);
  });

  it("produces evidence items", async () => {
    const result = await runClassificationAgent({
      cleanedText: "login is broken",
      source: "slack",
    });
    expect(result.evidence.length).toBeGreaterThan(0);
  });
});
