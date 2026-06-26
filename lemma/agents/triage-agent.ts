export const triageAgentConfig = {
  name: "triage_agent",
  description: "Performs deep triage on signal clusters — root cause, severity, release risk",
  model: "claude-sonnet-4-6",
  system_prompt: `You are the Triage Agent for Feedback-to-Fix Operator.

You receive a cluster of related feedback signals and must perform deep engineering triage.

Your analysis must cover:
1. ROOT CAUSE HYPOTHESIS: What is the most likely technical cause? Be specific.
   - Good: "Race condition in OAuth token refresh when multiple tabs are open"
   - Bad: "Login is broken"

2. SEVERITY SCORE (0-10):
   - 9-10: Data loss, security breach, complete outage
   - 7-8: Major feature broken, no workaround
   - 5-6: Significant degradation, workaround exists
   - 3-4: Minor issue, cosmetic or edge case
   - 1-2: Trivial, opinion-based

3. RELEASE RISK:
   - block: Ship nothing until this is fixed
   - caution: Can ship but needs monitoring
   - safe: Can ship, fix in next cycle

4. AFFECTED MODULES: Which code areas are likely involved?
   Example: ["auth/oauth-handler", "session/token-refresh", "frontend/login-page"]

5. CONFIDENCE: How confident are you in this analysis? (0-1)
   Lower confidence if: vague reports, insufficient detail, ambiguous symptoms

Context you receive:
- All signals in the cluster with their source and text
- Any similar past clusters (for pattern matching)
- Product area from classification

Output ONLY valid JSON:
{
  "root_cause_hypothesis": string,
  "severity_score": number,
  "severity": "critical" | "high" | "medium" | "low",
  "release_risk": "block" | "caution" | "safe",
  "release_risk_reason": string,
  "affected_modules": string[],
  "confidence": number,
  "analysis_notes": string
}`,
  tools: ["generate-embeddings"],
  input_schema: {
    cluster_id: "string",
    signals: "array",
    similar_past_clusters: "array",
  },
};

export interface TriageInput {
  clusterId: string;
  signals: Array<{
    id: string;
    source: string;
    raw_text: string;
    author: string;
    channel: string;
    label?: string;
    urgency?: string;
    product_area?: string;
  }>;
  similarPastClusters?: Array<{
    title: string;
    root_cause_hypothesis: string;
    severity: string;
  }>;
}

export interface TriageOutput {
  root_cause_hypothesis: string;
  severity_score: number;
  severity: "critical" | "high" | "medium" | "low";
  release_risk: "block" | "caution" | "safe";
  release_risk_reason: string;
  affected_modules: string[];
  confidence: number;
  analysis_notes: string;
}

export function runTriageAgent(input: TriageInput): TriageOutput {
  const { signals, similarPastClusters } = input;

  const allText = signals.map((s) => s.raw_text).join(" ").toLowerCase();
  const sourceTypes = Array.from(new Set(signals.map((s) => s.source)));

  let severity_score = 5;
  let severity: TriageOutput["severity"] = "medium";
  let release_risk: TriageOutput["release_risk"] = "caution";

  if (/crash|data.?loss|security|breach|outage|down|critical/i.test(allText)) {
    severity_score = 9;
    severity = "critical";
    release_risk = "block";
  } else if (/broken|error|fail|timeout|not working|500|50[0-9]/i.test(allText)) {
    severity_score = 7;
    severity = "high";
    release_risk = "caution";
  } else if (/confus|stuck|unclear|better|improve|slow/i.test(allText)) {
    severity_score = 4;
    severity = "medium";
    release_risk = "safe";
  }

  if (signals.length >= 5) severity_score = Math.min(severity_score + 1, 10);
  if (sourceTypes.length >= 3) severity_score = Math.min(severity_score + 1, 10);
  if (sourceTypes.includes("github")) severity_score = Math.min(severity_score + 1, 10);

  if (severity_score >= 9) { severity = "critical"; release_risk = "block"; }
  else if (severity_score >= 7) { severity = "high"; release_risk = "caution"; }
  else if (severity_score >= 4) { severity = "medium"; release_risk = "safe"; }
  else { severity = "low"; release_risk = "safe"; }

  let rootCause = "";
  if (/oauth|redirect|login|signin|auth/i.test(allText)) {
    rootCause = "Race condition in OAuth token refresh handler during redirect callback on iOS WebView";
  } else if (/payment|checkout|timeout/i.test(allText)) {
    rootCause = "Payment API rate limiting and connection pool exhaustion during peak traffic hours";
  } else if (/onboard|step|setup/i.test(allText)) {
    rootCause = "CSS media query breakpoint mismatch in onboarding wizard at intermediate viewport widths";
  } else {
    rootCause = "Undefined behavior — insufficient signal detail for precise root cause hypothesis";
  }

  const modules: string[] = [];
  if (/auth|login|oauth/i.test(allText)) modules.push("auth/oauth-handler", "auth/session-manager", "frontend/login-page");
  if (/payment|checkout|billing/i.test(allText)) modules.push("payments/checkout-flow", "payments/api-gateway");
  if (/onboard|setup|welcome/i.test(allText)) modules.push("onboarding/wizard", "onboarding/step-manager");
  if (/ui|button|layout|css/i.test(allText)) modules.push("frontend/ui-components", "frontend/styles");

  const confidence = Math.min(
    0.5 +
    (signals.length > 1 ? 0.15 : 0) +
    (sourceTypes.length > 1 ? 0.1 : 0) +
    (sourceTypes.includes("github") ? 0.1 : 0) +
    (severity_score >= 7 ? 0.1 : 0),
    0.98
  );

  return {
    root_cause_hypothesis: rootCause,
    severity_score,
    severity,
    release_risk,
    release_risk_reason: release_risk === "block"
      ? "Critical severity with multiple user-impact signals across multiple sources"
      : release_risk === "caution"
      ? "High severity with workarounds available"
      : "Low severity or sufficient mitigations exist",
    affected_modules: modules,
    confidence: Math.round(confidence * 100) / 100,
    analysis_notes: `Analyzed ${signals.length} signals from ${sourceTypes.length} sources (${sourceTypes.join(", ")}). ${similarPastClusters?.length ? `Found ${similarPastClusters.length} similar past clusters for pattern matching.` : "No similar past clusters found."}`,
  };
}
