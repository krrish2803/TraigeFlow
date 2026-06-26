import { describe, it, expect } from "vitest";
import { runReviewAgent } from "./review-agent";
import type { Draft } from "../types";

function makeDraft(overrides: Partial<Draft>): Partial<Draft> {
  return {
    title: "App crashes on login",
    summary: "Users report crash after entering credentials",
    reproductionSteps: "1. Open app\n2. Enter credentials\n3. Tap sign in\n4. App crashes",
    expectedBehavior: "User should be logged in successfully",
    actualBehavior: "App crashes when sign in is tapped",
    severity: "critical",
    ownerSuggestion: "auth-team",
    ...overrides,
  };
}

describe("runReviewAgent", () => {
  it("approves a complete draft", () => {
    const result = runReviewAgent({ draft: makeDraft() });
    expect(result.approved).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.reviewReason).toBe("All required fields are present and valid");
  });

  it("rejects a draft with missing title", () => {
    const result = runReviewAgent({ draft: makeDraft({ title: "" }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toContain("Title");
  });

  it("rejects a draft with missing summary", () => {
    const result = runReviewAgent({ draft: makeDraft({ summary: "" }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toContain("Summary");
  });

  it("rejects a draft with missing reproduction steps", () => {
    const result = runReviewAgent({ draft: makeDraft({ reproductionSteps: "" }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toContain("Reproduction steps");
  });

  it("rejects a draft with missing expected behavior", () => {
    const result = runReviewAgent({ draft: makeDraft({ expectedBehavior: "" }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toContain("Expected behavior");
  });

  it("rejects a draft with missing actual behavior", () => {
    const result = runReviewAgent({ draft: makeDraft({ actualBehavior: "" }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toContain("Actual behavior");
  });

  it("rejects a draft with missing severity", () => {
    const result = runReviewAgent({ draft: makeDraft({ severity: undefined as unknown as "critical" }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toContain("Severity rating");
  });

  it("rejects a draft with missing owner suggestion", () => {
    const result = runReviewAgent({ draft: makeDraft({ ownerSuggestion: "" }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toContain("Owner suggestion");
  });

  it("reports all missing fields together", () => {
    const result = runReviewAgent({ draft: makeDraft({ title: "", summary: "", reproductionSteps: "" }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toHaveLength(3);
    expect(result.missingFields).toEqual(["Title", "Summary", "Reproduction steps"]);
  });

  it("handles empty object gracefully", () => {
    const result = runReviewAgent({ draft: {} });
    expect(result.approved).toBe(false);
    expect(result.missingFields.length).toBeGreaterThan(0);
  });

  it("handles whitespace-only strings as missing", () => {
    const result = runReviewAgent({ draft: makeDraft({ title: "   " }) });
    expect(result.approved).toBe(false);
    expect(result.missingFields).toContain("Title");
  });
});
