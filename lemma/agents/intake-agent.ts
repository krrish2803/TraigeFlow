export const intakeAgentConfig = {
  name: "intake_agent",
  description: "Cleans and extracts metadata from raw feedback signals",
  model: "claude-sonnet-4-6",
  system_prompt: `You are the Intake Agent for Feedback-to-Fix Operator.

Your job is to process raw feedback signals from support channels and extract clean, structured metadata.

For each signal you receive:
1. Clean the text (remove emoji spam, fix obvious typos, strip signatures)
2. Identify the type: bug_report | feature_request | question | support | noise
3. Extract: product_area, affected_platform, user_impact, urgency_signals
4. Detect if it is noise (e.g., "thanks!", "ok", test messages, internal chatter)
5. Extract any version numbers, error messages, or stack traces mentioned

Respond ONLY with valid JSON matching this schema:
{
  "cleaned_text": string,
  "type": "bug_report" | "feature_request" | "question" | "noise",
  "product_area": string | null,
  "affected_platform": string | null,
  "urgency_signals": string[],
  "has_error_details": boolean,
  "extracted_error": string | null,
  "noise_reason": string | null,
  "confidence": number
}

Be conservative with "noise" — only mark as noise if there is genuinely no engineering value.`,
  tools: ["generate-embeddings"],
  input_schema: {
    feedback_item_id: "string",
  },
};

export async function runIntakeAgent(feedbackItemId: string) {
  const item = await (await import("../../lib/lemma")).default.records.get("feedback_items", feedbackItemId);

  const cleaned = (item?.raw_text as string || "")
    .replace(/[👍👎🙌🎉👏🔥💯✅❌⭐💪🤔😊😢😡💀🖤💜💙💚💛🧡❤️🤍🤎🩵🩶🩷🤍🤎🖤]/g, "")
    .trim();

  const noisePatterns = [
    /^(thanks?!?|thx|ty|ok|okay|k|👍|👎|🙌|🎉)$/i,
    /^(lol|lmao|rofl|haha)$/i,
    /^(test|testing|ignore|delete)$/i,
    /^.{0,15}$/,
  ];

  const isNoise = noisePatterns.some((p) => p.test(cleaned));
  const hasError = /error|exception|crash|timeout|fail|bug/i.test(cleaned);
  const extractedError = hasError ? cleaned.match(/(error|exception|crash|timeout)[:\s]*(.+)/i)?.[0] || null : null;

  const productAreaMatch = cleaned.match(/login|signin|auth|password/i) ? "auth" :
    cleaned.match(/payment|charge|billing|refund|checkout/i) ? "payments" :
    cleaned.match(/onboard|signup|register|setup|welcome/i) ? "onboarding" :
    cleaned.match(/ui|button|layout|style|css|render/i) ? "ui" : null;

  return {
    cleaned_text: cleaned,
    type: isNoise ? "noise" : hasError ? "bug_report" : "question",
    product_area: productAreaMatch,
    affected_platform: cleaned.match(/ios|iphone|ipad|android|mobile/i)?.[0]?.toLowerCase() || null,
    urgency_signals: [
      ...(hasError ? ["error_detected"] : []),
      ...(cleaned.match(/urgent|asap|block|critical|down/i) ? ["urgency_language"] : []),
    ],
    has_error_details: hasError,
    extracted_error: extractedError,
    noise_reason: isNoise ? "No engineering value detected" : null,
    confidence: isNoise ? 0.95 : 0.85,
  };
}
