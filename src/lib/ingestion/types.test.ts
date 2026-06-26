import { describe, it, expect } from "vitest";
import { isErrorResult, isIgnoreResult, isSignalResult } from "./types";
import type { IngestionResult } from "./types";

describe("type guards", () => {
  it("isErrorResult returns true for error results", () => {
    const result: IngestionResult = { type: "error", error: "something went wrong" };
    expect(isErrorResult(result)).toBe(true);
  });

  it("isErrorResult returns false for non-error results", () => {
    const result: IngestionResult = { type: "signal", signal: { source: "slack", sourceMessageId: "1", title: "t", body: "b", author: "a", timestamp: "2024-01-01" } };
    expect(isErrorResult(result)).toBe(false);
  });

  it("isIgnoreResult returns true for ignore results", () => {
    const result: IngestionResult = { type: "ignore", reason: "not relevant" };
    expect(isIgnoreResult(result)).toBe(true);
  });

  it("isSignalResult returns true for signal results", () => {
    const result: IngestionResult = { type: "signal", signal: { source: "github", sourceMessageId: "2", title: "t", body: "b", author: "a", timestamp: "2024-01-01" } };
    expect(isSignalResult(result)).toBe(true);
  });

  it("type guards are mutually exclusive", () => {
    const results: IngestionResult[] = [
      { type: "error", error: "err" },
      { type: "ignore", reason: "ign" },
      { type: "signal", signal: { source: "slack", sourceMessageId: "1", title: "t", body: "b", author: "a", timestamp: "2024-01-01" } },
    ];
    for (const r of results) {
      const guards = [isErrorResult(r), isIgnoreResult(r), isSignalResult(r)];
      expect(guards.filter(Boolean).length).toBe(1);
    }
  });
});
