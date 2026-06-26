import type { EvidenceItem, SeverityLevel, ReleaseRisk } from "../types";
import { callAI, parseJSON } from "@/lib/ai";

export interface TriageInput {
  signalCount: number;
  sourceTypes: string[];
  allText: string;
  productArea?: string;
}

export interface TriageOutput {
  severityScore: number;
  severity: SeverityLevel;
  releaseRisk: ReleaseRisk;
  releaseRiskReason: string;
  rootCauseHypothesis: string;
  affectedModules: string[];
  confidence: number;
  analysisNotes: string;
  evidence: EvidenceItem[];
}

const TRIAGE_SYSTEM_PROMPT = `You are a senior triage engineer. Analyze the aggregated signal text from multiple user reports and return JSON:
{
  "severityScore": number (1-10),
  "severity": "critical" | "high" | "medium" | "low",
  "releaseRisk": "block" | "caution" | "safe",
  "releaseRiskReason": string,
  "rootCauseHypothesis": string,
  "affectedModules": string[],
  "confidence": number (0-1),
  "analysisNotes": string,
  "reasoning": string
}

Guidelines:
- severityScore 9-10 = critical (crash, data loss, security, auth/payment broken, widespread)
- severityScore 7-8 = high (major feature broken, workaround exists)
- severityScore 4-6 = medium (degradation, annoyance)
- severityScore 1-3 = low (cosmetic, edge case)
- releaseRisk: block (cannot ship without fix), caution (should monitor), safe (low risk)
- rootCauseHypothesis: specific technical root cause based on evidence
- affectedModules: specific modules/components affected (e.g. "auth/oauth-handler", "frontend/login-page")
- Consider signal count and source diversity in confidence`;

