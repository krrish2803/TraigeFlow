import { describe, it, expect, vi, beforeEach } from "vitest";
import { runIntakeAgent } from "./intake-agent";

vi.mock("@/lib/ai", () => ({
  callAI: vi.fn().mockResolvedValue(null),
  parseJSON: vi.fn().mockReturnValue(null),
}));

describe("runIntakeAgent (heuristic fallback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifies crash text as bug_report", async () => {
    const result = await runIntakeAgent({
      source: "slack",
      body: "The app crashes when I try to login with Google on my iPhone",
      author: "user1",
    });
    expect(result.type).toBe("bug_report");
    expect(result.cleanedText).toContain("app crashes");
    expect(result.productArea).toBe("auth");
    expect(["ios", "iphone"]).toContain(result.affectedPlatform);
  });

  it("classifies payment failure as bug_report", async () => {
    const result = await runIntakeAgent({
      source: "gmail",
      body: "Payment request failed with timeout error at checkout",
      author: "user2",
    });
    expect(result.type).toBe("bug_report");
    expect(result.productArea).toBe("payments");
  });

  it("classifies feature suggestion as feature_request", async () => {
    const result = await runIntakeAgent({
      source: "github",
      body: "I would like a dark mode feature please",
      author: "user3",
    });
    expect(result.type).toBe("feature_request");
  });

  it("classifies short greeting as noise", async () => {
    const result = await runIntakeAgent({
      source: "slack",
      body: "thanks!",
      author: "user1",
    });
    expect(result.type).toBe("noise");
    expect(result.noiseReason).toBeTruthy();
  });

  it("classifies very short text as noise", async () => {
    const result = await runIntakeAgent({
      source: "slack",
      body: "ok",
      author: "user1",
    });
    expect(result.type).toBe("noise");
  });

  it("detects urgency signals from language", async () => {
    const result = await runIntakeAgent({
      source: "slack",
      body: "URGENT: login error is completely broken for everyone on the team",
      author: "user1",
    });
    expect(result.urgencySignals).toContain("error_detected");
    expect(result.urgencySignals).toContain("urgency_language");
    expect(result.urgencySignals).toContain("widespread_impact");
  });

  it("extracts error details from message", async () => {
    const result = await runIntakeAgent({
      source: "slack",
      body: "Error: Uncaught TypeError: Cannot read property 'x' of undefined",
      author: "dev1",
    });
    expect(result.hasErrorDetails).toBe(true);
    expect(result.extractedError).toContain("Error:");
  });

  it("identifies multiple product areas", async () => {
    const result = await runIntakeAgent({
      source: "slack",
      body: "The API endpoint is timing out and causing slow performance",
      author: "user1",
    });
    expect(result.productArea).toBe("api");
  });

  it("handles empty body gracefully", async () => {
    const result = await runIntakeAgent({
      source: "slack",
      body: "",
      author: "user1",
    });
    expect(result.type).toBe("noise");
  });

  it("preserves evidence array in output", async () => {
    const result = await runIntakeAgent({
      source: "slack",
      body: "Crash on startup",
      author: "user1",
    });
    expect(result.evidence.length).toBeGreaterThan(0);
  });
});
