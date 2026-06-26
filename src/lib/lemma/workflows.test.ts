import { describe, it, expect, vi, beforeEach } from "vitest";
import { ingestSignalWorkflow, rejectDraftWorkflow, recomputeReleaseSummaryWorkflow } from "./workflows";

// Mock the store
const mockStore = {
  getSignal: vi.fn(),
  updateSignal: vi.fn(),
  addActivity: vi.fn(),
  getDraft: vi.fn(),
  updateDraft: vi.fn(),
  createApproval: vi.fn(),
  createRelease: vi.fn(),
  getDrafts: vi.fn(),
  getClusters: vi.fn(),
  getCluster: vi.fn(),
};

vi.mock("./store", () => ({
  getStore: () => mockStore,
}));

// Mock AI agents to test fallback paths deterministically
vi.mock("./agents/intake-agent", () => ({
  runIntakeAgent: vi.fn().mockResolvedValue({
    cleanedText: "test signal body",
    type: "bug_report",
    productArea: "auth",
    affectedPlatform: "ios",
    urgencySignals: [],
    hasErrorDetails: true,
    extractedError: "crash on login",
    noiseReason: null,
    confidence: 0.92,
    evidence: [{ type: "test", description: "test evidence", confidence: 1 }],
  }),
}));

vi.mock("./agents/release-risk-agent", () => ({
  runReleaseRiskAgent: vi.fn().mockReturnValue({
    riskLevel: "safe",
    riskScore: 0,
    highlights: ["No release risks detected"],
    reasoning: "All clear",
  }),
}));

describe("ingestSignalWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failed when signal not found", async () => {
    mockStore.getSignal.mockReturnValue(null);
    const result = await ingestSignalWorkflow({ signalId: "nonexistent" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Signal not found");
  });

  it("returns noise status when intake classifies as noise", async () => {
    // Override the mock to return noise
    const intakeModule = await import("./agents/intake-agent");
    vi.mocked(intakeModule.runIntakeAgent).mockResolvedValueOnce({
      cleanedText: "thanks!",
      type: "noise",
      productArea: null,
      affectedPlatform: null,
      urgencySignals: [],
      hasErrorDetails: false,
      extractedError: null,
      noiseReason: "too short",
      confidence: 0.95,
      evidence: [{ type: "noise_detection", description: "noise", confidence: 0.95 }],
    });

    mockStore.getSignal.mockReturnValue({
      id: "sig-1",
      source: "slack",
      title: "Test",
      body: "thanks!",
      author: "user",
      evidence: [],
    });

    const result = await ingestSignalWorkflow({ signalId: "sig-1" });
    expect(result.success).toBe(true);
    expect(result.status).toBe("noise");
    expect(mockStore.updateSignal).toHaveBeenCalledWith("sig-1", expect.objectContaining({ status: "noise" }));
  });

  it("completes successfully for a valid signal", async () => {
    mockStore.getSignal.mockReturnValue({
      id: "sig-2",
      source: "github",
      title: "Bug report",
      body: "the app crashes during payment",
      author: "user",
      evidence: [],
    });

    const intakeModule = await import("./agents/intake-agent");
    vi.mocked(intakeModule.runIntakeAgent).mockResolvedValueOnce({
      cleanedText: "the app crashes during payment",
      type: "bug_report",
      productArea: "payments",
      affectedPlatform: null,
      urgencySignals: ["error_detected"],
      hasErrorDetails: true,
      extractedError: "crash",
      noiseReason: null,
      confidence: 0.92,
      evidence: [],
    });

    const result = await ingestSignalWorkflow({ signalId: "sig-2" });
    expect(result.success).toBe(true);
    expect(result.status).toBe("completed");
    expect(mockStore.updateSignal).toHaveBeenCalled();
    expect(mockStore.addActivity).toHaveBeenCalled();
  });
});

describe("rejectDraftWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failed when draft not found", async () => {
    mockStore.getDraft.mockReturnValue(null);
    const result = await rejectDraftWorkflow("nonexistent");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("returns failed when draft is not pending", async () => {
    mockStore.getDraft.mockReturnValue({ id: "draft-1", approvalStatus: "approved", title: "Test" });
    const result = await rejectDraftWorkflow("draft-1", "Reviewer", "Not needed");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not pending");
  });

  it("rejects a pending draft successfully", async () => {
    mockStore.getDraft.mockReturnValue({ id: "draft-1", approvalStatus: "pending", title: "Bug fix needed" });
    mockStore.createApproval.mockReturnValue({ id: "approval-1" });

    const result = await rejectDraftWorkflow("draft-1", "Reviewer", "Duplicate issue");
    expect(result.success).toBe(true);
    expect(result.status).toBe("rejected");
    expect(mockStore.createApproval).toHaveBeenCalledWith({
      draftId: "draft-1",
      status: "rejected",
      approver: "Reviewer",
      reason: "Duplicate issue",
    });
    expect(mockStore.updateDraft).toHaveBeenCalledWith("draft-1", {
      approvalStatus: "rejected",
      reviewReason: "Duplicate issue",
    });
  });
});

describe("recomputeReleaseSummaryWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a release summary with safe risk when no blockers", async () => {
    mockStore.getDrafts.mockReturnValue([]);
    mockStore.getClusters.mockReturnValue([]);
    mockStore.createRelease.mockReturnValue({ id: "release-1" });

    const result = await recomputeReleaseSummaryWorkflow();
    expect(result.success).toBe(true);
    expect(result.status).toBe("completed");
    expect(mockStore.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        blockCount: 0,
        cautionCount: 0,
        safeCount: 0,
      })
    );
  });

  it("categories drafts by release risk", async () => {
    mockStore.getDrafts.mockReturnValue([
      { id: "d-1", releaseRisk: "block", approvalStatus: "pending", title: "Blocker 1", identifier: "BUG-1" },
      { id: "d-2", releaseRisk: "block", approvalStatus: "pending", title: "Blocker 2", identifier: "BUG-2" },
      { id: "d-3", releaseRisk: "caution", approvalStatus: "pending", title: "Caution 1", identifier: "BUG-3" },
      { id: "d-4", releaseRisk: "safe", approvalStatus: "pending", title: "Safe 1", identifier: "BUG-4" },
      { id: "d-5", releaseRisk: "safe", approvalStatus: "approved", title: "Approved 1", identifier: "BUG-5" },
    ]);
    mockStore.getClusters.mockReturnValue([]);
    mockStore.createRelease.mockReturnValue({ id: "release-2" });

    const result = await recomputeReleaseSummaryWorkflow();
    expect(result.success).toBe(true);
    expect(mockStore.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        blockCount: 2,
        cautionCount: 1,
        safeCount: 1,
      })
    );
  });
});
