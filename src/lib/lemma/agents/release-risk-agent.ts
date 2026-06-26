import type { Draft, ReleaseRisk } from "../types";

export interface ReleaseRiskInput {
  drafts: Draft[];
  blockCount: number;
  cautionCount: number;
  safeCount: number;
  approvedCount: number;
}

export interface ReleaseRiskOutput {
  riskLevel: ReleaseRisk;
  riskScore: number;
  highlights: string[];
  reasoning: string;
}

export function runReleaseRiskAgent(input: ReleaseRiskInput): ReleaseRiskOutput {
  const { blockCount, cautionCount, safeCount, approvedCount, drafts } = input;

  const riskScore = blockCount * 10 + cautionCount * 5;

  let riskLevel: ReleaseRisk;
  if (blockCount > 0) {
    riskLevel = "block";
  } else if (cautionCount > 2 || riskScore >= 15) {
    riskLevel = "caution";
  } else {
    riskLevel = "safe";
  }

  const highlights: string[] = [];
  if (blockCount > 0) {
    const blockers = drafts.filter((d) => d.releaseRisk === "block" && d.approvalStatus === "pending");
    highlights.push(`${blockCount} blocker(s) preventing release`);
    for (const b of blockers.slice(0, 3)) {
      highlights.push(`  - ${b.title} (${b.identifier})`);
    }
  }
  if (cautionCount > 0) {
    highlights.push(`${cautionCount} item(s) requiring monitoring`);
  }
  if (approvedCount > 0) {
    highlights.push(`${approvedCount} issue(s) filed this cycle`);
  }
  if (safeCount > 0) {
    highlights.push(`${safeCount} item(s) cleared for release`);
  }
  if (blockCount === 0 && cautionCount === 0 && approvedCount === 0 && safeCount === 0) {
    highlights.push("No release risks detected");
  }

  const reasoning = [
    `Risk score: ${riskScore}/100`,
    blockCount > 0 ? `${blockCount} blocker(s)` : "No blockers",
    cautionCount > 0 ? `${cautionCount} caution(s)` : "No cautions",
    approvedCount > 0 ? `${approvedCount} issue(s) already filed` : "No issues filed yet",
    riskLevel === "block" ? "Release blocked: critical issues must be resolved first" :
    riskLevel === "caution" ? "Release caution: monitor flagged items before shipping" :
    "Release safe: no blocking issues detected",
  ].join(". ");

  return { riskLevel, riskScore, highlights, reasoning };
}
