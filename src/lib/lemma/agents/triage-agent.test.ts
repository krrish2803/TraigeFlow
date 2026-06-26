import { describe, it, expect, vi, beforeEach } from "vitest";
import { runTriageAgent } from "./triage-agent";

vi.mock("@/lib/ai", () => ({
  callAI: vi.fn().mockResolvedValue(null),
  parseJSON: vi.fn().mockReturnValue(null),
}));

describe("runTriageAgent (heuristic fallback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("flags crash/outage as critical severity", async () => {
    const result = await runTriageAgent({
      signalCount: 1,
      sourceTypes: ["slack"],
      allText: "the app crashes and there is a security breach",
    });
    expect(result.severity).toBe("critical");
    expect(result.severityScore).toBeGreaterThanOrEqual(9);
    expect(result.releaseRisk).toBe("block");
  });

  it("flags error/failure as high severity", async () => {
    const result = await runTriageAgent({
      signalCount: 1,
      sourceTypes: ["slack"],
      allText: "the app throws an error and times out",
    });
    expect(result.severity).toBe("high");
    expect(result.severityScore).toBeGreaterThanOrEqual(7);
  });

  it("flags confusion as medium severity", async () => {
    const result = await runTriageAgent({
      signalCount: 1,
      sourceTypes: ["slack"],
      allText: "I'm confused about how the settings work, it's unclear",
    });
    expect(result.severity).toBe("medium");
  });

  it("boosts severity for high signal count", async () => {
    const result = await runTriageAgent({
      signalCount: 5,
      sourceTypes: ["slack"],
      allText: "the app is slow, laggy",
    });
    expect(result.severityScore).toBeGreaterThan(4);
  });

  it("boosts severity for source diversity", async () => {
    const result = await runTriageAgent({
      signalCount: 1,
      sourceTypes: ["slack", "gmail", "github"],
      allText: "the app is slow, laggy",
    });
    expect(result.severityScore).toBeGreaterThan(4);
  });

  it("generates auth root cause for oauth-related text", async () => {
    const result = await runTriageAgent({
      signalCount: 1,
      sourceTypes: ["slack"],
      allText: "oauth redirect loop during login on iOS",
    });
    expect(result.rootCauseHypothesis).toContain("OAuth");
    expect(result.affectedModules).toContain("auth/oauth-handler");
  });

  it("generates payment root cause for payment text", async () => {
    const result = await runTriageAgent({
      signalCount: 1,
      sourceTypes: ["slack"],
      allText: "payment checkout timeout 504 gateway error",
    });
    expect(result.rootCauseHypothesis).toContain("Payment");
    expect(result.affectedModules).toContain("payments/checkout-flow");
  });

  it("uses productArea when no modules match", async () => {
    const result = await runTriageAgent({
      signalCount: 1,
      sourceTypes: ["slack"],
      allText: "something vague is happening",
      productArea: "notifications",
    });
    expect(result.affectedModules).toContain("notifications/core");
  });

  it("increases confidence with more signals and sources", async () => {
    const result = await runTriageAgent({
      signalCount: 5,
      sourceTypes: ["slack", "gmail", "github"],
      allText: "crash during login",
    });
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("includes evidence from analysis", async () => {
    const result = await runTriageAgent({
      signalCount: 1,
      sourceTypes: ["slack"],
      allText: "app crashes on startup",
    });
    expect(result.evidence.length).toBeGreaterThan(0);
  });
});
