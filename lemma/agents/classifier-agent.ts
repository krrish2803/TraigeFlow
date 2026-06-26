export const classifierAgentConfig = {
  name: "classifier_agent",
  description: "Classifies feedback by type, urgency, and product area",
  model: "claude-sonnet-4-6",
  system_prompt: `You are the Classification Agent for Feedback-to-Fix Operator.

You receive a cleaned feedback signal and must classify it precisely.

Classification rules:
- CRITICAL: data loss, security breach, complete feature outage, payment failure
- HIGH: major feature broken for significant user segment, authentication issues
- MEDIUM: degraded experience, workaround exists, UI confusion
- LOW: cosmetic issues, minor UX improvements, typos

Product areas to classify into:
- auth (login, signup, OAuth, sessions, permissions)
- payments (checkout, billing, subscriptions, refunds)
- onboarding (first-time setup, tutorials, account creation)
- core_product (main feature set)
- ui (visual bugs, layout, responsiveness)
- api (API errors, rate limits, integration issues)
- performance (slow load times, timeouts, memory)
- notifications (email, push, in-app alerts)

Apply these severity boosts automatically:
- If text contains "login", "signin", "auth", "password" -> boost to at least HIGH
- If text contains "payment", "charge", "billing", "refund" -> boost to CRITICAL
- If text contains "data loss", "deleted", "gone", "missing" -> boost to CRITICAL
- If text mentions "all users", "everyone", "nobody can" -> boost by one level

Output ONLY valid JSON:
{
  "label": "bug" | "feature" | "question" | "noise" | "duplicate",
  "urgency": "critical" | "high" | "medium" | "low",
  "product_area": string,
  "severity_boost_reason": string | null,
  "classification_confidence": number,
  "key_phrases": string[]
}`,
  tools: [],
  input_schema: {
    feedback_item_id: "string",
    cleaned_text: "string",
    source: "string",
  },
};

export function runClassifierAgent(cleanedText: string, source: string): {
  label: string;
  urgency: string;
  product_area: string;
  severity_boost_reason: string | null;
  classification_confidence: number;
  key_phrases: string[];
} {
  const text = cleanedText.toLowerCase();
  const keyPhrases: string[] = [];

  let label = "bug";
  if (/feature|request|would like|suggestion|propose|wish/i.test(text)) {
    label = "feature";
  } else if (/how do|how to|what is|question|help understand|confused/i.test(text)) {
    label = "question";
  }

  let urgency = "medium";
  const severityBoosts: string[] = [];

  if (/login|signin|auth|password|oauth/i.test(text)) {
    urgency = "high";
    severityBoosts.push("Auth-related: boosted to HIGH");
    if (/crash|broken|down|error/i.test(text)) urgency = "critical";
  }

  if (/payment|charge|billing|refund|checkout|paid|purchase/i.test(text)) {
    urgency = "critical";
    severityBoosts.push("Payment-related: boosted to CRITICAL");
  }

  if (/data loss|deleted|gone|missing|lost/i.test(text)) {
    urgency = "critical";
    severityBoosts.push("Data-loss keywords: boosted to CRITICAL");
  }

  if (/all users|everyone|nobody can|whole team|everyone/i.test(text)) {
    severityBoosts.push("Widespread impact detected: boost one level");
    if (urgency === "low") urgency = "medium";
    else if (urgency === "medium") urgency = "high";
    else if (urgency === "high") urgency = "critical";
  }

  if (/crash|panic|segfault|exception|stack trace/i.test(text)) {
    keyPhrases.push("crash");
  }
  if (/timeout|slow|lag|delay/i.test(text)) {
    keyPhrases.push("performance");
  }
  if (/ui|button|style|layout|css|render/i.test(text)) {
    keyPhrases.push("ui");
  }

  let product_area = "core_product";
  if (/login|signin|auth|password|oauth|session|permission|role/i.test(text)) product_area = "auth";
  else if (/payment|charge|billing|refund|checkout|subscription/i.test(text)) product_area = "payments";
  else if (/onboard|signup|register|setup|welcome|tutorial/i.test(text)) product_area = "onboarding";
  else if (/ui|button|layout|style|css|render|theme/i.test(text)) product_area = "ui";
  else if (/api|endpoint|rate limit|integration|webhook/i.test(text)) product_area = "api";
  else if (/slow|timeout|lag|memory|perform/i.test(text)) product_area = "performance";
  else if (/email|push|notif|alert/i.test(text)) product_area = "notifications";

  return {
    label,
    urgency,
    product_area,
    severity_boost_reason: severityBoosts.length > 0 ? severityBoosts.join("; ") : null,
    classification_confidence: severityBoosts.length > 0 ? 0.92 : 0.78,
    key_phrases: Array.from(new Set(keyPhrases)),
  };
}
