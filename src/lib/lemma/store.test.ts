import { describe, it, expect } from "vitest";
import { createMemoryStore } from "./store";
import type { Signal } from "./types";

describe("createMemoryStore", () => {
  const baseSignal = {
    source: "slack" as const,
    title: "Test Signal",
    body: "Test body",
    author: "user1",
    timestamp: new Date().toISOString(),
    sourceMessageId: "msg-1",
    channel: "general",
    type: "bug_report" as const,
    cleanedText: "Test body",
    urgencySignals: [],
    hasErrorDetails: false,
    productArea: "auth",
  };

  const baseCluster = {
    signalIds: ["sig-1"],
    title: "Test Cluster",
    severity: "medium" as const,
    severityScore: 5,
    signalCount: 1,
    sourceTypes: ["slack"],
    lastSeen: new Date().toISOString(),
    productArea: "auth",
    primarySignalId: "sig-1",
  };

  const baseDraft = {
    signalIds: ["sig-1"],
    clusterId: "cl-1",
    title: "Test Draft",
    body: "Draft body",
    severity: "medium" as const,
    severityScore: 5,
    releaseRisk: "safe" as const,
    releaseRiskReason: "Low impact",
    productArea: "auth",
    identifier: "AUTH-001",
    status: "pending" as const,
    approvalStatus: "draft" as const,
    slackSummary: "",
    customerReply: "",
    confidenceScores: { title: 0.5, rootCause: 0.5, severity: 0.5, area: 0.5, summary: 0.5 },
    issue: { title: "Draft", summary: "", reproSteps: "", labels: [] },
    userName: "user1",
    evidence: [],
  };

  const emptySignal = (sig: Signal) => {
    expect(sig.id).toBeTruthy();
    expect(sig.createdAt).toBeTruthy();
    expect(sig.updatedAt).toBeTruthy();
  };

  // --- Signal ---

  it("creates and retrieves a signal", () => {
    const store = createMemoryStore();
    const sig = store.createSignal(baseSignal);
    emptySignal(sig);
    expect(sig.source).toBe("slack");
    expect(store.getSignal(sig.id)).toEqual(sig);
  });

  it("returns null for missing signal", () => {
    const store = createMemoryStore();
    expect(store.getSignal("nonexistent")).toBeNull();
  });

  it("updates a signal", () => {
    const store = createMemoryStore();
    const sig = store.createSignal(baseSignal);
    const updated = store.updateSignal(sig.id, { title: "Updated Title" });
    expect(updated.title).toBe("Updated Title");
    expect(updated.updatedAt).toBeTruthy();
  });

  it("throws on updating nonexistent signal", () => {
    const store = createMemoryStore();
    expect(() => store.updateSignal("nope", { title: "x" })).toThrow("Signal nope not found");
  });

  it("returns all signals", () => {
    const store = createMemoryStore();
    const s1 = store.createSignal({ ...baseSignal, timestamp: "2024-01-01T00:00:00Z" });
    const s2 = store.createSignal({ ...baseSignal, timestamp: "2024-06-01T00:00:00Z", sourceMessageId: "msg-2" });
    const all = store.getSignals();
    expect(all.length).toBe(2);
    expect(all.find((s) => s.id === s1.id)).toBeTruthy();
    expect(all.find((s) => s.id === s2.id)).toBeTruthy();
  });

  // --- Cluster ---

  it("creates and retrieves a cluster", () => {
    const store = createMemoryStore();
    const cl = store.createCluster(baseCluster);
    expect(cl.id).toBeTruthy();
    expect(store.getCluster(cl.id)).toEqual(cl);
  });

  it("returns null for missing cluster", () => {
    const store = createMemoryStore();
    expect(store.getCluster("nope")).toBeNull();
  });

  it("updates a cluster", () => {
    const store = createMemoryStore();
    const cl = store.createCluster(baseCluster);
    const updated = store.updateCluster(cl.id, { title: "Updated" });
    expect(updated.title).toBe("Updated");
  });

  it("throws on updating nonexistent cluster", () => {
    const store = createMemoryStore();
    expect(() => store.updateCluster("nope", { title: "x" })).toThrow("Cluster nope not found");
  });

  it("returns clusters sorted by lastSeen desc", () => {
    const store = createMemoryStore();
    const c1 = store.createCluster({ ...baseCluster, lastSeen: "2024-01-01T00:00:00Z", title: "Old" });
    const c2 = store.createCluster({ ...baseCluster, lastSeen: "2024-06-01T00:00:00Z", title: "New", signalIds: ["sig-2"], primarySignalId: "sig-2" });
    const all = store.getClusters();
    expect(all[0].id).toBe(c2.id);
    expect(all[1].id).toBe(c1.id);
  });

  // --- Draft ---

  it("creates and retrieves a draft", () => {
    const store = createMemoryStore();
    const d = store.createDraft(baseDraft);
    expect(d.id).toBeTruthy();
    expect(store.getDraft(d.id)).toEqual(d);
  });

  it("returns null for missing draft", () => {
    const store = createMemoryStore();
    expect(store.getDraft("nope")).toBeNull();
  });

  it("updates a draft", () => {
    const store = createMemoryStore();
    const d = store.createDraft(baseDraft);
    const updated = store.updateDraft(d.id, { status: "approved" });
    expect(updated.status).toBe("approved");
  });

  it("throws on updating nonexistent draft", () => {
    const store = createMemoryStore();
    expect(() => store.updateDraft("nope", { status: "approved" })).toThrow("Draft nope not found");
  });

  it("returns all drafts", () => {
    const store = createMemoryStore();
    const d1 = store.createDraft(baseDraft);
    const d2 = store.createDraft({ ...baseDraft, title: "Draft 2", identifier: "AUTH-002" });
    const all = store.getDrafts();
    expect(all.length).toBe(2);
    expect(all.find((d) => d.id === d1.id)).toBeTruthy();
    expect(all.find((d) => d.id === d2.id)).toBeTruthy();
  });

  // --- Approval ---

  it("creates and retrieves an approval", () => {
    const store = createMemoryStore();
    const app = store.createApproval({ draftId: "d-1", status: "pending", approvedBy: "" });
    expect(app.id).toBeTruthy();
    expect(store.getApproval(app.id)).toEqual(app);
  });

  it("finds approval by draft ID", () => {
    const store = createMemoryStore();
    store.createApproval({ draftId: "d-1", status: "pending", approvedBy: "" });
    const app2 = store.createApproval({ draftId: "d-2", status: "approved", approvedBy: "admin" });
    const found = store.getApprovalByDraft("d-2");
    expect(found?.id).toBe(app2.id);
  });

  it("returns null for missing approval by draft ID", () => {
    const store = createMemoryStore();
    expect(store.getApprovalByDraft("nonexistent")).toBeNull();
  });

  it("updates an approval", () => {
    const store = createMemoryStore();
    const app = store.createApproval({ draftId: "d-1", status: "pending", approvedBy: "" });
    const updated = store.updateApproval(app.id, { status: "approved", approvedBy: "admin" });
    expect(updated.status).toBe("approved");
  });

  it("throws on updating nonexistent approval", () => {
    const store = createMemoryStore();
    expect(() => store.updateApproval("nope", { status: "approved" })).toThrow("Approval nope not found");
  });

  it("returns all approvals", () => {
    const store = createMemoryStore();
    const a1 = store.createApproval({ draftId: "d-1", status: "pending", approvedBy: "" });
    const a2 = store.createApproval({ draftId: "d-2", status: "pending", approvedBy: "" });
    const all = store.getApprovals();
    expect(all.length).toBe(2);
    expect(all.find((a) => a.id === a1.id)).toBeTruthy();
    expect(all.find((a) => a.id === a2.id)).toBeTruthy();
  });

  // --- Activity ---

  it("adds and retrieves activities", () => {
    const store = createMemoryStore();
    const act = store.addActivity({ type: "signal_created", message: "Test activity", userId: "user1", signalId: "sig-1" });
    expect(act.id).toBeTruthy();
    const all = store.getActivities();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(act.id);
  });

  it("returns all activities", () => {
    const store = createMemoryStore();
    const a1 = store.addActivity({ type: "signal_created", message: "First", userId: "u1" });
    const a2 = store.addActivity({ type: "signal_created", message: "Second", userId: "u1" });
    const all = store.getActivities();
    expect(all.length).toBe(2);
    expect(all.find((a) => a.id === a1.id)).toBeTruthy();
    expect(all.find((a) => a.id === a2.id)).toBeTruthy();
  });

  // --- Release ---

  it("creates and retrieves a release summary", () => {
    const store = createMemoryStore();
    const rel = store.createRelease({ summary: "Release notes", items: [], riskLevel: "low" });
    expect(rel.id).toBeTruthy();
    expect(store.getRelease(rel.id)).toEqual(rel);
  });

  it("returns null for missing release", () => {
    const store = createMemoryStore();
    expect(store.getRelease("nope")).toBeNull();
  });

  it("returns all releases", () => {
    const store = createMemoryStore();
    const r1 = store.createRelease({ summary: "Old", items: [], riskLevel: "low" });
    const r2 = store.createRelease({ summary: "New", items: [], riskLevel: "high" });
    const all = store.getReleases();
    expect(all.length).toBe(2);
    expect(all.find((r) => r.id === r1.id)).toBeTruthy();
    expect(all.find((r) => r.id === r2.id)).toBeTruthy();
  });

  // --- Clear ---

  it("clear removes all data", () => {
    const store = createMemoryStore();
    store.createSignal(baseSignal);
    store.createCluster(baseCluster);
    store.createDraft(baseDraft);
    store.clear();
    expect(store.getSignals().length).toBe(0);
    expect(store.getClusters().length).toBe(0);
    expect(store.getDrafts().length).toBe(0);
    expect(store.getApprovals().length).toBe(0);
    expect(store.getActivities().length).toBe(0);
    expect(store.getReleases().length).toBe(0);
  });
});
