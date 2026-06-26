import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDraftAgent } from "./draft-agent";

vi.mock("@/lib/ai", () => ({
  callAI: vi.fn().mockResolvedValue(null),
  parseJSON: vi.fn().mockReturnValue(null),
}));

describe("runDraftAgent (heuristic fallback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a draft with auth prefix for auth area", async () => {
    const result = await runDraftAgent({
      signals: [{ source: "slack", body: "Cannot login with Google OAuth", author: "user1" }],
      rootCauseHypothesis: "Race condition in OAuth token refresh handler",
      severity: "critical",
      severityScore: 9,
      releaseRisk: "block",
      releaseRiskReason: "Auth broken for all users",
      affectedModules: ["auth/oauth-handler"],
      confidence: 0.92,
      productArea: "auth",
    });
    expect(result.issue.title).toContain("[Auth]");
    expect(result.identifier).toMatch(/^AUTH-\d{3}$/);
    expect(result.issue.labels).toContain("critical");
    expect(result.issue.labels).toContain("release-blocker");
  });

  it("generates summary from signal data", async () => {
    const result = await runDraftAgent({
      signals: [{ source: "slack", body: "Payment timeout during checkout", author: "user1" }],
      rootCauseHypothesis: "Payment API rate limiting",
      severity: "high",
      severityScore: 7,
      releaseRisk: "caution",
      releaseRiskReason: "Payment degradation",
      affectedModules: ["payments/checkout-flow"],
      confidence: 0.85,
      productArea: "payments",
    });
    expect(result.issue.summary).toContain("1 user reports");
    expect(result.issue.summary).toContain("payment api rate limiting");
    expect(result.issue.summary).toContain("slack");
    expect(result.identifier).toMatch(/^PAY-\d{3}$/);
  });

  it("generates slack summary with root cause info", async () => {
    const result = await runDraftAgent({
      signals: [{ source: "slack", body: "App crashes", author: "user1" }],
      rootCauseHypothesis: "Memory leak in data layer",
      severity: "medium",
      severityScore: 5,
      releaseRisk: "safe",
      releaseRiskReason: "Low impact",
      affectedModules: ["core/data-layer"],
      confidence: 0.7,
      productArea: "performance",
    });
    expect(result.slackSummary).toContain("[Performance]");
    expect(result.slackSummary).toContain("Memory leak");
  });

  it("generates customer reply", async () => {
    const result = await runDraftAgent({
      signals: [{ source: "slack", body: "App crashes", author: "user1" }],
      rootCauseHypothesis: "Something broke",
      severity: "critical",
      severityScore: 9,
      releaseRisk: "block",
      releaseRiskReason: "Everything broken",
      affectedModules: [],
      confidence: 0.8,
    });
    expect(result.customerReply).toContain("Thank you");
    expect(result.customerReply).toContain("critical");
  });

  it("uses default repro steps when none found", async () => {
    const result = await runDraftAgent({
      signals: [{ source: "slack", body: "It broke", author: "user1" }],
      rootCauseHypothesis: "Unknown issue",
      severity: "medium",
      severityScore: 5,
      releaseRisk: "safe",
      releaseRiskReason: "Unknown",
      affectedModules: [],
      confidence: 0.6,
    });
    expect(result.issue.reproSteps).toContain("Navigate to the affected area");
  });

  it("includes cross-source label when multiple sources", async () => {
    const result = await runDraftAgent({
      signals: [
        { source: "slack", body: "Broken", author: "u1" },
        { source: "gmail", body: "Broken", author: "u2" },
        { source: "github", body: "Broken", author: "u3" },
      ],
      rootCauseHypothesis: "Broken feature",
      severity: "high",
      severityScore: 7,
      releaseRisk: "caution",
      releaseRiskReason: "Degradation",
      affectedModules: [],
      confidence: 0.8,
    });
    expect(result.issue.labels).toContain("cross-source");
    expect(result.issue.labels).toContain("multiple-reports");
  });

  it("generates confidence scores that reflect input confidence", async () => {
    const result = await runDraftAgent({
      signals: [{ source: "slack", body: "Bug", author: "u1" }],
      rootCauseHypothesis: "Bug",
      severity: "low",
      severityScore: 2,
      releaseRisk: "safe",
      releaseRiskReason: "Minor",
      affectedModules: [],
      confidence: 0.95,
    });
    expect(result.confidenceScores.title).toBeGreaterThan(0.8);
    expect(result.confidenceScores.rootCause).toBe(0.95);
  });

  it("uses default prefix for unknown product area", async () => {
    const result = await runDraftAgent({
      signals: [{ source: "slack", body: "Something weird", author: "u1" }],
      rootCauseHypothesis: "Unknown issue",
      severity: "medium",
      severityScore: 4,
      releaseRisk: "safe",
      releaseRiskReason: "Minor",
      affectedModules: [],
      confidence: 0.5,
    });
    expect(result.issue.title).toContain("[Bug]");
    expect(result.identifier).toMatch(/^BUG-\d{3}$/);
  });

  it("includes evidence in output", async () => {
    const result = await runDraftAgent({
      signals: [{ source: "slack", body: "Bug report here", author: "u1" }],
      rootCauseHypothesis: "Something",
      severity: "medium",
      severityScore: 4,
      releaseRisk: "safe",
      releaseRiskReason: "Minor",
      affectedModules: [],
      confidence: 0.7,
    });
    expect(result.evidence.length).toBeGreaterThan(0);
  });
});
