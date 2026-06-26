import type { EvidenceItem, ReleaseRisk, SeverityLevel } from "../types";
import { callAI, parseJSON } from "@/lib/ai";

export interface DraftInput {
  signals: Array<{ source: string; body: string; author: string }>;
  rootCauseHypothesis: string;
  severity: SeverityLevel;
  severityScore: number;
  releaseRisk: ReleaseRisk;
  releaseRiskReason: string;
  affectedModules: string[];
  confidence: number;
  productArea?: string;
}

export interface DraftOutput {
  issue: {
    title: string;
    summary: string;
    reproSteps: string;
    expectedBehavior: string;
    actualBehavior: string;
    suggestedOwnerArea: string;
    labels: string[];
  };
  identifier: string;
  customerReply: string;
  slackSummary: string;
  confidenceScores: {
    title: number;
    reproSteps: number;
    rootCause: number;
  };
  evidence: EvidenceItem[];
}

const DRAFT_SYSTEM_PROMPT = `You are a technical writer for an engineering team. Generate a structured bug report from user reports. Return JSON:
{
  "title": string (concise, <80 chars, prefixed with area like "[Auth]"),
  "summary": string (2-3 sentences synthesizing all reports),
  "reproSteps": string (numbered steps),
  "expectedBehavior": string,
  "actualBehavior": string,
  "suggestedOwnerArea": string,
  "labels": string[],
  "customerReply": string (friendly, empathetic response to customers),
  "slackSummary": string (brief slack message for internal channel),
  "reasoning": string
}

Guidelines:
- Title: Use area prefix like [Auth], [Payments], [Onboarding], [UI], [API], [Performance], [Bug]
- Repro steps: Be specific based on user descriptions. If users mention specific actions, include them.
- Expected vs Actual: Clear, concise, distinguishable
- Customer reply: Empathetic, mention tracking ID, set expectations on fix timeline
- Slack summary: Concise for engineers, includerisk level and affected modules`;

const AREA_PREFIXES: Record<string, string> = {
  auth: "[Auth]",
  payments: "[Payments]",
  onboarding: "[Onboarding]",
  ui: "[UI]",
  api: "[API]",
  performance: "[Performance]",
  notifications: "[Notifications]",
  core_product: "[Bug]",
};

