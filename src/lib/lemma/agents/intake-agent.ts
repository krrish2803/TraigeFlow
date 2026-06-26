import type { SignalSource, EvidenceItem } from "../types";
import { callAI, parseJSON } from "@/lib/ai";

export interface IntakeInput {
  source: SignalSource;
  sourceMessageId?: string;
  body: string;
  author: string;
  channel?: string;
}

export interface IntakeOutput {
  cleanedText: string;
  type: "bug_report" | "feature_request" | "question" | "noise";
  productArea: string | null;
  affectedPlatform: string | null;
  urgencySignals: string[];
  hasErrorDetails: boolean;
  extractedError: string | null;
  noiseReason: string | null;
  confidence: number;
  evidence: EvidenceItem[];
}

const INTAKE_SYSTEM_PROMPT = `You are an intake analyst for a bug triage system. Analyze the signal and return JSON:
{
  "type": "bug_report" | "feature_request" | "question" | "noise",
  "productArea": string | null,
  "affectedPlatform": string | null,
  "urgencySignals": string[],
  "hasErrorDetails": boolean,
  "extractedError": string | null,
  "noiseReason": string | null,
  "confidence": number,
  "reasoning": string
}

Rules:
- "noise" = greeting, thanks, test message, too short (<20 chars), or non-informative
- "bug_report" = crash, error, timeout, failure, unexpected behavior
- "feature_request" = suggestion, would like, proposal, wish
- "question" = help-seeking, how-to, confusion
- productArea: auth, payments, onboarding, ui, api, performance, core_product
- affectedPlatform: ios, android, web, safari, chrome, null
- urgencySignals: "error_detected", "urgency_language", "widespread_impact"`;

export async function runIntakeAgent(input: IntakeInput): Promise<IntakeOutput> {
  const text = input.body;
  const evidence: EvidenceItem[] = [];

  const cleanedText = text
    .replace(/[👍👎🙌🎉👏🔥💯✅❌⭐💪🤔😊😢😡💀🖤💜💙💚💛🧡❤️🤍🤎🩵🩶🩷]/g, "")
    .trim();

  const aiResult = await callAI({
    systemPrompt: INTAKE_SYSTEM_PROMPT,
    prompt: `Signal from ${input.source} by ${input.author}:\n\n${cleanedText}\n\nAnalyze this signal.`,
    responseFormat: "json",
  });

  if (aiResult) {
    const parsed = parseJSON<{
      type: string;
      productArea: string | null;
      affectedPlatform: string | null;
      urgencySignals: string[];
      hasErrorDetails: boolean;
      extractedError: string | null;
      noiseReason: string | null;
      confidence: number;
      reasoning: string;
    }>(aiResult.content);

    if (parsed && ["bug_report", "feature_request", "question", "noise"].includes(parsed.type)) {
      evidence.push({
        type: "ai_intake",
        description: "AI-analyzed signal",
        confidence: parsed.confidence,
        details: parsed.reasoning || "",
      });
      return {
        cleanedText,
        type: parsed.type as IntakeOutput["type"],
        productArea: parsed.productArea,
        affectedPlatform: parsed.affectedPlatform,
        urgencySignals: parsed.urgencySignals || [],
        hasErrorDetails: parsed.hasErrorDetails || false,
        extractedError: parsed.extractedError,
        noiseReason: parsed.noiseReason,
        confidence: parsed.confidence,
        evidence,
      };
    }
  }

  // ── Fallback: heuristic ──────────────────────────────────────────
  const noisePatterns = [
    /^(thanks?!?|thx|ty|ok|okay|k|lol|lmao|rofl|haha)$/i,
    /^(test|testing|ignore|delete|remove)$/i,
    /^.{0,15}$/,
  ];
  const isNoise = noisePatterns.some((p) => p.test(cleanedText));

  let noiseReason: string | null = null;
  if (isNoise) {
    noiseReason = "Signal contains no engineering value (greeting, acknowledgment, or too short)";
    evidence.push({
      type: "noise_detection",
      description: "Signal classified as noise: too short or non-informative",
      confidence: 0.95,
      details: noiseReason,
    });
    return {
      cleanedText,
      type: "noise",
      productArea: null,
      affectedPlatform: null,
      urgencySignals: [],
      hasErrorDetails: false,
      extractedError: null,
      noiseReason,
      confidence: 0.95,
      evidence,
    };
  }

  const hasError = /error|exception|crash|timeout|fail|bug|500|50[0-9]/i.test(cleanedText);
  const extractedError =
    cleanedText.match(/(error|exception|crash|timeout)[:\s]*(.+)/i)?.[0] ??
    cleanedText.match(/(50[0-9]|404|403)[:\s]*(.+)/i)?.[0] ??
    null;

  if (hasError && extractedError) {
    evidence.push({
      type: "error_extraction",
      description: "Extracted error details from signal",
      confidence: 0.92,
      details: extractedError,
    });
  }

  const productAreaMatch =
    /login|signin|auth|password|oauth/i.test(cleanedText) ? "auth" :
    /payment|charge|billing|refund|checkout|paid/i.test(cleanedText) ? "payments" :
    /onboard|signup|register|setup|welcome/i.test(cleanedText) ? "onboarding" :
    /ui|button|layout|style|css|render|display/i.test(cleanedText) ? "ui" :
    /api|endpoint|rate.?limit|integration/i.test(cleanedText) ? "api" :
    /slow|timeout|lag|memory|perform/i.test(cleanedText) ? "performance" : null;

  const affectedPlatform =
    cleanedText.match(/ios|iphone|ipad|android|mobile|web|safari|chrome/i)?.[0]?.toLowerCase() ?? null;

  const urgencySignals: string[] = [];
  if (hasError) urgencySignals.push("error_detected");
  if (/urgent|asap|block|critical|down|broken/i.test(cleanedText)) urgencySignals.push("urgency_language");
  if (/customers?|users?|team|everyone/i.test(cleanedText)) urgencySignals.push("widespread_impact");

  evidence.push({
    type: "intake_analysis",
    description: "Signal cleaned and metadata extracted",
    confidence: 0.88,
    details: `Type: ${isNoise ? "noise" : hasError ? "bug_report" : "question"}, Platform: ${affectedPlatform ?? "unknown"}, Product Area: ${productAreaMatch ?? "core_product"}`,
  });

  const type = isNoise ? "noise" : hasError ? "bug_report" : /feature|would like|suggestion|propose/i.test(cleanedText) ? "feature_request" : "question";

  return {
    cleanedText,
    type,
    productArea: productAreaMatch,
    affectedPlatform,
    urgencySignals,
    hasErrorDetails: hasError,
    extractedError,
    noiseReason: null,
    confidence: isNoise ? 0.95 : hasError ? 0.88 : 0.78,
    evidence,
  };
}
