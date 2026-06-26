import type { EvidenceItem, Draft } from "../types";

export interface ReviewInput {
  draft: Partial<Draft>;
}

export interface ReviewOutput {
  approved: boolean;
  reviewReason: string;
  missingFields: string[];
  confidence: number;
  evidence: EvidenceItem[];
}

const REQUIRED_FIELDS: Array<{ key: keyof Draft; label: string }> = [
  { key: "title", label: "Title" },
  { key: "summary", label: "Summary" },
  { key: "reproductionSteps", label: "Reproduction steps" },
  { key: "expectedBehavior", label: "Expected behavior" },
  { key: "actualBehavior", label: "Actual behavior" },
  { key: "severity", label: "Severity rating" },
  { key: "ownerSuggestion", label: "Owner suggestion" },
];

export function runReviewAgent(input: ReviewInput): ReviewOutput {
  const { draft } = input;
  const evidence: EvidenceItem[] = [];
  const missingFields: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = draft[field.key];
    if (!value || (typeof value === "string" && value.trim().length === 0)) {
      missingFields.push(field.label);
    }
  }

  if (missingFields.length === 0) {
    evidence.push({
      type: "review_check",
      description: "All required fields present — draft passes review",
      confidence: 0.95,
      details: `Checked ${REQUIRED_FIELDS.length} required fields, all present`,
    });
    return {
      approved: true,
      reviewReason: "All required fields are present and valid",
      missingFields: [],
      confidence: 0.95,
      evidence,
    };
  }

  for (const field of missingFields) {
    evidence.push({
      type: "review_issue",
      description: `Missing required field: ${field}`,
      confidence: 0.99,
      details: `${field} is empty or not set`,
    });
  }

  return {
    approved: false,
    reviewReason: `Missing ${missingFields.length} required field(s): ${missingFields.join(", ")}`,
    missingFields,
    confidence: 0.95,
    evidence,
  };
}