export async function runDraftAgent(input: DraftInput): Promise<DraftOutput> {
  const { signals, rootCauseHypothesis, severity, severityScore, releaseRisk, affectedModules, confidence, productArea } = input;
  const evidence: EvidenceItem[] = [];

  const area = productArea || "core_product";
  const prefix = AREA_PREFIXES[area] || "[Bug]";

  const userReportsText = signals
    .map((s, i) => `[Report ${i + 1}] (${s.source}) ${s.author}: ${s.body}`)
    .join("\n\n");

  const aiResult = await callAI({
    systemPrompt: DRAFT_SYSTEM_PROMPT,
    prompt: `Root cause hypothesis: ${rootCauseHypothesis}
Severity: ${severity} (${severityScore}/10)
Release risk: ${releaseRisk}
Affected modules: ${affectedModules.join(", ") || "N/A"}
Product area: ${area}

User reports:
${userReportsText}

Generate a structured engineering issue.`,
    responseFormat: "json",
  });

  if (aiResult) {
    const parsed = parseJSON<{
      title: string;
      summary: string;
      reproSteps: string;
      expectedBehavior: string;
      actualBehavior: string;
      suggestedOwnerArea: string;
      labels: string[];
      customerReply: string;
      slackSummary: string;
      reasoning: string;
    }>(aiResult.content);

    if (parsed && parsed.title && parsed.summary) {
      evidence.push({
        type: "ai_draft",
        description: `AI-generated draft: ${parsed.title}`,
        confidence: 0.88,
        details: parsed.reasoning || "",
      });

      const idPrefix = area === "auth" ? "AUTH" : area === "payments" ? "PAY" : area === "onboarding" ? "ONB" : area === "ui" ? "UI" : area === "api" ? "API" : area === "performance" ? "PERF" : "BUG";
      const idNum = String(Math.floor(100 + Math.random() * 900));
      const identifier = `${idPrefix}-${idNum}`;

      return {
        issue: {
          title: parsed.title,
          summary: parsed.summary,
          reproSteps: parsed.reproSteps || "1. Navigate to the affected area\n2. Perform the action described\n3. Observe the unexpected behavior",
          expectedBehavior: parsed.expectedBehavior || "The system should operate normally without errors or degradation.",
          actualBehavior: parsed.actualBehavior || `Users experience ${severity === "critical" ? "a complete failure" : "significant degradation"}.`,
          suggestedOwnerArea: parsed.suggestedOwnerArea || area,
          labels: Array.from(new Set([...parsed.labels, severity, releaseRisk === "block" ? "release-blocker" : null].filter(Boolean))) as string[],
        },
        identifier,
        customerReply: parsed.customerReply || `Thank you for reporting this. We've logged it as ${identifier} and are investigating.`,
        slackSummary: parsed.slackSummary || `${prefix} ${rootCauseHypothesis.split(" — ")[0] || rootCauseHypothesis}`,
        confidenceScores: {
          title: 0.9,
          reproSteps: parsed.reproSteps.includes("1.") ? 0.85 : 0.62,
          rootCause: confidence,
        },
        evidence,
      };
    }
  }

  // ── Fallback: heuristic ──────────────────────────────────────────
  const title = `${prefix} ${rootCauseHypothesis.split(" — ")[0] || rootCauseHypothesis}`;

  const sourceTypes = Array.from(new Set(signals.map((s) => s.source)));
  const summary = `${signals.length} user reports across ${sourceTypes.length} sources (${sourceTypes.join(", ")}) describe ${rootCauseHypothesis.toLowerCase()}. ${severityScore >= 7 ? "This is affecting a significant portion of users and requires immediate attention." : "The issue is reproducible and should be addressed in the current cycle."}`;

  const detailedSignal = signals.find((s) => s.body.length > 100) || signals[0];
  const reproStepsLines = detailedSignal?.body.split("\n").filter((l) => /^\d+\./i.test(l)) || [];
  const reproSteps = reproStepsLines.length > 2
    ? reproStepsLines.join("\n")
    : "1. Navigate to the affected area\n2. Perform the action described\n3. Observe the unexpected behavior";

  const actualBehavior = `Users experience ${severity === "critical" ? "a complete failure" : severity === "high" ? "significant degradation" : "unexpected behavior"}. ${rootCauseHypothesis}`;

  const suggestedOwnerArea = affectedModules[0]?.split("/")[0] || area;

  const labels = [
    severity,
    releaseRisk === "block" ? "release-blocker" : null,
    signals.length >= 3 ? "multiple-reports" : null,
    sourceTypes.length >= 2 ? "cross-source" : null,
    productArea || null,
  ].filter(Boolean) as string[];

  evidence.push({
    type: "draft_generation",
    description: `Generated issue draft: ${title}`,
    confidence: 0.85,
    details: `Area: ${area}, Labels: ${labels.join(", ")}, Suggested owner: ${suggestedOwnerArea}`,
  });

  const idPrefix = area === "auth" ? "AUTH" : area === "payments" ? "PAY" : area === "onboarding" ? "ONB" : area === "ui" ? "UI" : area === "api" ? "API" : area === "performance" ? "PERF" : "BUG";
  const idNum = String(Math.floor(100 + Math.random() * 900));
  const identifier = `${idPrefix}-${idNum}`;

  const customerReply = `Thank you for reporting this issue. We've logged it in our engineering system as "${title}" (${identifier}) and our team is investigating. ${severity === "critical" ? "Given the severity, we are prioritizing this as a critical fix and expect an update within 24 hours." : severity === "high" ? "Our team is actively working on this and we expect to have a fix in the next release." : "We've added this to our backlog and will address it in an upcoming sprint."} We'll update you as soon as we have more information.`;

  const slackSummary = `${prefix} ${rootCauseHypothesis.split(" — ")[0] || rootCauseHypothesis}\n${signals.length} reports across ${sourceTypes.length} channels. ${releaseRisk === "block" ? "This is a release blocker." : releaseRisk === "caution" ? "Should be monitored closely." : "Low risk, can ship."} Root cause: ${rootCauseHypothesis}.${affectedModules.length > 0 ? ` Affects: ${affectedModules.join(", ")}.` : ""}`;

  return {
    issue: {
      title,
      summary,
      reproSteps,
      expectedBehavior: "The system should operate normally without errors or degradation in user experience.",
      actualBehavior,
      suggestedOwnerArea,
      labels,
    },
    identifier,
    customerReply,
    slackSummary,
    confidenceScores: {
      title: confidence >= 0.8 ? 0.92 : confidence >= 0.6 ? 0.78 : 0.55,
      reproSteps: detailedSignal?.body.includes("step") || reproStepsLines.length > 0 ? 0.88 : 0.62,
      rootCause: confidence,
    },
    evidence,
  };
}