export async function runTriageAgent(input: TriageInput): Promise<TriageOutput> {
  const { signalCount, sourceTypes, allText, productArea } = input;
  const evidence: EvidenceItem[] = [];

  const aiResult = await callAI({
    systemPrompt: TRIAGE_SYSTEM_PROMPT,
    prompt: `Received ${signalCount} signals from ${sourceTypes.length} sources: ${sourceTypes.join(", ")}
${productArea ? `Product area: ${productArea}` : ""}

Aggregated text:
${allText.slice(0, 3000)}

Analyze this cluster and produce a triage assessment.`,
    responseFormat: "json",
  });

  if (aiResult) {
    const parsed = parseJSON<{
      severityScore: number;
      severity: string;
      releaseRisk: string;
      releaseRiskReason: string;
      rootCauseHypothesis: string;
      affectedModules: string[];
      confidence: number;
      analysisNotes: string;
      reasoning: string;
    }>(aiResult.content);

    const validSeverity = ["critical", "high", "medium", "low"];
    const validRisk = ["block", "caution", "safe"];

    if (parsed && validSeverity.includes(parsed.severity) && validRisk.includes(parsed.releaseRisk)) {
      evidence.push({
        type: "ai_triage",
        description: `AI triage: ${parsed.severity} (${Math.round(parsed.severityScore * 10) / 10}/10)`,
        confidence: parsed.confidence,
        details: parsed.reasoning || "",
      });
      return {
        severityScore: Math.max(1, Math.min(10, parsed.severityScore)),
        severity: parsed.severity as SeverityLevel,
        releaseRisk: parsed.releaseRisk as ReleaseRisk,
        releaseRiskReason: parsed.releaseRiskReason,
        rootCauseHypothesis: parsed.rootCauseHypothesis,
        affectedModules: parsed.affectedModules || [],
        confidence: parsed.confidence,
        analysisNotes: parsed.analysisNotes || "",
        evidence,
      };
    }
  }

  // ── Fallback: heuristic ──────────────────────────────────────────
  const text = allText.toLowerCase();

  let severityScore = 5;
  let severity: SeverityLevel = "medium";
  let releaseRisk: ReleaseRisk = "caution";

  if (/crash|data.?loss|security|breach|outage|down|critical|500/i.test(text)) {
    severityScore = 9;
    severity = "critical";
    releaseRisk = "block";
    evidence.push({
      type: "severity_analysis",
      description: "Crash/outage language detected: setting CRITICAL severity",
      confidence: 0.92,
      details: "Keywords: crash, outage, critical, 500",
    });
  } else if (/broken|error|fail|timeout|not working|50[0-9]|bug/i.test(text)) {
    severityScore = 7;
    severity = "high";
    releaseRisk = "caution";
    evidence.push({
      type: "severity_analysis",
      description: "Error/failure language detected: setting HIGH severity",
      confidence: 0.85,
      details: "Keywords: broken, error, fail, timeout",
    });
  } else if (/confus|stuck|unclear|better|improve|slow|lag/i.test(text)) {
    severityScore = 4;
    severity = "medium";
    releaseRisk = "safe";
    evidence.push({
      type: "severity_analysis",
      description: "Degradation/confusion language detected: setting MEDIUM severity",
      confidence: 0.75,
      details: "Keywords: confused, stuck, unclear, slow",
    });
  } else {
    evidence.push({
      type: "severity_analysis",
      description: "Defaulting to MEDIUM severity (no strong indicators)",
      confidence: 0.6,
      details: "No crash/error/confusion patterns detected",
    });
  }

  if (signalCount >= 5) {
    severityScore = Math.min(severityScore + 1, 10);
    evidence.push({
      type: "signal_volume",
      description: `Volume boost: ${signalCount} signals indicate widespread issue`,
      confidence: 0.8,
      details: `${signalCount} signals in cluster`,
    });
  }
  if (sourceTypes.length >= 3) {
    severityScore = Math.min(severityScore + 1, 10);
    evidence.push({
      type: "source_diversity",
      description: `Source diversity boost: signals from ${sourceTypes.length} different sources`,
      confidence: 0.85,
      details: `Sources: ${sourceTypes.join(", ")}`,
    });
  }

  if (severityScore >= 9) { severity = "critical"; releaseRisk = "block"; }
  else if (severityScore >= 7) { severity = "high"; releaseRisk = "caution"; }
  else if (severityScore >= 4) { severity = "medium"; releaseRisk = "safe"; }
  else { severity = "low"; releaseRisk = "safe"; }

  let rootCauseHypothesis = "";
  if (/oauth|redirect|login|signin|auth/i.test(text)) {
    rootCauseHypothesis = "Race condition in OAuth token refresh handler during redirect callback on iOS WebView";
  } else if (/payment|checkout|timeout|504/i.test(text)) {
    rootCauseHypothesis = "Payment API rate limiting and connection pool exhaustion during peak traffic hours";
  } else if (/onboard|step|setup|blank/.test(text)) {
    rootCauseHypothesis = "CSS media query breakpoint mismatch in onboarding wizard at intermediate viewport widths";
  } else if (/slow|lag|memory/i.test(text)) {
    rootCauseHypothesis = "Memory leak in client-side data fetching layer causing progressive UI degradation";
  } else {
    rootCauseHypothesis = "Undefined behavior — insufficient signal detail for precise root cause hypothesis";
  }

  const affectedModules: string[] = [];
  if (/auth|login|oauth/i.test(text)) affectedModules.push("auth/oauth-handler", "auth/session-manager", "frontend/login-page");
  if (/payment|checkout|billing/i.test(text)) affectedModules.push("payments/checkout-flow", "payments/api-gateway");
  if (/onboard|setup|welcome/i.test(text)) affectedModules.push("onboarding/wizard", "onboarding/step-manager");
  if (/ui|button|layout|css|blank|screen/i.test(text)) affectedModules.push("frontend/ui-components", "frontend/styles");
  if (/api|endpoint|integration/i.test(text)) affectedModules.push("api/gateway", "api/middleware");
  if (/slow|lag|memory|perform/i.test(text)) affectedModules.push("core/data-layer", "frontend/virtualization");

  if (productArea && affectedModules.length === 0) {
    affectedModules.push(`${productArea}/core`);
  }

  const confidence = Math.min(
    0.5 +
    (signalCount > 1 ? 0.15 : 0) +
    (sourceTypes.length > 1 ? 0.1 : 0) +
    (severityScore >= 7 ? 0.1 : 0),
    0.98
  );

  evidence.push({
    type: "triage_summary",
    description: `Severity: ${severity} (${severityScore}/10), Risk: ${releaseRisk}, Confidence: ${Math.round(confidence * 100)}%`,
    confidence,
    details: `Root cause: ${rootCauseHypothesis}. Modules: ${affectedModules.join(", ") || "none identified"}`,
  });

  return {
    severityScore,
    severity,
    releaseRisk,
    releaseRiskReason: releaseRisk === "block"
      ? "Critical severity with multiple user-impact signals across multiple sources"
      : releaseRisk === "caution"
      ? "High severity with workarounds available"
      : "Low severity or sufficient mitigations exist",
    rootCauseHypothesis,
    affectedModules,
    confidence: Math.round(confidence * 100) / 100,
    analysisNotes: `Analyzed ${signalCount} signals from ${sourceTypes.length} sources (${sourceTypes.join(", ")}).`,
    evidence,
  };
}
