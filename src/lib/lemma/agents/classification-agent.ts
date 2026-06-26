import type { EvidenceItem, SignalLabel, SeverityLevel } from "../types";
import { callAI, parseJSON } from "@/lib/ai";

export interface ClassificationInput {
  cleanedText: string;
  source: string;
}

export interface ClassificationOutput {
  label: SignalLabel;
  urgency: SeverityLevel;
  productArea: string;
  severityBoostReason: string | null;
  classificationConfidence: number;
  keyPhrases: string[];
  evidence: EvidenceItem[];
}

const CLASSIFY_SYSTEM_PROMPT = `You are a classification agent for a bug triage system. Analyze the signal text and return JSON:
{
  "label": "bug" | "feature" | "question" | "noise" | "duplicate",
  "urgency": "critical" | "high" | "medium" | "low",
  "productArea": string,
  "severityBoostReason": string | null,
  "confidence": number,
  "keyPhrases": string[],
  "reasoning": string
}

Rules:
- "bug" = error, crash, failure, unexpected behavior, broken
- "feature" = suggestion, would like, proposal, feature request
- "question" = how-to, help, confusion, setup issue
- "noise" = greeting, thanks, test, short non-informative
- "duplicate" = clearly the same issue as another known pattern
- urgency: critical (data loss, security, auth broken, payment failing, crash), high (major feature broken), medium (degradation), low (cosmetic)
- productArea: auth, payments, onboarding, ui, api, performance, notifications, core_product`;

export async function runClassificationAgent(input: ClassificationInput): Promise<ClassificationOutput> {
  const { cleanedText } = input;
  const evidence: EvidenceItem[] = [];

  const aiResult = await callAI({
    systemPrompt: CLASSIFY_SYSTEM_PROMPT,
    prompt: `Source: ${input.source}\nSignal text: ${cleanedText}\n\nClassify this signal.`,
    responseFormat: "json",
  });

  if (aiResult) {
    const parsed = parseJSON<{
      label: string;
      urgency: string;
      productArea: string;
      severityBoostReason: string | null;
      confidence: number;
      keyPhrases: string[];
      reasoning: string;
    }>(aiResult.content);

    const validLabels = ["bug", "feature", "question", "noise", "duplicate"];
    const validUrgency = ["critical", "high", "medium", "low"];

    if (parsed && validLabels.includes(parsed.label) && validUrgency.includes(parsed.urgency)) {
      evidence.push({
        type: "ai_classification",
        description: `AI classified as ${parsed.label} (${parsed.urgency})`,
        confidence: parsed.confidence,
        details: parsed.reasoning || "",
      });
      return {
        label: parsed.label as SignalLabel,
        urgency: parsed.urgency as SeverityLevel,
        productArea: parsed.productArea || "core_product",
        severityBoostReason: parsed.severityBoostReason,
        classificationConfidence: parsed.confidence,
        keyPhrases: parsed.keyPhrases || [],
        evidence,
      };
    }
  }

  // ── Fallback: heuristic ──────────────────────────────────────────
  const text = cleanedText.toLowerCase();
  const keyPhrases: string[] = [];

  let label: SignalLabel = "bug";
  if (/feature|would like|suggestion|propose|wish|dark mode|add support/i.test(text)) {
    label = "feature";
    evidence.push({
      type: "classification",
      description: "Identified as feature request based on suggestion language",
      confidence: 0.85,
      details: "Matched patterns: feature, would like, suggestion",
    });
  } else if (/how do|how to|what is|question|help understand|confused|what does/i.test(text)) {
    label = "question";
    evidence.push({
      type: "classification",
      description: "Identified as support question based on help-seeking language",
      confidence: 0.82,
      details: "Matched patterns: how do, how to, what is",
    });
  } else {
    evidence.push({
      type: "classification",
      description: "Identified as bug report by default (error/failure present)",
      confidence: 0.78,
      details: "No feature request or question patterns detected",
    });
  }

  let urgency: SeverityLevel = "medium";
  const severityBoosts: string[] = [];

  if (/login|signin|auth|password|oauth/i.test(text)) {
    urgency = "high";
    severityBoosts.push("Auth-related: boosted to HIGH");
    if (/crash|broken|down|error|500/i.test(text)) {
      urgency = "critical";
      severityBoosts.push("Auth + crash: boosted to CRITICAL");
    }
  }

  if (/payment|charge|billing|refund|checkout|paid|purchase|subscription/i.test(text)) {
    urgency = "critical";
    severityBoosts.push("Payment-related: boosted to CRITICAL");
  }

  if (/data.?loss|deleted|gone|missing|lost|security|breach/i.test(text)) {
    urgency = "critical";
    severityBoosts.push("Data-loss/security keywords: boosted to CRITICAL");
  }

  if (/all users|everyone|nobody can|whole team|everyone|half the team/i.test(text)) {
    severityBoosts.push("Widespread impact detected: boost one level");
    if (urgency === "medium") urgency = "high";
    else if (urgency === "high") urgency = "critical";
  }

  if (/crash|panic|segfault|exception/i.test(text)) keyPhrases.push("crash_or_exception");
  if (/timeout|slow|lag|delay/i.test(text)) keyPhrases.push("performance_issue");
  if (/ui|button|style|layout|css|render|blank|white|screen/i.test(text)) keyPhrases.push("ui_or_rendering");
  if (/api|endpoint|integration|webhook/i.test(text)) keyPhrases.push("api_or_integration");
  if (/version|update|upgrade|release/i.test(text)) keyPhrases.push("version_or_release");

  let productArea = "core_product";
  if (/login|signin|auth|password|oauth|session|permission|role/i.test(text)) productArea = "auth";
  else if (/payment|charge|billing|refund|checkout|subscription|paid/i.test(text)) productArea = "payments";
  else if (/onboard|signup|register|setup|welcome|tutorial|step/i.test(text)) productArea = "onboarding";
  else if (/ui|button|layout|style|css|render|theme|display/i.test(text)) productArea = "ui";
  else if (/api|endpoint|rate.?limit|integration|webhook/i.test(text)) productArea = "api";
  else if (/slow|timeout|lag|memory|perform/i.test(text)) productArea = "performance";
  else if (/email|push|notif|alert/i.test(text)) productArea = "notifications";

  const confidence = severityBoosts.length > 0 ? 0.92 : 0.78;

  if (severityBoosts.length > 0) {
    evidence.push({
      type: "severity_boost",
      description: severityBoosts.join("; "),
      confidence: 0.9,
      details: `Final urgency: ${urgency}`,
    });
  }

  evidence.push({
    type: "classification_summary",
    description: `Label: ${label}, Urgency: ${urgency}, Area: ${productArea}`,
    confidence,
    details: `Key phrases: ${keyPhrases.length > 0 ? keyPhrases.join(", ") : "none"}`,
  });

  return {
    label,
    urgency,
    productArea,
    severityBoostReason: severityBoosts.length > 0 ? severityBoosts.join("; ") : null,
    classificationConfidence: confidence,
    keyPhrases,
    evidence,
  };
}
