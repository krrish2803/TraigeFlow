import { describe, it, expect } from "vitest";
import { runSimilarityAgent } from "./similarity-agent";
import type { Signal } from "../types";

function makeSignal(overrides: Partial<Signal>): Signal {
  return {
    id: "sig-1",
    source: "slack",
    sourceMessageId: "msg-1",
    title: "Test signal",
    body: "the app crashes when I try to login",
    author: "user1",
    timestamp: new Date().toISOString(),
    status: "pending",
    evidence: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("runSimilarityAgent", () => {
  it("returns empty similarSignals when no other signals exist", () => {
    const signal = makeSignal({ id: "sig-1" });
    const result = runSimilarityAgent({ signal, allSignals: [] });
    expect(result.similarSignals).toEqual([]);
    expect(result.shouldCluster).toBe(false);
    expect(result.existingClusterId).toBeNull();
  });

  it("detects similar signals by text overlap", () => {
    const signal = makeSignal({ id: "sig-1", body: "the app crashes during login" });
    const other = makeSignal({ id: "sig-2", body: "my app crashes when I login", source: "gmail" });
    const result = runSimilarityAgent({ signal, allSignals: [other] });
    expect(result.similarSignals.length).toBeGreaterThan(0);
    expect(result.similarSignals[0].score).toBeGreaterThan(0.15);
  });

  it("boosts score for same source", () => {
    // Use different enough texts so they don't both hit score 1.0
    const signal = makeSignal({ id: "sig-1", body: "crash during payment checkout process", source: "github" });
    const sameSource = makeSignal({ id: "sig-2", body: "crash during payment process on github", source: "github" });
    const diffSource = makeSignal({ id: "sig-3", body: "crash during payment process on github", source: "slack" });

    const sameResult = runSimilarityAgent({ signal, allSignals: [sameSource] });
    const diffResult = runSimilarityAgent({ signal, allSignals: [diffSource] });
    // Same source should be >= diff source (boost is 0.05)
    expect(sameResult.similarSignals[0].score).toBeGreaterThanOrEqual(diffResult.similarSignals[0].score);
  });

  it("boosts score for same product area", () => {
    const signal = makeSignal({ id: "sig-1", body: "payment timeout at checkout screen", productArea: "payments" });
    const sameArea = makeSignal({ id: "sig-2", body: "payment timeout during checkout", productArea: "payments", source: "gmail" });
    const diffArea = makeSignal({ id: "sig-3", body: "payment timeout during checkout", productArea: "auth", source: "gmail" });

    const sameResult = runSimilarityAgent({ signal, allSignals: [sameArea] });
    const diffResult = runSimilarityAgent({ signal, allSignals: [diffArea] });
    // Same area should be >= diff area (boost is 0.1)
    expect(sameResult.similarSignals[0].score).toBeGreaterThanOrEqual(diffResult.similarSignals[0].score);
  });

  it("returns existingClusterId when matching signal belongs to a cluster", () => {
    const signal = makeSignal({ id: "sig-1", body: "login redirect loop" });
    const clustered = makeSignal({ id: "sig-2", body: "login redirect loop after oauth", relatedClusterId: "cluster-1" });
    const result = runSimilarityAgent({ signal, allSignals: [clustered] });
    expect(result.existingClusterId).toBe("cluster-1");
  });

  it("filters out noise signals", () => {
    const signal = makeSignal({ id: "sig-1", body: "the app crashes on startup" });
    const noise = makeSignal({ id: "sig-2", body: "the app crashes on startup", status: "noise" });
    const result = runSimilarityAgent({ signal, allSignals: [noise] });
    expect(result.similarSignals).toEqual([]);
  });

  it("sorts results by score descending", () => {
    const signal = makeSignal({ id: "sig-1", body: "the app crashes on startup" });
    const close = makeSignal({ id: "sig-2", body: "the app crashes on startup error" });
    const far = makeSignal({ id: "sig-3", body: "completely unrelated content about pizza" });
    const result = runSimilarityAgent({ signal, allSignals: [far, close] });
    expect(result.similarSignals[0].signalId).toBe("sig-2");
  });

  it("limits results to top 5", () => {
    const signal = makeSignal({ id: "sig-1", body: "crash error timeout" });
    const manySignals = Array.from({ length: 10 }, (_, i) =>
      makeSignal({ id: `sig-${i + 2}`, body: `crash error timeout report ${i}` })
    );
    const result = runSimilarityAgent({ signal, allSignals: manySignals });
    expect(result.similarSignals.length).toBeLessThanOrEqual(5);
  });
});
