import { describe, it, expect } from "vitest";
import { runReleaseRiskAgent } from "./release-risk-agent";
import type { Draft } from "../types";

describe("runReleaseRiskAgent", () => {
  it("returns 'safe' with no blockers or cautions", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 0, cautionCount: 0, safeCount: 5, approvedCount: 0 });
    expect(result.riskLevel).toBe("safe");
    expect(result.riskScore).toBe(0);
  });

  it("returns 'block' when blockers exist", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 1, cautionCount: 0, safeCount: 0, approvedCount: 0 });
    expect(result.riskLevel).toBe("block");
    expect(result.riskScore).toBe(10);
  });

  it("returns 'caution' when caution count > 2", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 0, cautionCount: 3, safeCount: 0, approvedCount: 0 });
    expect(result.riskLevel).toBe("caution");
    expect(result.riskScore).toBe(15);
  });

  it("returns 'caution' when riskScore >= 15 even with few cautions", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 0, cautionCount: 3, safeCount: 0, approvedCount: 0 });
    expect(result.riskLevel).toBe("caution");
  });

  it("returns 'safe' when riskScore < 15 and no blockers", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 0, cautionCount: 2, safeCount: 10, approvedCount: 0 });
    expect(result.riskLevel).toBe("safe");
    expect(result.riskScore).toBe(10);
  });

  it("calculates riskScore as blockCount * 10 + cautionCount * 5", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 3, cautionCount: 4, safeCount: 0, approvedCount: 0 });
    expect(result.riskScore).toBe(50);
  });

  it("highlights block items from drafts", () => {
    const blocker = { title: "Auth crash", identifier: "AUTH-123", releaseRisk: "block" as const, approvalStatus: "pending" as const };
    const result = runReleaseRiskAgent({ drafts: [blocker as Draft], blockCount: 1, cautionCount: 0, safeCount: 0, approvedCount: 0 });
    expect(result.highlights[0]).toContain("1 blocker");
    expect(result.highlights[1]).toContain("Auth crash");
  });

  it("includes safe count in highlights", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 0, cautionCount: 0, safeCount: 3, approvedCount: 0 });
    expect(result.highlights.some((h) => h.includes("cleared for release"))).toBe(true);
  });

  it("includes approved count in highlights", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 0, cautionCount: 0, safeCount: 0, approvedCount: 2 });
    expect(result.highlights.some((h) => h.includes("filed this cycle"))).toBe(true);
  });

  it("adds 'No release risks detected' when all counts are zero", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 0, cautionCount: 0, safeCount: 0, approvedCount: 0 });
    expect(result.highlights).toContain("No release risks detected");
  });

  it("generates reasoning summarizing all counts", () => {
    const result = runReleaseRiskAgent({ drafts: [], blockCount: 1, cautionCount: 2, safeCount: 5, approvedCount: 3 });
    expect(result.reasoning).toContain("Risk score: 20/100");
    expect(result.reasoning).toContain("1 blocker(s)");
    expect(result.reasoning).toContain("2 caution(s)");
    expect(result.reasoning).toContain("3 issue(s) already filed");
  });
});
